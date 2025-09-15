export type PrismaTypes =
    | 'String'
    | 'Int'
    | 'BigInt'
    | 'Float'
    | 'Decimal'
    | 'Boolean'
    | 'Bytes'
    | 'DateTime'
    | 'Json'

export const POSTGRESQL_TYPES = [
    // Números
    'smallint',
    'integer',
    'bigint',
    'decimal',
    'numeric',
    'real',
    'double precision',
    'smallserial',
    'serial',
    'bigserial',

    // Moneda
    'money',

    // Texto
    'character varying',
    'varchar',
    'character',
    'char',
    'text',

    // Binarios
    'bytea',

    // Fecha y hora
    'timestamp',
    'timestamp with time zone',
    'timestamp without time zone',
    'date',
    'time',
    'time with time zone',
    'time without time zone',
    'interval',

    // Boolean
    'boolean',

    // UUID
    'uuid',

    // JSON
    'json',
    'jsonb',

    // Rango
    'int4range',
    'int8range',
    'numrange',
    'tsrange',
    'tstzrange',
    'daterange',

    // Tipos geométricos
    'point',
    'line',
    'lseg',
    'box',
    'path',
    'polygon',
    'circle',

    // Red/CIDR
    'cidr',
    'inet',
    'macaddr',
    'macaddr8',

    // Full Text Search
    'tsvector',
    'tsquery',

    // XML
    'xml',

    // Otros
    'bit',
    'bit varying',
    'hstore',
    'array',
    'oid',
    'pg_lsn',
    'txid_snapshot',
] as const

type PostgreSQLTypes = (typeof POSTGRESQL_TYPES)[number]

export const PRISMA_TYPES_TO_POSTGRESQL_TYPES: Record<
    PrismaTypes,
    PostgreSQLTypes
> = {
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
