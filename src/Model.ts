import type { DMMF } from '@prisma/generator-helper'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'
import { ERD } from './ERD.ts'
import { Column } from './Field.ts'
import { Relation } from './Relation.ts'

export class Model {
    #id = genId()
    #name = ''
    #comment = ''
    #columnIds = new Set<string>()
    #seqColumnIds = new Set<string>()
    #ui = {
        x: 0,
        y: 0,
        zIndex: 0,
        widthName: 60,
        widthComment: 60,
        color: '',
    }
    #meta = new Meta()
    #erd: ERD
    #data: Readonly<DMMF.Model>

    get id() {
        return this.#id
    }

    get erd() {
        return this.#erd
    }

    constructor(erd: ERD, data: Readonly<DMMF.Model>) {
        this.#erd = erd
        this.#data = data

        this.#name = data.dbName ?? data.name
        this.#comment = data.documentation ?? ''
        this.#ui.zIndex = this.#erd.getZIndex()

        this.#erd.addModel(this)
    }

    analyze() {
        this.#data.fields
            .filter(f => !f.relationName)
            .forEach(f => {
                const column = new Column(this, f)
                this.#columnIds.add(column.id)
                this.#seqColumnIds.add(column.id)
                this.#erd.addColumn(column)
            })
        this.#data.fields
            .filter(f => f.relationName)
            .forEach(f => {
                new Relation(this, f)
            })
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            comment: this.#comment,
            columnIds: Array.from(this.#columnIds),
            seqColumnIds: Array.from(this.#seqColumnIds),
            ui: this.#ui,
            meta: this.#meta,
        }
    }
}
