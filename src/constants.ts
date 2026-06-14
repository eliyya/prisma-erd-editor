import type { DMMF } from '@prisma/generator-helper'

export const DATABASE_BY_PROVIDER: Readonly<Record<string, number>> = {
    mariadb: 1,
    sqlserver: 2,
    mysql: 4,
    oracle: 8,
    postgresql: 16,
    cockroachdb: 16,
    sqlite: 32,
}

const PRISMA_TYPES_TO_SQL_TYPES: Readonly<Record<string, string>> = {
    String: 'text',
    Int: 'integer',
    BigInt: 'bigint',
    Float: 'double precision',
    Decimal: 'decimal',
    Boolean: 'boolean',
    Bytes: 'bytea',
    DateTime: 'timestamp',
    Json: 'jsonb',
}

const NATIVE_TYPES: Readonly<Record<string, string>> = {
    BigInt: 'bigint',
    Bit: 'bit',
    Boolean: 'boolean',
    ByteA: 'bytea',
    Char: 'char',
    Citext: 'citext',
    Date: 'date',
    Decimal: 'decimal',
    DoublePrecision: 'double precision',
    Inet: 'inet',
    Int: 'integer',
    Json: 'json',
    JsonB: 'jsonb',
    Money: 'money',
    Oid: 'oid',
    Real: 'real',
    SmallInt: 'smallint',
    Text: 'text',
    Time: 'time',
    Timestamp: 'timestamp',
    Timestamptz: 'timestamp with time zone',
    UUID: 'uuid',
    Uuid: 'uuid',
    VarBit: 'bit varying',
    VarChar: 'varchar',
    Xml: 'xml',
}

export function getDataType(field: Readonly<DMMF.Field>): string {
    let dataType =
        getNativeType(field.nativeType) ??
        PRISMA_TYPES_TO_SQL_TYPES[field.type] ??
        field.type

    if (field.isList) dataType += '[]'
    if (!field.isRequired) dataType += '?'
    return dataType
}

function getNativeType(
    nativeType: Readonly<[string, readonly string[]]> | null | undefined,
) {
    if (!nativeType) return

    const [name, args] = nativeType
    const type = NATIVE_TYPES[name] ?? splitPascalCase(name).toLowerCase()
    return args.length > 0 ? `${type}(${args.join(', ')})` : type
}

function splitPascalCase(value: string) {
    return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
}

export const RelationshipType = {
    zeroOne: 2,
    zeroN: 4,
    oneOnly: 8,
    oneN: 16,
} as const

export const StartRelationshipType = {
    ring: 1,
    dash: 2,
} as const

export const Direction = {
    left: 1,
    right: 2,
    top: 4,
    bottom: 8,
} as const

export const IndexOrder = {
    asc: 1,
    desc: 2,
} as const
