import type { DMMF } from '@prisma/generator-helper'

import { ERD } from './ERD.ts'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'

export class Memo {
    #id = genId()
    #value = ''
    #ui = {
        x: 0,
        y: 0,
        zIndex: 0,
        width: 100,
        height: 120,
        color: '',
    }
    #meta = new Meta()
    #erd: ERD
    #options: Readonly<DMMF.DatamodelEnum>

    get id() {
        return this.#id
    }

    constructor(erd: ERD, options: Readonly<DMMF.DatamodelEnum>) {
        this.#erd = erd
        this.#options = options
        this.#value = `${this.#options.dbName ?? this.#options.name}\n\n${this.#options.values.map(v => v.dbName ?? v.name).join('\n')}`
        this.#ui.zIndex = this.#erd.getZIndex()
        erd.addMemo(this)
    }

    toJSON() {
        return {
            id: this.#id,
            value: this.#value,
            ui: this.#ui,
            meta: this.#meta,
        }
    }
}
