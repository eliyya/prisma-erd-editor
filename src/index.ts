#!/usr/bin/env node
import { writeFile } from 'node:fs/promises'

import pgh from '@prisma/generator-helper'

import { ERD } from './ERD.ts'

pgh.generatorHandler({
    onManifest: () => {
        return {
            version: '0.0.1',
            defaultOutput: 'schema.erd',
        }
    },
    onGenerate: async ({ generator, dmmf }) => {
        const schema = new ERD(dmmf.datamodel.enums, dmmf.datamodel.models)

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        writeFile(
            generator.output!.value as string,
            JSON.stringify(schema.build()),
        )
    },
})
