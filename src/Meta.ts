import type { EntityMeta } from './types.js'

export class Meta {
    readonly updateAt: number
    readonly createAt: number

    constructor(previous?: EntityMeta, now = Date.now()) {
        this.updateAt = now
        this.createAt = previous?.createAt ?? now
    }

    toJSON(): EntityMeta {
        return {
            updateAt: this.updateAt,
            createAt: this.createAt,
        }
    }
}
