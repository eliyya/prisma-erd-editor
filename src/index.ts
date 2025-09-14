#!/usr/bin/env node
import ds from './default-schema.json' with { type: 'json' }
import type { DMMF } from '@prisma/generator-helper'
import { writeFile } from 'node:fs/promises'
import pgh from '@prisma/generator-helper'
import { genId } from './id.ts'

import type {
    ErdEditorSchema,
    MemoEntity,
    TableColumnEntity,
    TableEntity,
} from './types.ts'

import {
    TableColumnEntityKeysBitField,
    TableColumnEntityOptionsBitField,
} from './BitField.ts'
import { PRISMA_TYPES_TO_POSTGRESQL_TYPES } from './constants.ts'

const DEFAULT_SCHEMA = ds as ErdEditorSchema

let zIndex = 2
let x = 0
let y = 0
const enumList = new Map<string, MemoEntity>()
const modelList = new Map<string, TableEntity>()
let modelX = 0
let modelY = 200

pgh.generatorHandler({
    onManifest: gc => {
        return {
            version: '0.0.1',
            defaultOutput: 'schema.erd',
        }
    },
    onGenerate: async ({ generator, dmmf }) => {
        const { datamodel, mappings, schema } = dmmf
        const { enums, models, ...datamodelRest } = datamodel

        processEnums(enums)
        processModels(models)

        writeFile(
            generator.output!.value as string,
            JSON.stringify(DEFAULT_SCHEMA),
        )
    },
})

function processEnums(enums: readonly DMMF.DatamodelEnum[]) {
    for (const enum_ of enums) {
        const id = genId()
        enumList.set(id, {
            id,
            ui: {
                x: x++ * 150,
                y: y,
                zIndex: zIndex++,
                width: 120,
                height: 100,
                color: '',
            },
            meta: {
                updateAt: Date.now(),
                createAt: Date.now(),
            },
            value: `${enum_.dbName ?? enum_.name}\n\n${enum_.values.map(v => v.dbName ?? v.name).join('\n')}`,
        })
    }

    DEFAULT_SCHEMA.collections.memoEntities = Object.fromEntries(enumList)
    DEFAULT_SCHEMA.doc.memoIds = Array.from(enumList.keys())
}

function processModels(models: readonly DMMF.Model[]) {
    for (const model of models) {
        if (modelY > DEFAULT_SCHEMA.settings.height) {
            modelY = 0
            modelX += 500
        }
        // console.log(model)
        const id = genId()
        modelList.set(id, {
            id: id,
            name: model.dbName ?? model.name,
            comment: model.documentation ?? '',
            columnIds: [],
            seqColumnIds: [],
            ui: {
                x: modelX,
                y: modelY,
                zIndex: zIndex++,
                widthName: 60,
                widthComment: 60,
                color: '',
            },
            meta: {
                updateAt: Date.now(),
                createAt: Date.now(),
            },
        })

        processFields(id, model.fields)
        modelY += modelList.get(id)!.columnIds.length * 25 + 60
    }

    DEFAULT_SCHEMA.collections.tableEntities = Object.fromEntries(modelList)
    DEFAULT_SCHEMA.doc.tableIds = Array.from(modelList.keys())
}

function processFields(tableId: string, columns: readonly DMMF.Field[]) {
    const columnList = new Map<string, TableColumnEntity>()
    for (const column of columns) {
        console.log(column)
        const id = genId()
        const options = new TableColumnEntityOptionsBitField()
        if (column.isRequired) options.add('notNull')
        if (column.isUnique) options.add('unique')
        if (
            (
                column.default as {
                    name: string
                    args: Array<string | number>
                }
            )?.name === 'autoIncrement'
        )
            options.add('autoIncrement')
        const keys = new TableColumnEntityKeysBitField()
        if (column.isId) keys.add('primaryKey')
        // keys.add('foreignKey')

        columnList.set(id, {
            id,
            tableId,
            name: column.dbName ?? column.name,
            comment: column.documentation ?? '',
            dataType:
                PRISMA_TYPES_TO_POSTGRESQL_TYPES[column.type] ?? column.type,
            default: getDefault(column.default),
            options: Number(options.toBigInt()),
            ui: {
                keys: Number(keys.toBigInt()),
                widthName: 60,
                widthComment: 60,
                widthDataType: 60,
                widthDefault: 60,
            },
            meta: {
                updateAt: Date.now(),
                createAt: Date.now(),
            },
        })
    }
    DEFAULT_SCHEMA.collections.tableColumnEntities = {
        ...DEFAULT_SCHEMA.collections.tableColumnEntities,
        ...Object.fromEntries(columnList),
    }
    modelList.get(tableId)!.columnIds = Array.from(columnList.keys())
    modelList.get(tableId)!.seqColumnIds = Array.from(columnList.keys())
    return columnList
}

function getDefault(def: DMMF.Field['default']) {
    if (!def) return ''

    if (typeof def === 'string') return def
    if (typeof def === 'number') return `${def}`
    if (typeof def === 'boolean') return `${def}`
    if (Array.isArray(def)) return def.join(', ')
    if (isDef(def)) {
        if (def.name !== 'dbgenerated')
            return `${def.name}(${def.args.join(', ')})`
        if (def.args.length > 1) return `${def.name}(${def.args.join(', ')})`
        if (def.args.length === 1) return `${def.args[0]}`
        return `${def.name}(${def.args.join(', ')})`
    }

    return ''
}

type defobject = {
    name: string
    args: Array<string | number>
}
function isDef(def: unknown): def is defobject {
    if (!def) return false
    if (typeof def !== 'object') return false
    if (!('name' in def)) return false
    if (!('args' in def)) return false
    return true
}
