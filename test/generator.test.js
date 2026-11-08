import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath, URL } from 'node:url'
import { promisify } from 'node:util'

import Ajv2020 from 'ajv/dist/2020.js'
import { expect, test } from 'vite-plus/test'

import { ERD } from '../dist/api.js'

const execFileAsync = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const generator = resolve(root, 'dist/index.js').replaceAll('\\', '/')
const prisma = resolve(root, 'node_modules/prisma/build/index.js')
const officialSchema = JSON.parse(
    await readFile(
        new URL('./fixtures/erd-editor.schema.json', import.meta.url),
        'utf8',
    ),
)
const validate = new Ajv2020({ strict: false, allErrors: true }).compile(
    officialSchema,
)

test('generates a complete ERD Editor schema and preserves layout', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prisma-erd-editor-'))
    const schemaPath = join(directory, 'schema.prisma')
    const outputPath = join(directory, 'schema.erd')

    await writeFile(schemaPath, createSchema(), 'utf8')
    await generate(schemaPath)

    const first = JSON.parse(await readFile(outputPath, 'utf8'))
    assertCurrentSchema(first)
    expect(first.version).toBe('3.0.0')
    expect(first.settings.database).toBe(16)
    expect(tableNames(first)).toStrictEqual([
        'Membership',
        'Profile',
        'Role',
        'posts',
        'users',
    ])
    expect(first.doc.relationshipIds.length).toBe(4)
    expect(first.doc.indexIds.length).toBe(2)
    expect(first.doc.memoIds.length).toBe(1)

    const users = table(first, 'users')
    const posts = table(first, 'posts')
    const membership = table(first, 'Membership')
    const profile = table(first, 'Profile')

    expect(column(first, posts, 'title').dataType).toBe('varchar(120)')
    expect(column(first, posts, 'tags').dataType).toBe('text[]')
    expect(column(first, posts, 'tags').default).toBe('[]')
    expect(column(first, users, 'display_name').dataType).toBe('text?')
    expect(column(first, posts, 'id').options).toBe(15)
    expect(column(first, users, 'id').options).toBe(14)
    expect(column(first, users, 'display_name').options).toBe(0)
    expect(column(first, membership, 'userId').options).toBe(10)

    const userPosts = relationship(first, users, 'id', posts, 'author_id')
    expect(userPosts.relationshipType).toBe(16)
    expect(userPosts.onDelete).toBe(4)
    expect(userPosts.onUpdate).toBe(2)

    const userProfile = relationship(first, users, 'id', profile, 'user_id')
    expect(userProfile.relationshipType).toBe(8)
    expect(userProfile.onDelete).toBe(32)
    expect(userProfile.onUpdate).toBe(1)

    const indexes = Object.values(first.collections.indexEntities)
    expect(indexes.map(index => index.name).sort(compareText)).toStrictEqual([
        'posts_author_title_key',
        'posts_title_idx',
    ])
    expect(
        Object.values(first.collections.indexColumnEntities).some(
            indexColumn => indexColumn.orderType === 2,
        ),
    ).toBe(true)

    users.ui.x = 777
    users.ui.color = '#abcdef'
    first.settings.originX = -125.5
    first.settings.originY = 298.75
    first.settings.zoomLevel = 1.25
    await writeFile(outputPath, `${JSON.stringify(first, null, 2)}\n`, 'utf8')
    await generate(schemaPath)

    const second = JSON.parse(await readFile(outputPath, 'utf8'))
    const regeneratedUsers = table(second, 'users')
    expect(regeneratedUsers.id).toBe(users.id)
    expect(regeneratedUsers.ui.x).toBe(777)
    expect(second).toStrictEqual(first)
    assertCurrentSchema(second)
    assertReferences(second)
})

test('regenerates a compact editor-saved document while preserving editor data', async () => {
    const directory = await mkdtemp(
        join(tmpdir(), 'prisma-erd-editor-compact-'),
    )
    const schemaPath = join(directory, 'schema.prisma')
    const outputPath = join(directory, 'schema.erd')
    const previous = JSON.parse(
        await readFile(
            new URL('./fixtures/compact.erd.json', import.meta.url),
            'utf8',
        ),
    )
    assertCurrentSchema(previous)

    await writeFile(schemaPath, createSchema(), 'utf8')
    await writeFile(outputPath, JSON.stringify(previous), 'utf8')
    await generate(schemaPath)

    const generated = JSON.parse(await readFile(outputPath, 'utf8'))
    assertCurrentSchema(generated)
    assertReferences(generated)
    const users = table(generated, 'users')
    const posts = table(generated, 'posts')
    expect(users.id).toBe('user-table')
    expect(column(generated, users, 'id').id).toBe('user-id')
    expect(users.ui).toStrictEqual(
        previous.collections.tableEntities['user-table'].ui,
    )
    expect(users.logicalName).toBe('Usuarios')
    expect(users.groupId).toBe('group-1')
    expect('nameDerived' in users).toBe(false)
    const email = column(generated, users, 'email')
    expect(email.logicalName).toBe('Correo')
    expect(email.domainId).toBe('domain-1')
    expect(email.options).toBe(12)
    expect(generated.doc.tableIds.slice(0, 2)).toStrictEqual([
        'post-table',
        'user-table',
    ])
    expect(relationship(generated, users, 'id', posts, 'author_id').id).toBe(
        'user-posts',
    )
    const titleIndex = Object.values(generated.collections.indexEntities).find(
        item => item.name === 'posts_title_idx',
    )
    expect(titleIndex.id).toBe('title-index')
    expect(titleIndex.indexColumnIds).toStrictEqual(['title-index-column'])
    expect(generated.settings).toStrictEqual(previous.settings)
    expect(generated.doc.tableGroupIds).toStrictEqual(['group-1'])
    for (const collection of [
        'tableGroupEntities',
        'wordEntities',
        'termEntities',
        'domainEntities',
    ]) {
        expect(generated.collections[collection]).toStrictEqual(
            previous.collections[collection],
        )
    }
    expect(generated.collections.memoEntities['status-memo'].ui).toStrictEqual(
        previous.collections.memoEntities['status-memo'].ui,
    )

    // A no-op generation must not rewrite editor formatting or key order.
    const reordered = Object.fromEntries(Object.entries(generated).reverse())
    expect(Object.keys(reordered)).not.toStrictEqual(Object.keys(generated))
    const editorSaved = `${JSON.stringify(reordered)}\n`
    await writeFile(outputPath, editorSaved, 'utf8')
    await generate(schemaPath)
    expect(await readFile(outputPath, 'utf8')).toBe(editorSaved)
})

test('CLI preserves settings when the previous document has no collections', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prisma-erd-editor-empty-'))
    const schemaPath = join(directory, 'schema.prisma')
    const outputPath = join(directory, 'schema.erd')
    const previous = {
        $schema: officialSchema.$id,
        version: '3.0.0',
        settings: {
            ...compactSettings(),
            originX: -345.25,
            originY: 678.5,
            zoomLevel: 1.4,
            databaseName: 'Empty diagram',
        },
        doc: {},
    }
    assertCurrentSchema(previous)
    await writeFile(schemaPath, createSchema(), 'utf8')
    await writeFile(outputPath, JSON.stringify(previous), 'utf8')
    await generate(schemaPath)

    const generated = JSON.parse(await readFile(outputPath, 'utf8'))
    assertCurrentSchema(generated)
    expect(generated.settings).toStrictEqual(previous.settings)
    expect(generated.doc.tableIds.length).toBe(5)
    assertReferences(generated)
})

test('accepts absent collections and optional entity text fields', () => {
    const minimal = {
        $schema: officialSchema.$id,
        version: '3.0.0',
        settings: compactSettings(),
        doc: {},
    }
    const empty = buildERD({ previous: minimal })
    assertCurrentSchema(empty)
    expect(empty.doc).toStrictEqual({})
    expect('collections' in empty).toBe(false)

    const sparse = {
        ...minimal,
        doc: { tableIds: ['blank-table'], memoIds: ['blank-memo'] },
        collections: {
            tableEntities: {
                'blank-table': {
                    id: 'blank-table',
                    columnIds: ['blank-column'],
                    ui: { x: 12, y: 34 },
                },
            },
            tableColumnEntities: {
                'blank-column': {
                    id: 'blank-column',
                    tableId: 'blank-table',
                    options: 0,
                },
            },
            memoEntities: {
                'blank-memo': {
                    id: 'blank-memo',
                    ui: { x: 1, y: 2, width: 180, height: 120 },
                },
            },
        },
    }
    assertCurrentSchema(sparse)
    assertCurrentSchema(buildERD({ previous: sparse }))
})

test('omits absent entity kinds in a diagram without relationships, indexes or enums', () => {
    const generated = buildERD({ models: [model('Item', [scalar('id')])] })
    assertCurrentSchema(generated)
    expect(Object.keys(generated.doc)).toStrictEqual(['tableIds'])
    expect(Object.keys(generated.collections).sort(compareText)).toStrictEqual([
        'tableColumnEntities',
        'tableEntities',
    ])
})

test('maps all Prisma referential actions to the current relationship format', () => {
    for (const [action, expected] of [
        [undefined, 1],
        ['NoAction', 2],
        ['Cascade', 4],
        ['SetNull', 8],
        ['SetDefault', 16],
        ['Restrict', 32],
    ]) {
        const foreignKey = scalar('parentId')
        const relation = {
            name: 'parent',
            kind: 'object',
            type: 'Parent',
            isList: false,
            isRequired: true,
            relationName: 'ParentChildren',
            relationFromFields: ['parentId'],
            relationToFields: ['id'],
            ...(action
                ? { relationOnDelete: action, relationOnUpdate: action }
                : {}),
        }
        const generated = buildERD({
            models: [
                model('Parent', [
                    scalar('id'),
                    {
                        name: 'children',
                        kind: 'object',
                        type: 'Child',
                        isList: true,
                        isRequired: true,
                        relationName: 'ParentChildren',
                    },
                ]),
                model('Child', [scalar('id'), foreignKey, relation]),
            ],
        })
        assertCurrentSchema(generated)
        const [generatedRelation] = Object.values(
            generated.collections.relationshipEntities,
        )
        expect(generatedRelation.onDelete, `onDelete ${action}`).toBe(expected)
        expect(generatedRelation.onUpdate, `onUpdate ${action}`).toBe(expected)
    }
})

async function generate(schemaPath) {
    await execFileAsync(
        process.execPath,
        [prisma, 'generate', '--schema', schemaPath],
        {
            cwd: root,
            env: {
                ...process.env,
                NO_COLOR: '1',
            },
        },
    )
}

function createSchema() {
    return `
generator erd {
  provider = "node ${generator}"
  output   = "./schema.erd"
}

datasource db {
  provider = "postgresql"
}

enum USER_STATUS {
  ACTIVE
  DISABLED
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  displayName String?      @map("display_name")
  status      USER_STATUS  @default(ACTIVE)
  posts       Post[]
  profile     Profile?
  memberships Membership[]

  @@map("users")
}

model Post {
  id       Int      @id @default(autoincrement())
  title    String   @db.VarChar(120)
  tags     String[] @default([])
  authorId String   @map("author_id")
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade, onUpdate: NoAction)

  @@index([title(sort: Desc)], map: "posts_title_idx")
  @@unique([authorId, title], map: "posts_author_title_key")
  @@map("posts")
}

model Profile {
  userId String  @id @map("user_id")
  bio    String?
  user   User    @relation(fields: [userId], references: [id], onDelete: Restrict)
}

model Role {
  id          Int          @id
  name        String
  memberships Membership[]
}

model Membership {
  userId String
  roleId Int
  user   User   @relation(fields: [userId], references: [id])
  role   Role   @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}
`
}

function tableNames(schema) {
    return Object.values(schema.collections.tableEntities)
        .map(item => item.name)
        .sort(compareText)
}

function compareText(left, right) {
    return left < right ? -1 : left > right ? 1 : 0
}

function table(schema, name) {
    const value = Object.values(schema.collections.tableEntities).find(
        item => item.name === name,
    )
    expect(value, `Missing table ${name}`).toBeTruthy()
    return value
}

function column(schema, model, name) {
    const value = model.columnIds
        .map(id => schema.collections.tableColumnEntities[id])
        .find(item => item.name === name)
    expect(value, `Missing column ${model.name}.${name}`).toBeTruthy()
    return value
}

function relationship(schema, startTable, startColumn, endTable, endColumn) {
    const value = Object.values(schema.collections.relationshipEntities).find(
        item =>
            item.start.tableId === startTable.id &&
            item.start.columnIds.includes(
                column(schema, startTable, startColumn).id,
            ) &&
            item.end.tableId === endTable.id &&
            item.end.columnIds.includes(column(schema, endTable, endColumn).id),
    )
    expect(
        value,
        `Missing relationship ${startTable.name} -> ${endTable.name}`,
    ).toBeTruthy()
    return value
}

function assertReferences(schema) {
    for (const id of schema.doc.tableIds ?? []) {
        expect(schema.collections.tableEntities[id]).toBeTruthy()
    }
    for (const id of schema.doc.relationshipIds ?? []) {
        const relation = schema.collections.relationshipEntities[id]
        expect(relation).toBeTruthy()
        expect(
            schema.collections.tableEntities[relation.start.tableId],
        ).toBeTruthy()
        expect(
            schema.collections.tableEntities[relation.end.tableId],
        ).toBeTruthy()
        for (const columnId of [
            ...relation.start.columnIds,
            ...relation.end.columnIds,
        ]) {
            expect(
                schema.collections.tableColumnEntities[columnId],
            ).toBeTruthy()
        }
    }
}

function assertCurrentSchema(schema) {
    expect(validate(schema), JSON.stringify(validate.errors, null, 2)).toBe(
        true,
    )
}

function compactSettings() {
    return {
        originX: 0,
        originY: 0,
        zoomLevel: 1,
        show: 511,
        database: 16,
        databaseName: '',
        canvasType: 'ERD',
        language: 16,
        tableNameCase: 4,
        columnNameCase: 2,
        bracketType: 1,
        relationshipDataTypeSync: true,
        columnOrder: [1, 2, 4, 8, 16, 32, 64],
        maxWidthComment: -1,
        lockSettings: 63,
    }
}

function buildERD(options = {}) {
    return new ERD({
        enums: [],
        models: [],
        indexes: [],
        provider: 'postgresql',
        previous: undefined,
        ...options,
    }).build()
}

function model(name, fields) {
    return { name, fields, primaryKey: null }
}

function scalar(name) {
    return {
        name,
        kind: 'scalar',
        type: 'Int',
        isList: false,
        isRequired: true,
        isId: name === 'id',
        isUnique: false,
    }
}
