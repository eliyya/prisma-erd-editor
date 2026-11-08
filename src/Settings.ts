import { DATABASE_BY_PROVIDER } from './constants.js'
import type { Settings as SettingsSchema } from './types.js'

export class Settings {
    #value: SettingsSchema

    constructor(provider: string, previous?: Partial<SettingsSchema>) {
        this.#value = {
            originX: previous?.originX ?? 0,
            originY: previous?.originY ?? 0,
            zoomLevel: Math.min(Math.max(previous?.zoomLevel ?? 1, 0.1), 1.5),
            show: previous?.show ?? 511,
            database: DATABASE_BY_PROVIDER[provider] ?? 16,
            databaseName: previous?.databaseName ?? '',
            canvasType: previous?.canvasType ?? 'ERD',
            language: previous?.language ?? 16,
            tableNameCase: previous?.tableNameCase ?? 4,
            columnNameCase: previous?.columnNameCase ?? 2,
            bracketType: previous?.bracketType ?? 1,
            relationshipDataTypeSync:
                previous?.relationshipDataTypeSync ?? true,
            columnOrder: previous?.columnOrder ?? [1, 2, 4, 8, 16, 32, 64],
            maxWidthComment: previous?.maxWidthComment ?? -1,
            lockSettings: previous?.lockSettings ?? 63,
            ...(previous?.ddlScripts && { ddlScripts: previous.ddlScripts }),
            ...(previous?.nameViewMode && {
                nameViewMode: previous.nameViewMode,
            }),
        }
    }

    toJSON(): SettingsSchema {
        return { ...this.#value }
    }
}
