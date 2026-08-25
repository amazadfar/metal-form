#!/usr/bin/env node
/**
 * What the English editorial pass actually changed.
 *
 * The eight translations were made from the English at HEAD. Rather than guess
 * which strings moved, ask git: flatten the committed English and the working
 * English, and report added / removed / changed paths per file.
 *
 *   node scripts/polish/delta.mjs            # summary
 *   node scripts/polish/delta.mjs home       # the changed strings in one file
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const FILES = ['common', 'home', 'about', 'capabilities', 'contact', 'industries-index',
  ...['agriculture','appliances','automotive','beverage','chemical','cosmetics','custom',
      'electrical','furniture','marine','medical','plumbing','toys'].map((i) => `industries/${i}`)];

const flat = (o, p = '', out = {}) => {
  if (o === null || typeof o !== 'object') { out[p] = o; return out; }
  if (Array.isArray(o)) { o.forEach((v, i) => flat(v, `${p}[${i}]`, out)); return out; }
  for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  return out;
};

const only = process.argv[2];
let totalChanged = 0, totalRemoved = 0, totalAdded = 0;

for (const f of FILES) {
  const path = `src/content/en/${f}.json`;
  let head;
  try { head = JSON.parse(execSync(`git show HEAD:${path}`, { encoding: 'utf8' })); }
  catch { continue; }
  const now = JSON.parse(readFileSync(path, 'utf8'));
  const A = flat(head), B = flat(now);
  const removed = Object.keys(A).filter((k) => !(k in B));
  const added = Object.keys(B).filter((k) => !(k in A));
  const changed = Object.keys(B).filter((k) => k in A && A[k] !== B[k]);
  totalChanged += changed.length; totalRemoved += removed.length; totalAdded += added.length;
  if (!removed.length && !added.length && !changed.length) continue;

  if (only && f !== only && f !== `industries/${only}`) {
    console.log(`${f.padEnd(24)} changed ${String(changed.length).padStart(3)}  removed ${String(removed.length).padStart(3)}  added ${String(added.length).padStart(3)}`);
    continue;
  }
  if (!only) {
    console.log(`${f.padEnd(24)} changed ${String(changed.length).padStart(3)}  removed ${String(removed.length).padStart(3)}  added ${String(added.length).padStart(3)}`);
    continue;
  }
  console.log(`### ${f}`);
  for (const k of removed) console.log(`REMOVE ${k}`);
  for (const k of added) console.log(`ADD    ${k}\n       ${JSON.stringify(B[k])}`);
  for (const k of changed) console.log(`CHANGE ${k}\n       ${JSON.stringify(B[k])}`);
}
if (!only) console.log(`\n  ${totalChanged} changed · ${totalRemoved} removed · ${totalAdded} added`);
