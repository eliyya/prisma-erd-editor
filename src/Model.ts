import type { DMMF } from '@prisma/generator-helper'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'
import { ERD } from './ERD.ts'

export class Model {
    #id = genId()
    #name = ''
    #comment = ''
    #columnIds: string[] = []
    #seqColumnIds: string[] = []
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
        // processFields(this.id, options.fields)
    }

    toJSON() {
        return {
            id: this.#id,
            name: this.#name,
            comment: this.#comment,
            columnIds: this.#columnIds,
            seqColumnIds: this.#seqColumnIds,
            ui: this.#ui,
            meta: this.#meta,
        }
    }
}
