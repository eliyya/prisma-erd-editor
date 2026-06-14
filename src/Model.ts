import type { DMMF } from '@prisma/generator-helper'

import { Column } from './Field.js'
import { genId } from './id.js'
import { Meta } from './Meta.js'
import type {
    TableColumnEntity,
    TableEntity,
    TableEntity as PreviousTable,
} from './types.js'

export class Model {
    readonly id: string
    readonly name: string
    readonly prismaName: string
    readonly data: Readonly<DMMF.Model>
    readonly columns = new Map<string, Column>()
    readonly primaryFields: readonly string[]
    readonly position: { x: number; y: number }
    #previous: PreviousTable | undefined

    constructor(
        data: Readonly<DMMF.Model>,
        index: number,
        previous?: PreviousTable,
        previousColumns: ReadonlyMap<string, TableColumnEntity> = new Map(),
    ) {
        this.data = data
        this.prismaName = data.name
        this.name = data.dbName ?? data.name
        this.#previous = previous
        this.id = previous?.id ?? genId(`table:${this.name}`)
        this.primaryFields =
            data.primaryKey?.fields ??
            data.fields.filter(field => field.isId).map(field => field.name)

        const columnsPerRow = 4
        this.position = previous?.ui ?? {
            x: 60 + (index % columnsPerRow) * 440,
            y: 60 + Math.floor(index / columnsPerRow) * 360,
        }

        for (const field of data.fields.filter(
            field => field.kind !== 'object',
        )) {
            const physicalName = field.dbName ?? field.name
            const column = new Column(
                this,
                field,
                previousColumns.get(physicalName),
            )
            this.columns.set(field.name, column)
        }
    }

    findColumn(prismaName: string) {
        return this.columns.get(prismaName)
    }

    toJSON(): TableEntity {
        const columnIds = Array.from(this.columns.values(), column => column.id)
        return {
            id: this.id,
            name: this.name,
            comment: this.data.documentation ?? '',
            columnIds,
            seqColumnIds: columnIds,
            ui: {
                x: this.position.x,
                y: this.position.y,
                zIndex: this.#previous?.ui.zIndex ?? 2,
                widthName:
                    this.#previous?.ui.widthName ??
                    Math.max(60, Math.ceil(this.name.length * 5.5)),
                widthComment: this.#previous?.ui.widthComment ?? 60,
                color: this.#previous?.ui.color ?? '',
            },
            meta: new Meta(this.#previous?.meta),
        }
    }
}
