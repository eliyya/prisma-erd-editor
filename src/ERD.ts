import type { DMMF } from '@prisma/generator-helper'

import { DatabaseIndex } from './DatabaseIndex.js'
import { Memo } from './Memo.js'
import { Model } from './Model.js'
import { Relation } from './Relation.js'
import { Settings } from './Settings.js'
import type {
    ErdEditorSchema,
    IndexEntity,
    MemoEntity,
    RelationshipEntity,
    TableColumnEntity,
    TableEntity,
} from './types.js'

type ERDOptions = {
    enums: readonly DMMF.DatamodelEnum[]
    models: readonly DMMF.Model[]
    indexes: readonly DMMF.Index[]
    provider: string
    previous: ErdEditorSchema | undefined
}

export class ERD {
    readonly settings: Settings
    readonly models = new Map<string, Model>()
    #memos: Memo[]
    #relations: Relation[] = []
    #indexes: DatabaseIndex[] = []

    constructor(options: ERDOptions) {
        const previous = createPreviousLookups(options.previous)
        const dimensions = calculateDimensions(
            options.models.length,
            options.enums.length,
        )
        this.settings = new Settings(
            options.provider,
            options.previous?.settings,
            dimensions,
        )

        options.models.forEach((data, index) => {
            const name = data.dbName ?? data.name
            const previousTable = previous.tables.get(name)
            const previousColumns =
                previousTable ?
                    previous.columns.get(previousTable.id)
                :   undefined
            const model = new Model(data, index, previousTable, previousColumns)
            this.models.set(data.name, model)
        })

        this.#memos = options.enums.map((data, index) => {
            const name = data.dbName ?? data.name
            return new Memo(data, index, previous.memos.get(name))
        })

        this.#createRelations(previous.relations)
        this.#createIndexes(options.indexes, previous.indexes)
    }

    #createRelations(
        previousRelations: ReadonlyMap<string, RelationshipEntity>,
    ) {
        for (const fromModel of this.models.values()) {
            for (const field of fromModel.data.fields) {
                if (
                    field.kind !== 'object' ||
                    !field.relationFromFields?.length
                ) {
                    continue
                }

                const toModel = this.models.get(field.type)
                if (!toModel) continue

                const toField = toModel.data.fields.find(
                    candidate =>
                        candidate.kind === 'object' &&
                        candidate.relationName === field.relationName &&
                        candidate.type === fromModel.prismaName &&
                        candidate.name !== field.name,
                )
                const signature = Relation.createSignature(
                    toModel.name,
                    (field.relationToFields ?? []).map(
                        name => toModel.findColumn(name)?.name ?? name,
                    ),
                    fromModel.name,
                    field.relationFromFields.map(
                        name => fromModel.findColumn(name)?.name ?? name,
                    ),
                )
                this.#relations.push(
                    new Relation(
                        fromModel,
                        toModel,
                        field,
                        toField,
                        previousRelations.get(signature),
                    ),
                )
            }
        }
    }

    #createIndexes(
        indexes: readonly DMMF.Index[],
        previousIndexes: ReadonlyMap<string, IndexEntity>,
    ) {
        for (const data of indexes) {
            if (data.type === 'id') continue
            if (data.type === 'unique' && data.fields.length === 1) continue

            const model = this.models.get(data.model)
            if (!model) continue
            const name =
                data.dbName ??
                data.name ??
                `${model.name}_${data.fields.map(field => field.name).join('_')}_idx`
            this.#indexes.push(
                new DatabaseIndex(
                    model,
                    data,
                    previousIndexes.get(`${model.name}:${name}`),
                ),
            )
        }
    }

    build(): ErdEditorSchema {
        const tables = Array.from(this.models.values())
        const columns = tables.flatMap(model =>
            Array.from(model.columns.values()),
        )
        const indexColumns = this.#indexes.flatMap(index => index.columns)

        return {
            $schema:
                'https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json',
            version: '3.0.0',
            settings: this.settings.toJSON(),
            doc: {
                tableIds: tables.map(table => table.id),
                relationshipIds: this.#relations.map(relation => relation.id),
                indexIds: this.#indexes.map(index => index.id),
                memoIds: this.#memos.map(memo => memo.id),
            },
            collections: {
                tableEntities: Object.fromEntries(
                    tables.map(table => [table.id, table.toJSON()]),
                ),
                tableColumnEntities: Object.fromEntries(
                    columns.map(column => [column.id, column.toJSON()]),
                ),
                relationshipEntities: Object.fromEntries(
                    this.#relations.map(relation => [
                        relation.id,
                        relation.toJSON(),
                    ]),
                ),
                indexEntities: Object.fromEntries(
                    this.#indexes.map(index => [index.id, index.toJSON()]),
                ),
                indexColumnEntities: Object.fromEntries(
                    indexColumns.map(column => [column.id, column.toJSON()]),
                ),
                memoEntities: Object.fromEntries(
                    this.#memos.map(memo => [memo.id, memo.toJSON()]),
                ),
            },
        }
    }
}

function createPreviousLookups(previous?: ErdEditorSchema) {
    const tables = new Map<string, TableEntity>()
    const columns = new Map<string, Map<string, TableColumnEntity>>()
    const memos = new Map<string, MemoEntity>()
    const relations = new Map<string, RelationshipEntity>()
    const indexes = new Map<string, IndexEntity>()

    if (!previous) return { tables, columns, memos, relations, indexes }

    for (const table of Object.values(previous.collections.tableEntities)) {
        tables.set(table.name, table)
        const tableColumns = new Map<string, TableColumnEntity>()
        for (const id of table.columnIds) {
            const column = previous.collections.tableColumnEntities[id]
            if (column) tableColumns.set(column.name, column)
        }
        columns.set(table.id, tableColumns)
    }

    for (const memo of Object.values(previous.collections.memoEntities)) {
        const [name] = memo.value.split(/\r?\n/)
        if (name) memos.set(name, memo)
    }

    for (const relation of Object.values(
        previous.collections.relationshipEntities,
    )) {
        const signature = getPreviousRelationSignature(previous, relation)
        if (signature) relations.set(signature, relation)
    }

    for (const index of Object.values(previous.collections.indexEntities)) {
        const table = previous.collections.tableEntities[index.tableId]
        if (table) indexes.set(`${table.name}:${index.name}`, index)
    }

    return { tables, columns, memos, relations, indexes }
}

function getPreviousRelationSignature(
    schema: ErdEditorSchema,
    relation: RelationshipEntity,
) {
    const startTable = schema.collections.tableEntities[relation.start.tableId]
    const endTable = schema.collections.tableEntities[relation.end.tableId]
    if (!startTable || !endTable) return

    const startColumns = relation.start.columnIds.map(
        id => schema.collections.tableColumnEntities[id]?.name ?? id,
    )
    const endColumns = relation.end.columnIds.map(
        id => schema.collections.tableColumnEntities[id]?.name ?? id,
    )
    return Relation.createSignature(
        startTable.name,
        startColumns,
        endTable.name,
        endColumns,
    )
}

function calculateDimensions(modelCount: number, enumCount: number) {
    const modelRows = Math.ceil(modelCount / 4)
    const enumRows = Math.ceil(enumCount / 6)
    return {
        width: 2000,
        height: Math.max(2000, modelRows * 360 + enumRows * 220 + 400),
    }
}
