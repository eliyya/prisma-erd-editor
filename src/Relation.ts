import type { DMMF } from '@prisma/generator-helper'

import {
    Direction,
    RelationshipType,
    StartRelationshipType,
} from './constants.js'
import { genId } from './id.js'
import { Meta } from './Meta.js'
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
    #previous: RelationshipEntity | undefined

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
        this.#previous = previous

        this.#fromColumnIds = (fromField.relationFromFields ?? []).map(name => {
            const column = fromModel.findColumn(name)
            if (!column) {
                throw new Error(
                    `Relation ${fromField.relationName} references missing field ${fromModel.prismaName}.${name}`,
                )
            }
            column.setForeignKey()
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
        const isIdentifying =
            this.#fromColumnIds.length > 0 &&
            (this.#fromField.relationFromFields ?? []).every(field =>
                this.#fromModel.primaryFields.includes(field),
            )
        const required = (this.#fromField.relationFromFields ?? []).every(
            field => this.#fromModel.findColumn(field)?.data.isRequired,
        )
        const toMany = this.#toField?.isList ?? false

        const startPosition = relationshipPoint(
            this.#toModel,
            this.#fromModel,
            true,
        )
        const endPosition = relationshipPoint(
            this.#fromModel,
            this.#toModel,
            false,
        )

        return {
            id: this.id,
            identification: isIdentifying,
            relationshipType:
                toMany ? RelationshipType.oneN : RelationshipType.oneOnly,
            startRelationshipType:
                required ?
                    StartRelationshipType.dash
                :   StartRelationshipType.ring,
            start: {
                tableId: this.#toModel.id,
                columnIds: this.#toColumnIds,
                x: this.#previous?.start.x ?? startPosition.x,
                y: this.#previous?.start.y ?? startPosition.y,
                direction:
                    this.#previous?.start.direction ?? startPosition.direction,
            },
            end: {
                tableId: this.#fromModel.id,
                columnIds: this.#fromColumnIds,
                x: this.#previous?.end.x ?? endPosition.x,
                y: this.#previous?.end.y ?? endPosition.y,
                direction:
                    this.#previous?.end.direction ?? endPosition.direction,
            },
            meta: new Meta(this.#previous?.meta),
        }
    }
}

function findColumnName(model: Model, id: string) {
    for (const column of model.columns.values()) {
        if (column.id === id) return column.name
    }
    return id
}

function relationshipPoint(model: Model, other: Model, start: boolean) {
    const isLeft = model.position.x < other.position.x
    const x = model.position.x + (isLeft ? 360 : 0)
    const y = model.position.y + 70
    return {
        x,
        y,
        direction:
            isLeft ?
                start ? Direction.right
                :   Direction.left
            : start ? Direction.left
            : Direction.right,
    }
}
