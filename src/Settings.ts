import { DATABASE_BY_PROVIDER } from './constants.js'
import type { Settings as SettingsSchema } from './types.js'

export class Settings {
    readonly width: number
    readonly height: number
    readonly scrollTop: number
    readonly scrollLeft: number
    readonly zoomLevel: number
    readonly show = 511
    readonly database: number
    readonly databaseName: string
    readonly canvasType = 'ERD' as const
    readonly language = 16
    readonly tableNameCase = 4
    readonly columnNameCase = 2
    readonly bracketType = 1
    readonly relationshipDataTypeSync = true
    readonly relationshipOptimization = false
    readonly columnOrder = [1, 2, 4, 8, 16, 32, 64]
    readonly maxWidthComment = -1
    readonly ignoreSaveSettings = 3

    constructor(
        provider: string,
        previous?: Partial<SettingsSchema>,
        dimensions = { width: 2000, height: 2000 },
    ) {
        this.width = clamp(
            Math.max(previous?.width ?? 0, dimensions.width),
            2000,
            20000,
        )
        this.height = clamp(
            Math.max(previous?.height ?? 0, dimensions.height),
            2000,
            20000,
        )
        this.scrollTop = previous?.scrollTop ?? 0
        this.scrollLeft = previous?.scrollLeft ?? 0
        this.zoomLevel = clamp(previous?.zoomLevel ?? 1, 0.1, 1)
        this.database = DATABASE_BY_PROVIDER[provider] ?? 16
        this.databaseName = previous?.databaseName ?? ''
    }

    toJSON(): SettingsSchema {
        return { ...this }
    }
}

function clamp(value: number, minimum: number, maximum: number) {
    return Math.min(Math.max(value, minimum), maximum)
}
