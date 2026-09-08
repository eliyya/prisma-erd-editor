#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import pgh from '@prisma/generator-helper'

import { ERD } from './ERD.js'
import type { ErdEditorSchema } from './types.js'

pgh.generatorHandler({
    onManifest: () => ({
        version: '0.1.0',
        defaultOutput: 'schema.erd',
        prettyName: 'Prisma ERD Editor',
    }),
    onGenerate: async options => {
        const output = options.generator.output?.value
        if (!output) {
            throw new Error(
                'Prisma ERD Editor requires an output path, for example output = "../schema.erd".',
            )
        }

        const previous = await readExistingSchema(output)
        const schema = new ERD({
            enums: options.dmmf.datamodel.enums,
            models: options.dmmf.datamodel.models,
            indexes: options.dmmf.datamodel.indexes,
            provider: options.datasources[0]?.provider ?? 'postgresql',
            previous,
        }).build()

        if (previous && schemasAreEquivalent(previous, schema)) return

        await mkdir(dirname(output), { recursive: true })
        await writeFile(output, `${JSON.stringify(schema, null, 2)}\n`, 'utf8')
    },
})

async function readExistingSchema(
    path: string,
): Promise<ErdEditorSchema | undefined> {
    try {
        const value: unknown = JSON.parse(await readFile(path, 'utf8'))
        if (
            typeof value === 'object' &&
            value !== null &&
            'version' in value &&
            value.version === '3.0.0' &&
            'collections' in value
        ) {
            return value as ErdEditorSchema
        }
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === 'ENOENT'
        ) {
            return
        }
        throw error
    }
    return
}

function schemasAreEquivalent(
    previous: ErdEditorSchema,
    generated: ErdEditorSchema,
) {
    return stableSchemaValue(previous) === stableSchemaValue(generated)
}

function stableSchemaValue(schema: ErdEditorSchema) {
    return JSON.stringify(schema, (key, value: unknown) =>
        key === 'updateAt' || key === 'createAt' ? undefined : value,
    )
}
