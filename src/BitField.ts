type FlagMap = Readonly<Record<string, number>>

class BitField<T extends FlagMap> {
    #value = 0

    constructor(
        private readonly flags: T,
        initial = 0,
    ) {
        this.#value = initial
    }

    add(flag: keyof T) {
        this.#value |= this.flags[flag] ?? 0
        return this
    }

    remove(flag: keyof T) {
        this.#value &= ~(this.flags[flag] ?? 0)
        return this
    }

    has(flag: keyof T) {
        return (this.#value & (this.flags[flag] ?? 0)) !== 0
    }

    toNumber() {
        return this.#value
    }
}

export const TableColumnEntityKeysFlags = {
    primaryKey: 1,
    foreignKey: 2,
} as const

export class TableColumnEntityKeysBitField extends BitField<
    typeof TableColumnEntityKeysFlags
> {
    constructor(initial = 0) {
        super(TableColumnEntityKeysFlags, initial)
    }
}

export const TableColumnEntityOptionsFlags = {
    autoIncrement: 1,
    primaryKey: 2,
    unique: 4,
    notNull: 8,
} as const

export class TableColumnEntityOptionsBitField extends BitField<
    typeof TableColumnEntityOptionsFlags
> {
    constructor(initial = 0) {
        super(TableColumnEntityOptionsFlags, initial)
    }
}
