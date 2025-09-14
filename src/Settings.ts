export class Settings {
    #width = 2000
    #height = 2000
    #scrollTop = 0
    #scrollLeft = 0
    #zoomLevel = 1
    #show = 431
    #database = 4
    #databaseName = ''
    #canvasType = 'ERD'
    #language = 16
    #tableNameCase = 4
    #columnNameCase = 2
    #bracketType = 1
    #relationshipDataTypeSync = true
    #relationshipOptimization = false
    #columnOrder = [1, 2, 4, 8, 16, 32, 64]
    #maxWidthComment = -1
    #ignoreSaveSettings = 0

    get width() {
        return this.#width
    }

    get height() {
        return this.#height
    }

    get zoomLevel() {
        return this.#zoomLevel
    }

    set width(width: number) {
        if (width < 2000) this.#width = 2000
        if (width > 20000) this.#width = 20000
        else this.#width = width
    }

    set height(height: number) {
        if (height < 2000) this.#height = 2000
        if (height > 20000) this.#height = 20000
        else this.#height = height
    }

    set zoomLevel(zoomLevel: number) {
        if (zoomLevel < 0.1) this.#zoomLevel = 0.1
        if (zoomLevel > 1) this.#zoomLevel = 1
        else this.#zoomLevel = zoomLevel
    }

    toJSON() {
        return {
            width: this.#width,
            height: this.#height,
            scrollTop: this.#scrollTop,
            scrollLeft: this.#scrollLeft,
            zoomLevel: this.#zoomLevel,
            show: this.#show,
            database: this.#database,
            databaseName: this.#databaseName,
            canvasType: this.#canvasType,
            language: this.#language,
            tableNameCase: this.#tableNameCase,
            columnNameCase: this.#columnNameCase,
            bracketType: this.#bracketType,
            relationshipDataTypeSync: this.#relationshipDataTypeSync,
            relationshipOptimization: this.#relationshipOptimization,
            columnOrder: this.#columnOrder,
            maxWidthComment: this.#maxWidthComment,
            ignoreSaveSettings: this.#ignoreSaveSettings,
        }
    }
}
