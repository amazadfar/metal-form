#!/usr/bin/env node
/**
 * Structural parity check for one locale against the English master.
 *
 *   node scripts/polish/parity.mjs fa            # every file
 *   node scripts/polish/parity.mjs fa common     # one file
 *
 * Reports missing keys, extra keys, and leaves that are still byte-identical to
 * the English — which on a translated page is either a deliberate Latin term or
 * a string somebody forgot.
 */
import { readFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';

const ROOT = new URL('../../src/content/', import.meta.url).pathname;
const [locale, only] = process.argv.slice(2);
if (!locale) { console.error('usage: parity.mjs <locale> [file]'); process.exit(2); }

const FILES = ['common', 'home', 'about', 'capabilities', 'contact', 'industries-index',
  ...['agriculture','appliances','automotive','beverage','chemical','cosmetics','custom',
      'electrical','furniture','marine','medical','plumbing','toys'].map((i) => `industries/${i}`)];

/** Latin technical tokens that are supposed to survive translation unchanged. */
const KEEPS = /^(?:[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Zs}µ°]+)$/u;

let bad = 0;
for (const f of FILES.filter((f) => !only || f === only || f === `industries/${only}`)) {
  const enPath = `${ROOT}en/${f}.json`;
  const loPath = `${ROOT}${locale}/${f}.json`;
  if (!existsSync(loPath)) { console.log(`  ${f}: MISSING`); bad++; continue; }
  const en = JSON.parse(readFileSync(enPath, 'utf8'));
  const lo = JSON.parse(readFileSync(loPath, 'utf8'));

  const flat = (o, p = '', out = {}) => {
    if (o === null || typeof o !== 'object') { out[p] = o; return out; }
    if (Array.isArray(o)) { o.forEach((v, i) => flat(v, `${p}[${i}]`, out)); return out; }
    for (const [k, v] of Object.entries(o)) flat(v, p ? `${p}.${k}` : k, out);
    return out;
  };
  const E = flat(en), L = flat(lo);
  const missing = Object.keys(E).filter((k) => !(k in L));
  const extra = Object.keys(L).filter((k) => !(k in E));
  const same = Object.keys(E).filter((k) => k in L && typeof E[k] === 'string'
    && E[k] === L[k] && E[k].trim().length > 2 && !KEEPS.test(E[k]));

  if (missing.length || extra.length || same.length) {
    bad++;
    console.log(`  ${f}`);
    if (missing.length) console.log(`     missing ${missing.length}: ${missing.slice(0, 6).join(', ')}${missing.length > 6 ? ' …' : ''}`);
    if (extra.length) console.log(`     extra   ${extra.length}: ${extra.slice(0, 6).join(', ')}${extra.length > 6 ? ' …' : ''}`);
    if (same.length) console.log(`     english ${same.length}: ${same.slice(0, 6).join(', ')}${same.length > 6 ? ' …' : ''}`);
  }
}
console.log(bad ? `\n  ${bad} file(s) need work in ${locale}.` : `\n  ✓ ${locale} is structurally complete.`);
