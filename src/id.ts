/**
 * This code is inspired by:
 * https://raw.githubusercontent.com/dineug/erd-editor/refs/heads/main/packages/shared/src/nanoid.ts
 * https://raw.githubusercontent.com/ai/nanoid/refs/heads/main/index.js
 * https://raw.githubusercontent.com/ai/nanoid/refs/heads/main/url-alphabet/index.js
 */

import { randomBytes } from "node:crypto";

const alphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const defaultSize = 21;
const mask = (2 << (31 - Math.clz32((alphabet.length - 1) | 1))) - 1;
const step = Math.ceil((1.6 * mask * defaultSize) / alphabet.length);

export function genId(size = defaultSize): string & { __brand: "id" } {
  let id = "";
  while (true) {
    const bytes = randomBytes(size);
    let i = step;
    while (i--) {
      id += alphabet[bytes[i] & mask] || "";
      if (id.length >= size) return id as string & { __brand: "id" };
    }
  }
};
