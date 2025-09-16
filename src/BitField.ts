function safeIn(ob: object, key: string | number | symbol) {
    return Object.prototype.hasOwnProperty.call(ob, key)
}

type BitFieldClass<T extends Record<string, bigint>> = {
    new (bits?: bigint | (keyof T)[]): BitField<T>
    Flags: T
    DefaultBit: bigint
}

export class BitField<T extends Record<string, bigint>> {
    static Flags: Record<string, bigint> = {}
    static DefaultBit: bigint = 0n

    private bitfield: bigint = (this.constructor as BitFieldClass<T>).DefaultBit

    constructor(
        bits: bigint | (keyof T)[] | keyof T | BitField<T> = this.bitfield,
    ) {
        const constructor = this.constructor as BitFieldClass<T>
        this.bitfield = BitField.resolve(constructor.Flags, bits)
    }

    static resolve<K extends Record<string, bigint>>(
        flags: K,
        bits: bigint | (keyof K)[] | keyof K | BitField<K>,
    ): bigint {
        if (bits instanceof BitField) return bits.bitfield
        if (typeof bits === 'bigint') return bits
        if (typeof bits === 'string' && safeIn(flags, bits))
            return flags[bits as keyof K]!
        if (Array.isArray(bits))
            return bits.reduce((acc, key) => {
                if (safeIn(flags, key))
                    // eslint-disable-next-line security/detect-object-injection
                    return acc | (flags[key] || 0n)
                return acc
            }, 0n)

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
        for (const value of values) if (value > max) max = value
        const result = Array.from(
            { length: Number((max * (max + 1n)) / 2n + 1n) },
            (_, i) => BigInt(i),
        ).filter(num => (num & flag) !== 0n)
        return result
    }

    has(bit: keyof T | bigint | (keyof T | bigint)[]): boolean {
        const flags = (this.constructor as typeof BitField).Flags
        const resolved =
            Array.isArray(bit) ?
                bit.reduce(
                    (acc: bigint, b) => acc | BitField.resolve(flags as T, b),
                    0n,
                )
            :   BitField.resolve(flags as T, bit)
        return (this.bitfield & resolved) === resolved
    }

    add(...bits: (keyof T)[]): this {
        const resolved = BitField.resolve(
            (this.constructor as typeof BitField).Flags as T,
            bits,
        )
        this.bitfield |= resolved
        return this
    }

    remove(...bits: (keyof T)[]): this {
        const resolved = BitField.resolve(
            (this.constructor as typeof BitField).Flags as T,
            bits,
        )
        this.bitfield &= ~resolved
        return this
    }

    serialize(): Record<keyof T, boolean> {
        const flags = (this.constructor as typeof BitField).Flags
        return Object.keys(flags).reduce(
            (acc, key) => {
                acc[key as keyof T] = this.has(key as keyof T)
                return acc
            },
            {} as Record<keyof T, boolean>,
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

    toBigInt(): bigint {
        return this.bitfield
    }

    toNumber(): number {
        return Number(this.bitfield)
    }
}

export const TableColumnEntityKeysFlags = {
    primaryKey: 1n << 0n,
    foreignKey: 1n << 1n,
} as const

export class TableColumnEntityKeysBitField extends BitField<
    typeof TableColumnEntityKeysFlags
> {
    static override Flags = TableColumnEntityKeysFlags
    static override DefaultBit = 0n
}

export const TableColumnEntityOptionsFlags = {
    autoIncrement: 1n << 0n,
    primaryKey: 1n << 1n,
    unique: 1n << 2n,
    notNull: 1n << 3n,
} as const

export class TableColumnEntityOptionsBitField extends BitField<
    typeof TableColumnEntityOptionsFlags
> {
    static override Flags = TableColumnEntityOptionsFlags
    static override DefaultBit = 0n
}
