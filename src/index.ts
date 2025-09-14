#!/usr/bin/env node
import type { DMMF } from '@prisma/generator-helper'
import { writeFile } from 'node:fs/promises'
import pgh from '@prisma/generator-helper'
import { genId } from './id.ts'
import { ERD } from './ERD.ts'

import type { MemoEntity, TableColumnEntity, TableEntity } from './types.ts'

import {
    TableColumnEntityKeysBitField,
    TableColumnEntityOptionsBitField,
} from './BitField.ts'
import { PRISMA_TYPES_TO_POSTGRESQL_TYPES } from './constants.ts'
import { Memo } from './Memo.ts'
import { Model } from './Model.ts'

const schema = new ERD()

let zIndex = 2
let x = 0
let y = 0
const enumList = new Map<string, Memo>()
const modelList = new Map<string, TableEntity>()
const modelListByName = new Map<string, TableEntity>()
let modelX = 0
let modelY = 0
const relations: (DMMF.Field & { tableId: string })[] = []

pgh.generatorHandler({
    onManifest: gc => {
        return {
            version: '0.0.1',
            defaultOutput: 'schema.erd',
        }
    },
    onGenerate: async ({ generator, dmmf }) => {
        const { datamodel, mappings } = dmmf
        const { models, ...datamodelRest } = datamodel

        dmmf.datamodel.enums.forEach(e => new Memo(schema, e))
        dmmf.datamodel.models.forEach(m => new Model(schema, m))
        processRelations()

        writeFile(generator.output!.value as string, JSON.stringify(schema))
    },
})

// function processFields(tableId: string, columns: readonly DMMF.Field[]) {
//     const columnList = new Map<string, TableColumnEntity>()
//     for (const column of columns) {
//         // console.log(column)
//         // Skip relations
//         if (column.relationName) {
//             relations.push({
//                 ...column,
//                 tableId,
//             })
//             continue
//         }

//         const id = genId()
//         const options = new TableColumnEntityOptionsBitField()
//         if (column.isRequired) options.add('notNull')
//         if (column.isUnique) options.add('unique')
//         if (
//             (
//                 column.default as {
//                     name: string
//                     args: Array<string | number>
//                 }
//             )?.name === 'autoIncrement'
//         )
//             options.add('autoIncrement')
//         const keys = new TableColumnEntityKeysBitField()
//         if (column.isId) keys.add('primaryKey')
//         // keys.add('foreignKey')

//         columnList.set(id, {
//             id,
//             tableId,
//             name: column.dbName ?? column.name,
//             comment: column.documentation ?? '',
//             dataType:
//                 PRISMA_TYPES_TO_POSTGRESQL_TYPES[column.type] ?? column.type,
//             default: getDefault(column.default),
//             options: Number(options.toBigInt()),
//             ui: {
//                 keys: Number(keys.toBigInt()),
//                 widthName: 60,
//                 widthComment: 60,
//                 widthDataType: 60,
//                 widthDefault: 60,
//             },
//             meta: {
//                 updateAt: Date.now(),
//                 createAt: Date.now(),
//             },
//         })
//     }
//     schema.collections.tableColumnEntities = {
//         ...schema.collections.tableColumnEntities,
//         ...Object.fromEntries(columnList),
//     }
//     modelList.get(tableId)!.columnIds = Array.from(columnList.keys())
//     modelList.get(tableId)!.seqColumnIds = Array.from(columnList.keys())
//     return columnList
// }

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

function processRelations() {
    console.log(modelListByName)

    for (const relation of relations) {
        const fromtable = modelList.get(relation.tableId)!
        const totable = modelListByName.get(relation.type)!

        // console.log(relation.name, relation, totable?.id)
    }
}
