export interface ErdEditorSchema {
    $schema?: string
    version: '3.0.0'
    settings: Settings
    doc: Doc
    collections: {
        tableEntities: Record<string, TableEntity>
        tableColumnEntities: Record<string, TableColumnEntity>
        relationshipEntities: Record<string, RelationshipEntity>
        indexEntities: Record<string, IndexEntity>
        indexColumnEntities: Record<string, IndexColumnEntity>
        memoEntities: Record<string, MemoEntity>
    }
}

export interface Settings {
    width: number
    height: number
    scrollTop: number
    scrollLeft: number
    zoomLevel: number
    show: number
    database?: number
    databaseName?: string
    canvasType:
        | 'ERD'
        | '@dineug/erd-editor/builtin-visualization'
        | '@dineug/erd-editor/builtin-schema-sql'
        | '@dineug/erd-editor/builtin-generator-code'
        | 'settings'
    language: number
    tableNameCase: number
    columnNameCase: number
    bracketType: number
    relationshipDataTypeSync: boolean
    relationshipOptimization: boolean
    columnOrder: number[]
    maxWidthComment: number
    ignoreSaveSettings?: number
}

export interface Doc {
    tableIds?: string[]
    relationshipIds?: string[]
    indexIds?: string[]
    memoIds?: string[]
}

export interface TableEntity {
    id: string
    name: string
    comment: string
    columnIds: string[]
    seqColumnIds: string[]
    ui: {
        x: number
        y: number
        zIndex: number
        widthName: number
        widthComment: number
        color: string
    }
    meta: EntityMeta
}
export const TableColumnEntityOptionsBit = {
    autoIncrement: 1,
    primaryKey: 2,
    unique: 4,
    notNull: 8,
}
export interface TableColumnEntity {
    id: string
    tableId: string
    name: string
    comment: string
    dataType: string
    default: string
    // bit value (autoIncrement: 1) | (primaryKey: 2) | (unique: 4) | (notNull: 8)
    options: number
    ui: {
        keys: number
        widthName: number
        widthComment: number
        widthDataType: number
        widthDefault: number
    }
    meta: EntityMeta
}

export interface RelationshipEntity {
    id: string
    identification: boolean
    relationshipType: number
    startRelationshipType: number
    start: RelationshipPoint
    end: RelationshipPoint
    meta: EntityMeta
}

export interface IndexEntity {
    id: string
    name: string
    tableId: string
    indexColumnIds: string[]
    seqIndexColumnIds: string[]
    unique: boolean
    meta: EntityMeta
}

export interface IndexColumnEntity {
    id: string
    indexId: string
    columnId: string
    orderType: number
    meta: EntityMeta
}

export interface MemoEntity {
    id: string
    value: string
    ui: {
        x: number
        y: number
        zIndex: number
        width: number
        height: number
        color: string
    }
    meta: EntityMeta
}

export interface EntityMeta {
    updateAt: number
    createAt: number
}

export interface RelationshipPoint {
    tableId: string
    columnIds: string[]
    x: number
    y: number
    direction: number
}
