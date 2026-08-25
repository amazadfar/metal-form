#!/usr/bin/env node
/**
 * Which translations have not caught up with the English editorial pass.
 *
 * For every path the English rewrote, compare the locale's current text with
 * the text it had at HEAD. Still identical means the string is a translation of
 * a sentence that no longer exists.
 *
 *   node scripts/polish/stale.mjs            # count per locale
 *   node scripts/polish/stale.mjs fa         # the remaining paths
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { plan, applyPlan } from './sync-structure.mjs';

const LOCALES = ['ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'];
const FILES = ['common', 'home', 'about', 'capabilities', 'contact', 'industries-index',
  ...['agriculture','appliances','automotive','beverage','chemical','cosmetics','custom',
      'electrical','furniture','marine','medical','plumbing','toys'].map((i) => `industries/${i}`)];

const flat = (o, p = '', out = {}) => {
  if (o === null || typeof o !== 'object') { out[p] = o; return out; }
  if (Array.isArray(o)) { o.forEach((v, i) => flat(v, `${p}[${i}]`, out)); return out; }
  for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
  return out;
};

const want = process.argv[2];
for (const loc of (want ? [want] : LOCALES)) {
  let n = 0;
  for (const f of FILES) {
    const ep = `src/content/en/${f}.json`;
    let head;
    try { head = JSON.parse(execSync(`git show HEAD:${ep}`, { encoding: 'utf8' })); } catch { continue; }
    const now = JSON.parse(readFileSync(ep, 'utf8'));
    applyPlan(head, plan(head, now));
    const A = flat(head), B = flat(now);
    const changed = Object.keys(B).filter((k) => k in A && A[k] !== B[k] && typeof B[k] === 'string');
    if (!changed.length) continue;

    const lp = `src/content/${loc}/${f}.json`;
    let lhead;
    try { lhead = JSON.parse(execSync(`git show HEAD:${lp}`, { encoding: 'utf8' })); } catch { continue; }
    applyPlan(lhead, plan(JSON.parse(execSync(`git show HEAD:${ep}`, { encoding: 'utf8' })), now));
    const LH = flat(lhead), LN = flat(JSON.parse(readFileSync(lp, 'utf8')));
    const stale = changed.filter((k) => k in LN && LN[k] === LH[k]);
    if (!stale.length) continue;
    n += stale.length;
    if (want) { console.log(`  ${f}`); stale.forEach((k) => console.log(`     ${k}`)); }
  }
  console.log(`${loc}: ${n} stale`);
}
