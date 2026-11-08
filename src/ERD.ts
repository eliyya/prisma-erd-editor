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
    #previous: ErdEditorSchema | undefined

    constructor(options: ERDOptions) {
        const previous = createPreviousLookups(options.previous)
        this.#previous = options.previous
        this.settings = new Settings(
            options.provider,
            options.previous?.settings,
        )

        options.models.forEach((data, index) => {
            const name = data.dbName ?? data.name
            const previousTable = previous.tables.get(name)
            const previousColumns = previousTable
                ? previous.columns.get(previousTable.id)
                : undefined
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
        const tables = orderEntities(
            Array.from(this.models.values()),
            this.#previous?.doc.tableIds,
        )
        const relations = orderEntities(
            this.#relations,
            this.#previous?.doc.relationshipIds,
        )
        const indexes = orderEntities(
            this.#indexes,
            this.#previous?.doc.indexIds,
        )
        const memos = orderEntities(this.#memos, this.#previous?.doc.memoIds)
        const columns = tables.flatMap(model =>
            Array.from(model.columns.values()),
        )
        const indexColumns = indexes.flatMap(index => index.columns)
        const previousCollections = this.#previous?.collections
        const groups = Object.values(
            previousCollections?.tableGroupEntities ?? {},
        )
        const groupIds = orderEntities(
            groups,
            this.#previous?.doc.tableGroupIds,
        ).map(group => group.id)
        const collections = {
            ...(tables.length > 0 && {
                tableEntities: entities(tables.map(table => table.toJSON())),
            }),
            ...(columns.length > 0 && {
                tableColumnEntities: entities(
                    columns.map(column => column.toJSON()),
                ),
            }),
            ...(relations.length > 0 && {
                relationshipEntities: entities(
                    relations.map(relation => relation.toJSON()),
                ),
            }),
            ...(indexes.length > 0 && {
                indexEntities: entities(indexes.map(index => index.toJSON())),
            }),
            ...(indexColumns.length > 0 && {
                indexColumnEntities: entities(
                    indexColumns.map(column => column.toJSON()),
                ),
            }),
            ...(memos.length > 0 && {
                memoEntities: entities(memos.map(memo => memo.toJSON())),
            }),
            ...(groups.length > 0 && { tableGroupEntities: entities(groups) }),
            ...(previousCollections?.wordEntities?.rows.length && {
                wordEntities: previousCollections.wordEntities,
            }),
            ...(previousCollections?.termEntities?.rows.length && {
                termEntities: previousCollections.termEntities,
            }),
            ...(previousCollections?.domainEntities?.rows.length && {
                domainEntities: previousCollections.domainEntities,
            }),
        }

        return {
            $schema:
                'https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json',
            version: '3.0.0',
            settings: this.settings.toJSON(),
            doc: {
                ...(tables.length > 0 && {
                    tableIds: tables.map(table => table.id),
                }),
                ...(relations.length > 0 && {
                    relationshipIds: relations.map(relation => relation.id),
                }),
                ...(indexes.length > 0 && {
                    indexIds: indexes.map(index => index.id),
                }),
                ...(memos.length > 0 && {
                    memoIds: memos.map(memo => memo.id),
                }),
                ...(groupIds.length > 0 && { tableGroupIds: groupIds }),
            },
            ...(Object.keys(collections).length > 0 && { collections }),
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

    for (const table of Object.values(
        previous.collections?.tableEntities ?? {},
    )) {
        tables.set(table.name ?? '', table)
        const tableColumns = new Map<string, TableColumnEntity>()
        for (const id of table.columnIds) {
            const column = previous.collections?.tableColumnEntities?.[id]
            if (column) tableColumns.set(column.name ?? '', column)
        }
        columns.set(table.id, tableColumns)
    }

    for (const memo of Object.values(
        previous.collections?.memoEntities ?? {},
    )) {
        const [name] = (memo.value ?? '').split(/\r?\n/)
        if (name) memos.set(name, memo)
    }

    for (const relation of Object.values(
        previous.collections?.relationshipEntities ?? {},
    )) {
        const signature = getPreviousRelationSignature(previous, relation)
        if (signature) relations.set(signature, relation)
    }

    for (const index of Object.values(
        previous.collections?.indexEntities ?? {},
    )) {
        const table = previous.collections?.tableEntities?.[index.tableId]
        if (table) indexes.set(`${table.name ?? ''}:${index.name ?? ''}`, index)
    }

    return { tables, columns, memos, relations, indexes }
}

function getPreviousRelationSignature(
    schema: ErdEditorSchema,
    relation: RelationshipEntity,
) {
    const startTable =
        schema.collections?.tableEntities?.[relation.start.tableId]
    const endTable = schema.collections?.tableEntities?.[relation.end.tableId]
    if (!startTable || !endTable) return

    const startColumns = relation.start.columnIds.map(
        id => schema.collections?.tableColumnEntities?.[id]?.name ?? id,
    )
    const endColumns = relation.end.columnIds.map(
        id => schema.collections?.tableColumnEntities?.[id]?.name ?? id,
    )
    return Relation.createSignature(
        startTable.name ?? '',
        startColumns,
        endTable.name ?? '',
        endColumns,
    )
}

function entities<T extends { id: string }>(items: T[]): Record<string, T> {
    return Object.fromEntries(items.map(item => [item.id, item]))
}

function orderEntities<T extends { id: string }>(
    items: T[],
    previousIds: string[] = [],
): T[] {
    const remaining = new Map(items.map(item => [item.id, item]))
    const ordered: T[] = []
    for (const id of previousIds) {
        const item = remaining.get(id)
        if (item) {
            ordered.push(item)
            remaining.delete(id)
        }
    }
    return [...ordered, ...remaining.values()]
}
