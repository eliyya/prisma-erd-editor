/**
 * This code is inspired by:
 * https://raw.githubusercontent.com/dineug/erd-editor/refs/heads/main/packages/shared/src/nanoid.ts
 * https://raw.githubusercontent.com/ai/nanoid/refs/heads/main/index.js
 * https://raw.githubusercontent.com/ai/nanoid/refs/heads/main/url-alphabet/index.js
 */

import { randomBytes } from 'node:crypto'

const alphabet =
    'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
const defaultSize = 21

export function genId(size = defaultSize): string & { __brand: 'id' } {
    const bytes = randomBytes(size)
    let id = ''

    while (size--) {
        // Cualquier índice fuera de rango se descarta (se ignora).
        id += alphabet[bytes[size]! & 63]
    }

    return id as string & { __brand: 'id' }
}
