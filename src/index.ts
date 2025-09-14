#!/usr/bin/env node
import type { DMMF } from '@prisma/generator-helper'
import { writeFile } from 'node:fs/promises'
import pgh from '@prisma/generator-helper'
import { ERD } from './ERD.ts'

import { Memo } from './Memo.ts'
import { Model } from './Model.ts'

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

        const schema = new ERD(dmmf.datamodel.enums, dmmf.datamodel.models)

        writeFile(generator.output!.value as string, JSON.stringify(schema))
    },
})
