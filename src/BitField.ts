import { FlaggedBitfield } from '@eliyya/flagged-bitfield'

export const TableColumnEntityOptionsFlags = {
    autoIncrement: 1,
    primaryKey: 2,
    unique: 4,
    notNull: 8,
} as const

type TableColumnEntityOption = keyof typeof TableColumnEntityOptionsFlags

export class TableColumnEntityOptionsBitField extends FlaggedBitfield<
    typeof TableColumnEntityOptionsFlags
> {
    static override Flags = TableColumnEntityOptionsFlags

    constructor(initial = 0) {
        super(initial)
    }

    override add(flag: TableColumnEntityOption) {
        return super.add(flag)
    }

    override remove(flag: TableColumnEntityOption) {
        return super.remove(flag)
    }

    override has(flag: TableColumnEntityOption) {
        return super.has(flag)
    }
}
