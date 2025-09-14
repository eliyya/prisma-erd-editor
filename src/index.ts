#!/usr/bin/env node
import pgh from '@prisma/generator-helper'
import { writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { mkdir } from 'node:fs'
import ds from './default-schema.json' with { type: 'json' }
import type { ErdEditorSchema, MemoEntity, TableEntity } from './types.ts'
import { genId } from './id.ts'

const defaultSchema = ds as ErdEditorSchema
pgh.generatorHandler({
    onManifest: (gc) => {
        return {
            version: '0.0.1',
            defaultOutput: 'schema.erd',
        }
    },
    onGenerate: async ({generator,dmmf}) => {
        const {datamodel,mappings,schema} = dmmf
        const {enums, models, ...datamodelRest} = datamodel
        const enumList = new Map<string, MemoEntity>()
        let zIndex = 2
        let x = 0
        let y = 0
        // console.log('datamodel', datamodelRest)
        for (const enum_ of enums) {
            const id = genId()
            enumList.set(id, {
                id,
                ui: {
                    x: x*100,
                    y: y,
                    zIndex: zIndex++,
                    width: 100,
                    height: 100,
                    color: "",
                },
                meta: {
                    updateAt: Date.now(),
                    createAt: Date.now(),
                },
                value: `${enum_.dbName??enum_.name}\n\n${enum_.values.map((v) => v.dbName??v.name).join('\n')}`
            })
        }
        defaultSchema.collections.memoEntities = Object.fromEntries(enumList)
        defaultSchema.doc.memoIds = Array.from(enumList.keys())

        
        // const modelList = new Map<string, TableEntity>()
        // for (const model of models) {
        //     console.log(model)
        //     const id = genId()
        //     modelList.set(id, {
        //         "id": "r9NohBARMmqUpopnzzXlU",
        //         "name": "TableName",
        //         "comment": "",
        //         "columnIds": [],
        //         "seqColumnIds": [],
        //         "ui": {
        //           "x": 211,
        //           "y": 347,
        //           "zIndex": 4,
        //           "widthName": 61,
        //           "widthComment": 60,
        //           "color": ""
        //         },
        //         "meta": {
        //           "updateAt": 1757808898478,
        //           "createAt": 1757808890863
        //         }
        //       })
        //     break
        // }
        
        writeFile(generator.output!.value as string, JSON.stringify(defaultSchema))
    },
})
