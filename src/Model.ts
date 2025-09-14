import type { DMMF } from '@prisma/generator-helper'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'
import { ERD } from './ERD.ts'
import { Column } from './Field.ts'

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
    #options: Readonly<DMMF.Model>

    get id() {
        return this.#id
    }

    constructor(erd: ERD, options: Readonly<DMMF.Model>) {
        this.#erd = erd
        this.#options = options

        this.#name = options.dbName ?? options.name
        this.#comment = options.documentation ?? ''
        this.#ui.zIndex = this.#erd.getZIndex()

        this.#erd.addModel(this)
        options.fields
            .filter(f => !f.relationName)
            .forEach(f => {
                const column = new Column(this, f)
                this.#columnIds.add(column.id)
                this.#seqColumnIds.add(column.id)
                this.#erd.addColumn(column)
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
