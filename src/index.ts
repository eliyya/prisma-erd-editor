#!/usr/bin/env node
import pgh, { DMMF } from '@prisma/generator-helper'
import { writeFile } from 'node:fs/promises'
import ds from './default-schema.json' with { type: 'json' }
import type { ErdEditorSchema, MemoEntity, TableEntity } from './types.ts'
import { genId } from './id.ts'

const defaultSchema = ds as ErdEditorSchema

let zIndex = 2
let x = 0
let y = 0
const enumList = new Map<string, MemoEntity>()
const modelList = new Map<string, TableEntity>()

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
            JSON.stringify(defaultSchema),
        )
    },
})

function processEnums(enums: readonly DMMF.DatamodelEnum[]) {
    for (const enum_ of enums) {
        const id = genId()
        enumList.set(id, {
            id,
            ui: {
                x: x++ * 100,
                y: y,
                zIndex: zIndex++,
                width: 100,
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

    defaultSchema.collections.memoEntities = Object.fromEntries(enumList)
    defaultSchema.doc.memoIds = Array.from(enumList.keys())
}

function processModels(models: readonly DMMF.Model[]) {
    y++
    for (const model of models) {
        console.log(model)
        const id = genId()
        modelList.set(id, {
            id: id,
            name: model.dbName ?? model.name,
            comment: model.documentation ?? '',
            columnIds: [],
            seqColumnIds: [],
            ui: {
                x: 0,
                y: y++ * 100,
                zIndex: 4,
                widthName: 60,
                widthComment: 60,
                color: '',
            },
            meta: {
                updateAt: Date.now(),
                createAt: Date.now(),
            },
        })
    }

    defaultSchema.collections.tableEntities = Object.fromEntries(modelList)
    defaultSchema.doc.tableIds = Array.from(modelList.keys())
}
