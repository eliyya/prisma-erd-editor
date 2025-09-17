import { FlaggedBitfield } from '@eliyya/flagged-bitfield'

export const TableColumnEntityKeysFlags = {
    primaryKey: 1n << 0n,
    foreignKey: 1n << 1n,
} as const

export class TableColumnEntityKeysBitField extends FlaggedBitfield<
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

export class TableColumnEntityOptionsBitField extends FlaggedBitfield<
    typeof TableColumnEntityOptionsFlags
> {
    static override Flags = TableColumnEntityOptionsFlags
    static override DefaultBit = 0n
}
