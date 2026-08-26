#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(ROOT, 'docs', 'final-package-lock.json'), 'utf8'));
const errors = [];

for (const [path, expected] of Object.entries(manifest.files)) {
  let source;
  try {
    source = await readFile(join(ROOT, path), 'utf8');
    JSON.parse(source);
  } catch (error) {
    errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    continue;
  }
  const actual = createHash('sha256').update(source).digest('hex');
  if (actual !== expected) errors.push(`${path}: final package hash mismatch`);
}

if (Object.keys(manifest.files).length !== manifest.contentFiles) {
  errors.push(`manifest count is ${Object.keys(manifest.files).length}; expected ${manifest.contentFiles}`);
}

if (errors.length) {
  console.error(`\n  FINAL PACKAGE LOCK FAILED (${errors.length})`);
  errors.slice(0, 30).forEach((error) => console.error(`    ${error}`));
  process.exit(1);
}

console.log(`\n  ✓ ${manifest.contentFiles} content files match the final authoritative package.`);
console.log(`  ✓ ${manifest.composedReplacements} highest-precedence replacements are locked.\n`);
