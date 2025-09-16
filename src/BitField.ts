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

    private bitfield: bigint

    constructor(
        bits: bigint | (keyof T)[] = (this.constructor as BitFieldClass<T>)
            .DefaultBit,
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
