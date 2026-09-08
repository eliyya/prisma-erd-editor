import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const generator = resolve(root, 'dist/index.js').replaceAll('\\', '/')
const prisma = resolve(root, 'node_modules/prisma/build/index.js')

test('generates a complete ERD Editor schema and preserves layout', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'prisma-erd-editor-'))
    const schemaPath = join(directory, 'schema.prisma')
    const outputPath = join(directory, 'schema.erd')

    await writeFile(schemaPath, createSchema(), 'utf8')
    await generate(schemaPath)

    const first = JSON.parse(await readFile(outputPath, 'utf8'))
    assert.equal(first.version, '3.0.0')
    assert.equal(first.settings.database, 16)
    assert.deepEqual(tableNames(first), [
        'Membership',
        'Profile',
        'Role',
        'posts',
        'users',
    ])
    assert.equal(first.doc.relationshipIds.length, 4)
    assert.equal(first.doc.indexIds.length, 2)
    assert.equal(first.doc.memoIds.length, 1)

    const users = table(first, 'users')
    const posts = table(first, 'posts')
    const membership = table(first, 'Membership')
    const profile = table(first, 'Profile')

    assert.equal(column(first, posts, 'title').dataType, 'varchar(120)')
    assert.equal(column(first, posts, 'tags').dataType, 'text[]')
    assert.equal(column(first, posts, 'tags').default, '[]')
    assert.equal(column(first, users, 'display_name').dataType, 'text?')
    assert.equal(column(first, membership, 'userId').options, 10)
    assert.equal(column(first, membership, 'userId').ui.keys, 3)

    const userPosts = relationship(first, users, 'id', posts, 'author_id')
    assert.equal(userPosts.relationshipType, 16)
    assert.equal(userPosts.startRelationshipType, 2)
    assert.equal(userPosts.identification, false)

    const userProfile = relationship(first, users, 'id', profile, 'user_id')
    assert.equal(userProfile.relationshipType, 8)
    assert.equal(userProfile.identification, true)

    const indexes = Object.values(first.collections.indexEntities)
    assert.deepEqual(indexes.map(index => index.name).sort(), [
        'posts_author_title_key',
        'posts_title_idx',
    ])
    assert.equal(
        Object.values(first.collections.indexColumnEntities).some(
            indexColumn => indexColumn.orderType === 2,
        ),
        true,
    )

    users.ui.x = 777
    for (const collection of Object.values(first.collections)) {
        for (const entity of Object.values(collection)) {
            entity.meta.updateAt = 123
            entity.meta.createAt = 100
        }
    }
    await writeFile(outputPath, `${JSON.stringify(first, null, 2)}\n`, 'utf8')
    await generate(schemaPath)

    const second = JSON.parse(await readFile(outputPath, 'utf8'))
    const regeneratedUsers = table(second, 'users')
    assert.equal(regeneratedUsers.id, users.id)
    assert.equal(regeneratedUsers.ui.x, 777)
    assert.deepEqual(second, first)
    assertReferences(second)
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
  url      = "postgresql://user:password@localhost:5432/database"
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
  author   User     @relation(fields: [authorId], references: [id])

  @@index([title(sort: Desc)], map: "posts_title_idx")
  @@unique([authorId, title], map: "posts_author_title_key")
  @@map("posts")
}

model Profile {
  userId String  @id @map("user_id")
  bio    String?
  user   User    @relation(fields: [userId], references: [id])
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
        .sort()
}

function table(schema, name) {
    const value = Object.values(schema.collections.tableEntities).find(
        item => item.name === name,
    )
    assert.ok(value, `Missing table ${name}`)
    return value
}

function column(schema, model, name) {
    const value = model.columnIds
        .map(id => schema.collections.tableColumnEntities[id])
        .find(item => item.name === name)
    assert.ok(value, `Missing column ${model.name}.${name}`)
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
    assert.ok(
        value,
        `Missing relationship ${startTable.name} -> ${endTable.name}`,
    )
    return value
}

function assertReferences(schema) {
    for (const id of schema.doc.tableIds) {
        assert.ok(schema.collections.tableEntities[id])
    }
    for (const id of schema.doc.relationshipIds) {
        const relation = schema.collections.relationshipEntities[id]
        assert.ok(relation)
        assert.ok(schema.collections.tableEntities[relation.start.tableId])
        assert.ok(schema.collections.tableEntities[relation.end.tableId])
        for (const columnId of [
            ...relation.start.columnIds,
            ...relation.end.columnIds,
        ]) {
            assert.ok(schema.collections.tableColumnEntities[columnId])
        }
    }
}
