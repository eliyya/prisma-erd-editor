import type { DMMF } from '@prisma/generator-helper'

import { genId } from './id.js'
import { Meta } from './Meta.js'
import type { MemoEntity } from './types.js'

export class Memo {
    readonly id: string
    readonly name: string
    #data: Readonly<DMMF.DatamodelEnum>
    #index: number
    #previous: MemoEntity | undefined

    constructor(
        data: Readonly<DMMF.DatamodelEnum>,
        index: number,
        previous?: MemoEntity,
    ) {
        this.#data = data
        this.#index = index
        this.#previous = previous
        this.name = data.dbName ?? data.name
        this.id = previous?.id ?? genId(`enum:${this.name}`)
    }

    toJSON(): MemoEntity {
        const value = [
            this.name,
            this.#data.documentation ?? '',
            ...this.#data.values.map(item => item.dbName ?? item.name),
        ]
            .filter((item, index) => index === 0 || item.length > 0)
            .join('\n')

        return {
            id: this.id,
            value,
            ui: {
                x: this.#previous?.ui.x ?? 60 + (this.#index % 6) * 220,
                y:
                    this.#previous?.ui.y ??
                    1900 + Math.floor(this.#index / 6) * 220,
                zIndex: this.#previous?.ui.zIndex ?? 1,
                width: this.#previous?.ui.width ?? 180,
                height:
                    this.#previous?.ui.height ??
                    Math.max(120, 60 + this.#data.values.length * 22),
                color: this.#previous?.ui.color ?? '',
            },
            meta: new Meta(this.#previous?.meta),
        }
    }
}
