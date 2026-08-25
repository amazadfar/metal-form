#!/usr/bin/env node
/**
 * The strings a translation still has to catch up with.
 *
 * Structural deletions are already synced, so what is left is the set of leaves
 * whose English text was rewritten. Prints, for one locale, each such path with
 * the new English and the translation that is now out of date.
 *
 *   node scripts/polish/todo.mjs fa                 # every file
 *   node scripts/polish/todo.mjs fa medical         # one file
 *   node scripts/polish/todo.mjs --paths            # just the paths, once
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { plan, applyPlan } from './sync-structure.mjs';

const FILES = ['common', 'home', 'about', 'capabilities', 'contact', 'industries-index',
  ...['agriculture','appliances','automotive','beverage','chemical','cosmetics','custom',
      'electrical','furniture','marine','medical','plumbing','toys'].map((i) => `industries/${i}`)];

const flat = (o, p = '', out = {}) => {
  if (o === null || typeof o !== 'object') { out[p] = o; return out; }
  if (Array.isArray(o)) { o.forEach((v, i) => flat(v, `${p}[${i}]`, out)); return out; }
  for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  return out;
};

const args = process.argv.slice(2);
const pathsOnly = args.includes('--paths');
const [locale, only] = args.filter((a) => !a.startsWith('--'));

let n = 0;
for (const f of FILES) {
  if (only && f !== only && f !== `industries/${only}`) continue;
  const p = `src/content/en/${f}.json`;
  let head;
  try { head = JSON.parse(execSync(`git show HEAD:${p}`, { encoding: 'utf8' })); } catch { continue; }
  const now = JSON.parse(readFileSync(p, 'utf8'));
  // Replay the structural deletions first, so an element removed from the
  // middle of a list does not report every element after it as rewritten.
  applyPlan(head, plan(head, now));
  const A = flat(head), B = flat(now);
  const loc = locale && !pathsOnly ? flat(JSON.parse(readFileSync(`src/content/${locale}/${f}.json`, 'utf8'))) : null;
  const changed = Object.keys(B).filter((k) => k in A && A[k] !== B[k] && typeof B[k] === 'string');
  if (!changed.length) continue;
  console.log(`\n### ${f}  (${changed.length})`);
  for (const k of changed) {
    n++;
    if (pathsOnly) { console.log(k); continue; }
    console.log(`${k}\n  EN  ${B[k]}\n  OLD ${loc ? loc[k] : ''}`);
  }
}
console.error(`\n${n} string(s)`);
