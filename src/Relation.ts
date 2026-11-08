import type { DMMF } from '@prisma/generator-helper'

import { ReferentialAction, RelationshipType } from './constants.js'
import { genId } from './id.js'
import type { Model } from './Model.js'
import type { RelationshipEntity } from './types.js'

export class Relation {
    readonly id: string
    readonly signature: string
    #fromModel: Model
    #toModel: Model
    #fromField: Readonly<DMMF.Field>
    #toField: Readonly<DMMF.Field> | undefined
    #fromColumnIds: string[]
    #toColumnIds: string[]

    constructor(
        fromModel: Model,
        toModel: Model,
        fromField: Readonly<DMMF.Field>,
        toField?: Readonly<DMMF.Field>,
        previous?: RelationshipEntity,
    ) {
        this.#fromModel = fromModel
        this.#toModel = toModel
        this.#fromField = fromField
        this.#toField = toField

        this.#fromColumnIds = (fromField.relationFromFields ?? []).map(name => {
            const column = fromModel.findColumn(name)
            if (!column) {
                throw new Error(
                    `Relation ${fromField.relationName} references missing field ${fromModel.prismaName}.${name}`,
                )
            }
            return column.id
        })
        this.#toColumnIds = (fromField.relationToFields ?? []).map(name => {
            const column = toModel.findColumn(name)
            if (!column) {
                throw new Error(
                    `Relation ${fromField.relationName} references missing field ${toModel.prismaName}.${name}`,
                )
            }
            return column.id
        })

        this.signature = Relation.createSignature(
            toModel.name,
            this.#toColumnIds.map(id => findColumnName(toModel, id)),
            fromModel.name,
            this.#fromColumnIds.map(id => findColumnName(fromModel, id)),
        )
        this.id =
            previous?.id ??
            genId(
                `relation:${fromModel.name}:${fromField.relationName}:${this.#fromColumnIds.join(',')}`,
            )
    }

    static createSignature(
        startTable: string,
        startColumns: readonly string[],
        endTable: string,
        endColumns: readonly string[],
    ) {
        return `${startTable}(${startColumns.join(',')})->${endTable}(${endColumns.join(',')})`
    }

    toJSON(): RelationshipEntity {
        const toMany = this.#toField?.isList ?? false

        return {
            id: this.id,
            relationshipType: toMany
                ? RelationshipType.oneN
                : RelationshipType.oneOnly,
            onDelete: referentialAction(this.#fromField.relationOnDelete),
            onUpdate: referentialAction(this.#fromField.relationOnUpdate),
            start: {
                tableId: this.#toModel.id,
                columnIds: this.#toColumnIds,
            },
            end: {
                tableId: this.#fromModel.id,
                columnIds: this.#fromColumnIds,
            },
        }
    }
}

function findColumnName(model: Model, id: string) {
    for (const column of model.columns.values()) {
        if (column.id === id) return column.name
    }
    return id
}

function referentialAction(action: string | undefined) {
    return ReferentialAction[action ?? ''] ?? 1
}
