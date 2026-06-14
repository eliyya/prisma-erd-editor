import type { DMMF } from '@prisma/generator-helper'

import { IndexOrder } from './constants.js'
import { genId } from './id.js'
import { Meta } from './Meta.js'
import type { Model } from './Model.js'
import type { IndexColumnEntity, IndexEntity } from './types.js'

export class DatabaseIndex {
    readonly id: string
    readonly name: string
    readonly columns: DatabaseIndexColumn[]
    #data: Readonly<DMMF.Index>
    #model: Model
    #previous: IndexEntity | undefined

    constructor(
        model: Model,
        data: Readonly<DMMF.Index>,
        previous?: IndexEntity,
    ) {
        this.#model = model
        this.#data = data
        this.#previous = previous
        this.name =
            data.dbName ??
            data.name ??
            `${model.name}_${data.fields.map(field => field.name).join('_')}_idx`
        this.id = previous?.id ?? genId(`index:${model.name}:${this.name}`)
        this.columns = data.fields.map(
            (field, index) =>
                new DatabaseIndexColumn(
                    this,
                    model,
                    field,
                    index,
                    previous?.indexColumnIds[index],
                ),
        )
    }

    toJSON(): IndexEntity {
        const indexColumnIds = this.columns.map(column => column.id)
        return {
            id: this.id,
            name: this.name,
            tableId: this.#model.id,
            indexColumnIds,
            seqIndexColumnIds: indexColumnIds,
            unique: this.#data.type === 'unique',
            meta: new Meta(this.#previous?.meta),
        }
    }
}

class DatabaseIndexColumn {
    readonly id: string
    #index: DatabaseIndex
    #data: Readonly<DMMF.IndexField>
    #columnId: string

    constructor(
        index: DatabaseIndex,
        model: Model,
        data: Readonly<DMMF.IndexField>,
        position: number,
        previousId?: string,
    ) {
        this.#index = index
        this.#data = data
        this.id =
            previousId ??
            genId(`index-column:${index.id}:${data.name}:${position}`)

        const field = model.findColumn(data.name)
        if (!field) {
            throw new Error(
                `Index ${index.name} references missing field ${data.name}`,
            )
        }
        this.#columnId = field.id
    }

    toJSON(): IndexColumnEntity {
        return {
            id: this.id,
            indexId: this.#index.id,
            columnId: this.#columnId,
            orderType:
                this.#data.sortOrder?.toLowerCase() === 'desc' ?
                    IndexOrder.desc
                :   IndexOrder.asc,
            meta: new Meta(),
        }
    }
}
