import type { DMMF } from '@prisma/generator-helper'
import {
    TableColumnEntityKeysBitField,
    TableColumnEntityOptionsBitField,
} from './BitField.ts'
import { genId } from './id.ts'
import { Meta } from './Meta.ts'
import { Model } from './Model.ts'
import { PRISMA_TYPES_TO_POSTGRESQL_TYPES } from './constants.ts'

export class Column {
    #id = genId()
    #name = ''
    #comment = ''
    #dataType = ''
    #default = ''
    #options = new TableColumnEntityOptionsBitField()
    #ui = {
        keys: new TableColumnEntityKeysBitField(),
        widthName: 60,
        widthComment: 60,
        widthDataType: 60,
        widthDefault: 60,
    }
    #meta = new Meta()
    #model: Model
    #data: Readonly<DMMF.Field>

    get id() {
        return this.#id
    }

    get name() {
        return this.#name
    }

    constructor(model: Model, data: Readonly<DMMF.Field>) {
        this.#model = model
        this.#data = data
        this.#name = data.dbName ?? data.name
        this.#comment = data.documentation ?? ''
        this.#dataType =
            PRISMA_TYPES_TO_POSTGRESQL_TYPES[data.type] ?? data.type

        if (data.isRequired) this.#options.add('notNull')
        if (data.isUnique) this.#options.add('unique')
        if (
            this.#isField(data.default) &&
            data.default.name === 'autoIncrement'
        ) {
            this.#options.add('autoIncrement')
        }
        if (data.isId) {
            this.#options.add('primaryKey')
            this.#ui.keys.add('primaryKey')
        }
        this.#default = this.#getDefault(data.default)
    }

    #isField(field: unknown): field is FieldOption {
        if (!field) return false
        if (typeof field !== 'object') return false
        if (!('name' in field)) return false
        if (!('args' in field)) return false
        return true
    }

    setForeignKey() {
        console.log('setForeignKey', this.name, this.#ui.keys)
        this.#ui.keys.add('foreignKey')
        console.log('setForeignKey', this.name, this.#ui.keys)
    }

    removeForeignKey() {
        this.#ui.keys.remove('foreignKey')
    }

    #getDefault(def: DMMF.Field['default']) {
        if (!def) return ''

        if (typeof def === 'string') return def
        if (typeof def === 'number') return `${def}`
        if (typeof def === 'boolean') return `${def}`
        if (Array.isArray(def)) return def.join(', ')
        if (this.#isField(def)) {
            if (def.name !== 'dbgenerated')
                return `${def.name}(${def.args.join(', ')})`
            if (def.args.length > 1)
                return `${def.name}(${def.args.join(', ')})`
            if (def.args.length === 1) return `${def.args[0]}`
            return `${def.name}(${def.args.join(', ')})`
        }

        return ''
    }

    toJSON() {
        return {
            id: this.#id,
            tableId: this.#model.id,
            name: this.#name,
            comment: this.#comment,
            dataType: this.#dataType,
            default: this.#default,
            options: this.#options.toNumber(),
            ui: {
                ...this.#ui,
                keys: this.#ui.keys.toNumber(),
            },
            meta: this.#meta,
        }
    }
}

type FieldOption = {
    name: string
    args: Array<string | number>
}
