import type { DMMF } from '@prisma/generator-helper'

import { Column } from './Field.ts'
import { Memo } from './Memo.ts'
import { Model } from './Model.ts'
import { Relation } from './Relation.ts'
import { Settings } from './Settings.ts'

export class ERD {
    #$schema =
        'https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json'
    #version = '3.0.0'
    #settings = new Settings()
    #zIndex = 2
    #memoEntities = new Map<string, Memo>()
    #memoIds = new Set<string>()
    #modelEntities = new Map<string, Model>()
    #modelIds = new Set<string>()
    #columnEntities = new Map<string, Column>()
    #relationEntities = new Map<string, Relation>()
    #relationIds = new Set<string>()

    get settings() {
        return this.#settings
    }

    get models(): ReadonlyMap<string, Model> {
        return this.#modelEntities
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

    findRelation(name: string) {
        for (const relation of this.#relationEntities.values()) {
            if (relation.relationName === name) return relation
        }
    }

    findColumn(name: string) {
        for (const column of this.#columnEntities.values()) {
            if (column.name === name) return column
        }
    }

    addRelation(relation: Relation) {
        this.#relationEntities.set(relation.id, relation)
        this.#relationIds.add(relation.id)
    }

    build() {
        for (const model of this.#modelEntities.values()) {
            model.analyze()
        }
        return this.toJSON()
    }

    toJSON() {
        return {
            $schema: this.#$schema,
            version: this.#version,
            settings: this.#settings,
            doc: {
                tableIds: Array.from(this.#modelIds),
                relationshipIds: Array.from(this.#relationIds),
                indexIds: [],
                memoIds: Array.from(this.#memoIds),
            },
            collections: {
                tableEntities: Object.fromEntries(this.#modelEntities),
                tableColumnEntities: Object.fromEntries(this.#columnEntities),
                relationshipEntities: Object.fromEntries(
                    this.#relationEntities,
                ),
                indexEntities: {},
                indexColumnEntities: {},
                memoEntities: Object.fromEntries(this.#memoEntities),
            },
        }
    }
}
