import { createHash } from 'node:crypto'

export function genId(namespace: string): string {
    return createHash('sha256')
        .update(`prisma-erd-editor:${namespace}`)
        .digest('base64url')
        .slice(0, 21)
}
