import type { DMMF } from '@prisma/generator-helper'
import { Column } from './Field.ts'
import { Memo } from './Memo.ts'
import { Model } from './Model.ts'

export class ERD {
    #$schema =
        'https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json'
    #version = '3.0.0'
    #settings: {
        widht: 200
        height: 200
        scrollTop: 0
        scrollLeft: 0
        zoomLevel: 1
        show: 431
        database: 4
        databaseName: ''
        canvasType: 'ERD'
        language: 16
        tableNameCase: 4
        columnNameCase: 2
        bracketType: 1
        relationshipDataTypeSync: true
        relationshipOptimization: false
        columnOrder: [1, 2, 4, 8, 16, 32, 64]
        maxWidthComment: -1
        ignoreSaveSettings: 0
    }
    #zIndex = 2
    #memoEntities = new Map<string, Memo>()
    #memoIds = new Set<string>()
    #modelEntities = new Map<string, Model>()
    #modelIds = new Set<string>()
    #columnEntities = new Map<string, Column>()

    get settings() {
        return { ...this.#settings } as const
    }

    constructor(
        enums: Readonly<DMMF.DatamodelEnum[]>,
        models: Readonly<DMMF.Model[]>,
    ) {
        enums.forEach(e => new Memo(this, e))
        models.forEach(m => new Model(this, m))
    }

    getZIndex() {
        return this.#zIndex++
    }

    addMemo(memo: Memo) {
        this.#memoEntities.set(memo.id, memo)
        this.#memoIds.add(memo.id)
    }

    addModel(model: Model) {
        this.#modelEntities.set(model.id, model)
        this.#modelIds.add(model.id)
    }

    addColumn(column: Column) {
        this.#columnEntities.set(column.id, column)
    }

    toJSON() {
        return {
            $schema: this.#$schema,
            version: this.#version,
            settings: this.#settings,
            doc: {
                tableIds: Array.from(this.#modelIds),
                relationshipIds: [],
                indexIds: [],
                memoIds: Array.from(this.#memoIds),
            },
            collections: {
                tableEntities: Object.fromEntries(this.#modelEntities),
                tableColumnEntities: Object.fromEntries(this.#columnEntities),
                relationshipEntities: {},
                indexEntities: {},
                indexColumnEntities: {},
                memoEntities: Object.fromEntries(this.#memoEntities),
            },
        }
    }
}
