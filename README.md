# prisma-erd-editor

Prisma generator that creates `.erd` files compatible with
[ERD Editor for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=dineug.vuerd-vscode).

Targets the current compact
[ERD Editor storage schema](https://raw.githubusercontent.com/dineug/erd-editor/main/json-schema/schema.json),
which still uses version `3.0.0`. Derived editor state such as column widths,
key icons, and relationship geometry is no longer written to the file.

## Installation

```bash
pnpm add --save-dev prisma-erd-editor
```

Add the generator to `schema.prisma`:

```prisma
generator erd {
  provider = "prisma-erd-editor"
  output   = "./schema.erd"
}
```

Then run:

```bash
npx prisma generate
```

Open the generated `schema.erd` with the
[ERD Editor extension](https://marketplace.visualstudio.com/items?itemName=dineug.vuerd-vscode).

## Generated data

- Physical table and column names from `@@map` and `@map`
- Scalar, enum, native, optional, and list data types
- Defaults, primary keys, unique fields, and foreign keys
- Composite primary keys and foreign keys
- Explicit indexes and composite unique constraints
- One-to-one and one-to-many relationship cardinality
- Explicit `onDelete` and `onUpdate` referential actions
- Enum memos
- Deterministic IDs

When the output file already exists, table, column, enum, index, and
relationship IDs are reused where possible. Table positions, memo sizes,
colors, zoom, and viewport origin edited in ERD Editor are preserved across
subsequent `prisma generate` runs, along with document order, table groups,
logical names, domain links, dictionaries, and editor settings. Physical names
and database definitions continue to come from Prisma.

## Limitations

Prisma implicit many-to-many relations do not expose physical join-table
columns in the DMMF, so they are not emitted. Use an explicit relation model
when the join table must appear in the diagram.

## Development

```bash
pnpm install
pnpm run verify
```

Development uses [Vite+](https://viteplus.dev/guide/) for formatting, linting,
type checks, and tests. It requires Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`.
The generated package continues to support the Node.js versions in `engines`.

- `pnpm build` compiles with TypeScript 7 and emits JavaScript, declarations,
  and source maps to `dist`.
- `pnpm format` applies formatting; `pnpm format:check` checks it.
- `pnpm lint` runs lint rules and type checks; `pnpm lint:fix` applies fixes.
- `pnpm check` checks formatting, lint rules, and types together.
- `pnpm test` builds the package and runs the Vitest suite through Vite+.
- `pnpm verify` builds the package, runs all static checks, and runs the tests.

Tests exercise real `prisma generate` runs and validate generated documents
against a checked-in copy of the official JSON Schema. Regression fixtures
cover compact editor-saved files and optional collections.
