import type { DMMF } from '@prisma/generator-helper'
import { ERD } from './ERD.ts'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'
import { Model } from './Model.ts'

export class Relation {
    #id = genId()
    #identification = false
    #relationshipType = 16
    #startRelationshipType = 2
    #start = {
        tableId: '',
        columnIds: new Set<string>(),
        x: 0,
        y: 0,
        direction: 1,
    }
    #end = {
        tableId: '',
        columnIds: new Set<string>(),
        x: 0,
        y: 0,
        direction: 1,
    }
    #meta = new Meta()
    #from: Readonly<DMMF.Field>
    #fromModel: Model
    #to: Readonly<DMMF.Field>
    #toModel: Model
    #relationName = ''

    get id() {
        return this.#id
    }

    get relationName() {
        return this.#relationName
    }

    constructor(model: Model, data: Readonly<DMMF.Field>) {
        this.#relationName = data.relationName!

        const rel = model.erd.findRelation(data.relationName!)

        if (rel) {
            if (data.relationFromFields?.length) {
                rel.setFrom(data, model)
            } else {
                rel.setTo(data, model)
            }
        } else {
            if (data.relationFromFields?.length) {
                this.#from = data
                this.#fromModel = model
            } else {
                this.#to = data
                this.#toModel = model
            }
            model.erd.addRelation(this)
        }
    }

    setFrom(from: Readonly<DMMF.Field>, model: Model) {
        this.#from = from
        this.#fromModel = model
        if (this.#to) this.#analyze()
    }

    setTo(to: Readonly<DMMF.Field>, model: Model) {
        this.#to = to
        this.#toModel = model
        if (this.#from) this.#analyze()
    }

    #analyze() {
        this.#start.tableId = this.#fromModel.id
        this.#end.tableId = this.#toModel.id

        const [fromFieldName] = this.#from.relationFromFields!
        const fromColumn = this.#fromModel.erd.findColumn(fromFieldName)!
        fromColumn.setForeignKey()
        console.log(fromColumn.toJSON())

        this.#start.columnIds.add(fromColumn.id)

        const [toFieldName] = this.#from.relationToFields!
        const toColumn = this.#toModel.erd.findColumn(toFieldName)!
        this.#end.columnIds.add(toColumn.id)

        // relationshipType
    }

    toJSON() {
        return {
            id: this.#id,
            identification: this.#identification,
            relationshipType: this.#relationshipType,
            startRelationshipType: this.#startRelationshipType,
            start: {
                tableId: this.#start.tableId,
                columnIds: Array.from(this.#start.columnIds),
                x: this.#start.x,
                y: this.#start.y,
                direction: this.#start.direction,
            },
            end: {
                tableId: this.#end.tableId,
                columnIds: Array.from(this.#end.columnIds),
                x: this.#end.x,
                y: this.#end.y,
                direction: this.#end.direction,
            },
            meta: this.#meta,
        }
    }
}
