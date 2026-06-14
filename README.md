# prisma-erd-editor

Prisma generator that creates `.erd` files compatible with
[ERD Editor](https://erd-editor.io/).

## Installation

```bash
npm install --save-dev prisma-erd-editor
```

Add the generator to `schema.prisma`:

```prisma
generator erd {
  provider = "prisma-erd-editor"
  output   = "../schema.erd"
}
```

Then run:

```bash
npx prisma generate
```

Open the generated `schema.erd` at
[erd-editor.io](https://erd-editor.io/).

## Generated data

- Physical table and column names from `@@map` and `@map`
- Scalar, enum, native, optional, and list data types
- Defaults, primary keys, unique fields, and foreign keys
- Composite primary keys and foreign keys
- Explicit indexes and composite unique constraints
- One-to-one and one-to-many relationship cardinality
- Enum memos
- Deterministic IDs

When the output file already exists, table, column, enum, index, and
relationship IDs are reused where possible. Table positions, sizes, colors,
zoom, and scroll state edited in ERD Editor are preserved across subsequent
`prisma generate` runs.

## Limitations

Prisma implicit many-to-many relations do not expose physical join-table
columns in the DMMF, so they are not emitted. Use an explicit relation model
when the join table must appear in the diagram.

## Development

```bash
npm install
npm run lint
npm test
```

`npm test` builds the package and runs a real `prisma generate` integration
test.
