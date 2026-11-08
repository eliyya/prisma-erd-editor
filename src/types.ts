export interface ErdEditorSchema {
    $schema: string
    version: '3.0.0'
    settings: Settings
    doc: Doc
    collections?: ErdEditorCollections
}

export interface ErdEditorCollections {
    tableEntities?: Record<string, TableEntity>
    tableColumnEntities?: Record<string, TableColumnEntity>
    relationshipEntities?: Record<string, RelationshipEntity>
    indexEntities?: Record<string, IndexEntity>
    indexColumnEntities?: Record<string, IndexColumnEntity>
    memoEntities?: Record<string, MemoEntity>
    tableGroupEntities?: Record<string, TableGroupEntity>
    wordEntities?: Dictionary<
        [
            'id',
            'name',
            'abbreviation',
            'englishName',
            'description',
            'synonyms',
            'forbiddenWords',
        ],
        [string, string, string?, string?, string?, string?, string?]
    >
    termEntities?: Dictionary<
        ['id', 'name', 'physicalName', 'domainId', 'description', 'synonyms'],
        [string, string, string?, string?, string?, string?]
    >
    domainEntities?: Dictionary<
        ['id', 'name', 'category', 'dataType', 'description'],
        [string, string, string?, string?, string?]
    >
}

export interface Dictionary<
    Fields extends string[],
    Row extends (string | undefined)[],
> {
    fields: Fields
    rows: Row[]
}

export interface Settings {
    originX: number
    originY: number
    zoomLevel: number
    show: number
    database: number
    databaseName: string
    canvasType:
        | 'ERD'
        | '@dineug/erd-editor/builtin-visualization'
        | '@dineug/erd-editor/builtin-schema-sql'
        | '@dineug/erd-editor/builtin-generator-code'
        | '@dineug/erd-editor/builtin-dictionary'
        | 'settings'
    language: number
    tableNameCase: number
    columnNameCase: number
    bracketType: number
    relationshipDataTypeSync: boolean
    columnOrder: number[]
    maxWidthComment: number
    lockSettings: number
    ddlScripts?: { before: string; after: string }
    nameViewMode?: 'logical' | 'both'
}

export interface Doc {
    tableIds?: string[]
    relationshipIds?: string[]
    indexIds?: string[]
    memoIds?: string[]
    tableGroupIds?: string[]
}

export interface TableEntity {
    id: string
    name?: string
    comment?: string
    logicalName?: string
    groupId?: string
    nameDerived?: true
    columnIds: string[]
    ui: {
        x: number
        y: number
        color?: string
    }
}
export const TableColumnEntityOptionsBit = {
    autoIncrement: 1,
    primaryKey: 2,
    unique: 4,
    notNull: 8,
    nameDerived: 16,
}
export interface TableColumnEntity {
    id: string
    tableId: string
    name?: string
    comment?: string
    dataType?: string
    default?: string
    logicalName?: string
    domainId?: string
    // bit value (autoIncrement: 1) | (primaryKey: 2) | (unique: 4) | (notNull: 8) | (nameDerived: 16)
    options: number
}

export interface RelationshipEntity {
    id: string
    relationshipType: number
    onDelete: number
    onUpdate: number
    start: RelationshipPoint
    end: RelationshipPoint
}

export interface IndexEntity {
    id: string
    name?: string
    tableId: string
    indexColumnIds: string[]
    unique: boolean
}

export interface IndexColumnEntity {
    id: string
    indexId: string
    columnId: string
    orderType: number
}

export interface MemoEntity {
    id: string
    value?: string
    ui: {
        x: number
        y: number
        width: number
        height: number
        color?: string
    }
}

export interface TableGroupEntity {
    id: string
    name?: string
    color?: string
    ui: { x: number; y: number; width: number; height: number }
}

export interface RelationshipPoint {
    tableId: string
    columnIds: string[]
}
