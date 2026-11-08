import type { DMMF } from '@prisma/generator-helper'

import { TableColumnEntityOptionsBitField } from './BitField.js'
import { getDataType } from './constants.js'
import { genId } from './id.js'
import type { Model } from './Model.js'
import type { TableColumnEntity } from './types.js'

export class Column {
    readonly id: string
    readonly name: string
    readonly prismaName: string
    readonly data: Readonly<DMMF.Field>
    readonly model: Model
    #previous: TableColumnEntity | undefined

    constructor(
        model: Model,
        data: Readonly<DMMF.Field>,
        previous?: TableColumnEntity,
    ) {
        this.model = model
        this.data = data
        this.prismaName = data.name
        this.name = data.dbName ?? data.name
        this.#previous = previous
        this.id = previous?.id ?? genId(`column:${model.name}.${this.name}`)
    }

    toJSON(): TableColumnEntity {
        const options = new TableColumnEntityOptionsBitField()
        const primaryFields = this.model.primaryFields
        const isPrimary = primaryFields.includes(this.prismaName)
        const isSinglePrimary = isPrimary && primaryFields.length === 1

        if (this.data.isRequired) options.add('notNull')
        if (this.data.isUnique || isSinglePrimary) options.add('unique')
        if (isPrimary) options.add('primaryKey')
        if (
            isFieldDefault(this.data.default) &&
            this.data.default.name.toLowerCase() === 'autoincrement'
        ) {
            options.add('autoIncrement')
        }

        const defaultValue = formatDefault(this.data)
        return {
            id: this.id,
            tableId: this.model.id,
            name: this.name,
            ...(this.data.documentation && {
                comment: this.data.documentation,
            }),
            dataType: getDataType(this.data),
            ...(defaultValue && { default: defaultValue }),
            options: options.toNumber(),
            ...(this.#previous?.logicalName && {
                logicalName: this.#previous.logicalName,
            }),
            ...(this.#previous?.domainId && {
                domainId: this.#previous.domainId,
            }),
        }
    }
}

function formatDefault(field: Readonly<DMMF.Field>): string {
    const value = field.default
    if (value === undefined || value === null) return ''
    if (isDefaultArray(value)) {
        return `[${value.map(item => formatScalar(item, field)).join(', ')}]`
    }
    if (isFieldDefault(value)) {
        if (value.name === 'dbgenerated' && value.args.length === 1) {
            return String(value.args[0])
        }
        return `${value.name}(${value.args.join(', ')})`
    }
    return formatScalar(value, field)
}

function isDefaultArray(
    value: DMMF.Field['default'],
): value is readonly DMMF.FieldDefaultScalar[] {
    return Array.isArray(value)
}

function formatScalar(
    value: string | number | boolean,
    field: Readonly<DMMF.Field>,
) {
    if (typeof value !== 'string') return String(value)
    if (field.kind === 'enum') return value
    if (field.type !== 'String') return value
    return `'${value.replaceAll("'", "''")}'`
}

function isFieldDefault(value: unknown): value is DMMF.FieldDefault {
    return (
        typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'args' in value
    )
}
