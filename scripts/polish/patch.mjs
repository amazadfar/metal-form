#!/usr/bin/env node
/**
 * Path-based content patcher.
 *
 * Editorial passes over 171 content files cannot be done by hand-rewriting JSON
 * without eventually dropping a key. This applies a list of {path, value}
 * operations to one file, verifies every path already exists (so a typo fails
 * loudly instead of silently adding a key no component reads), and writes the
 * file back with the project's formatting.
 *
 * Paths look like `blocks.line.close` or `blocks.line.supply[3]`.
 * A value of `null` deletes an array element or an object key.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TOKEN = /([^.[\]]+)|\[(\d+)\]/g;

function parse(path) {
  const out = [];
  for (const m of path.matchAll(TOKEN)) out.push(m[2] !== undefined ? Number(m[2]) : m[1]);
  return out;
}

export function apply(file, ops, { allowNew = [] } = {}) {
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const deletions = [];
  for (const [path, value] of ops) {
    const keys = parse(path);
    const last = keys.pop();
    let node = doc;
    for (const k of keys) {
      if (node == null) throw new Error(`${file}: missing ${path}`);
      node = node[k];
    }
    if (node == null) throw new Error(`${file}: missing parent of ${path}`);
    if (!(last in node) && !allowNew.includes(path)) throw new Error(`${file}: no such key ${path}`);
    if (value === null) deletions.push([node, last, path]);
    else node[last] = value;
  }
  // Deletions last, and array indices highest-first, so earlier ops still resolve.
  deletions.sort((a, b) => (typeof b[1] === 'number' ? b[1] : -1) - (typeof a[1] === 'number' ? a[1] : -1));
  for (const [node, last] of deletions) {
    if (Array.isArray(node)) node.splice(last, 1);
    else delete node[last];
  }
  writeFileSync(file, JSON.stringify(doc, null, 2) + '\n');
  return ops.length;
}
