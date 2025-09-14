/* eslint-disable @typescript-eslint/ban-ts-comment */
export class BitField<T extends Record<string, bigint>> {
    static Flags: Record<string, bigint> = {}
    static DefaultBit: bigint = 0n

    private bitfield: bigint

    constructor(bits: bigint | (keyof T)[] = BitField.DefaultBit) {
        this.bitfield = BitField.resolve(
            bits,
            // @ts-ignore
            (this.constructor as typeof BitField).Flags,
        )
    }

    static resolve<K extends Record<string, bigint>>(
        bits: bigint | (keyof K)[] | keyof K | BitField<K>,
        flags: K,
    ): bigint {
        if (bits instanceof BitField) return bits.bitfield
        if (typeof bits === 'string') return flags[bits]
        if (Array.isArray(bits))
            return bits.reduce((acc, key) => acc | (flags[key] || 0n), 0n)
        if (typeof bits === 'bigint') return bits
        throw new TypeError(`Invalid bitfield input: ${bits.toString()}`)
    }

    /**
     * Generate all posible combinations that includes the passed bit
     * @param flags
     * @returns bigint[]
     * @example
     * getCombinationsOf(1n)  // [ 1n, 3n, 5n, 7n, 9n ]
     */
    static getCombinationsOf(flag: bigint): bigint[] {
        const values = Object.values(this.Flags)
        let max = 0n
        for (const value of values) {
            if (value > max) max = value
        }
        const result = Array.from(
            { length: Number((max * (max + 1n)) / 2n + 1n) },
            (_, i) => BigInt(i),
        ).filter(num => (num & flag) !== 0n) // Filtra los números que cumplen la condición
        return result
    }

    has(bit: keyof T | bigint | (keyof T | bigint)[]): boolean {
        const flags = (this.constructor as typeof BitField).Flags
        const resolved =
            Array.isArray(bit) ?
                // @ts-ignore
                bit.reduce((acc, b) => acc | BitField.resolve(b, flags), 0n)
                // @ts-ignore
            :   BitField.resolve(bit, flags)
        // @ts-ignore
        return (this.bitfield & resolved) === resolved
    }

    add(...bits: (keyof T)[]): this {
        const resolved = BitField.resolve(
            bits,
            // @ts-ignore
            (this.constructor as typeof BitField).Flags,
        )
        this.bitfield |= resolved
        return this
    }

    remove(...bits: (keyof T)[]): this {
        const resolved = BitField.resolve(
            bits,
            // @ts-ignore
            (this.constructor as typeof BitField).Flags,
        )
        this.bitfield &= ~resolved
        return this
    }

    serialize(): Record<string, boolean> {
        const flags = (this.constructor as typeof BitField).Flags
        return Object.keys(flags).reduce(
            (acc, key) => {
                acc[key] = this.has(key as keyof T)
                return acc
            },
            {} as Record<string, boolean>,
        )
    }

    toArray(): (keyof T)[] {
        const flags = (this.constructor as typeof BitField).Flags
        return Object.keys(flags).filter(key =>
            this.has(key as keyof T),
        ) as (keyof T)[]
    }

    toJSON(): string {
        return this.bitfield.toString()
    }

    toBigInt() {
        return this.bitfield
    }

    toNumber() {
        return Number(this.bitfield)
    }
}

// bit value (primaryKey: 1) | (foreignKey: 2)
export const TableColumnEntityKeysFlags = {
    primaryKey: 1n << 0n,
    foreignKey: 1n << 1n,
}

export class TableColumnEntityKeysBitField extends BitField<
    typeof TableColumnEntityKeysFlags
> {
    static Flags = TableColumnEntityKeysFlags
    static DefaultBit = 0n
}

// bit value (autoIncrement: 1) | (primaryKey: 2) | (unique: 4) | (notNull: 8)
export const TableColumnEntityOptionsFlags = {
    autoIncrement: 1n << 0n,
    primaryKey: 1n << 1n,
    unique: 1n << 2n,
    notNull: 1n << 3n,
}

export class TableColumnEntityOptionsBitField extends BitField<
    typeof TableColumnEntityOptionsFlags
> {
    static Flags = TableColumnEntityOptionsFlags
    static DefaultBit = 0n
}
