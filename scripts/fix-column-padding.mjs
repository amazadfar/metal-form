#!/usr/bin/env node
/**
 * COLUMN GUTTER CODEMOD
 *
 * A rule that divides two columns needs air on BOTH sides of it. The idiom
 * used across this codebase — `border-inline-end: var(--rule)` with
 * `padding-inline: 0 <x>` — pads only the trailing edge, so every column after
 * the first has its text sitting directly on the previous column's border.
 * It is invisible while you are writing one component and obvious the moment
 * you look at a whole page.
 *
 * This adds `--col-pad` to the leading edge of every ruled column and resets it
 * to zero on the first one, so the grid still starts flush with the page
 * gutter and the headline above it.
 *
 *   node scripts/fix-column-padding.mjs [--dry]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');

/**
 * Each entry names a rule block by its selector and the file it lives in.
 * Explicit rather than pattern-matched: these are the column grids, and a
 * blind sweep would also catch the accent bars that use `border-inline-start`
 * decoratively and already carry the padding they need.
 */
const TARGETS = [
  { file: 'src/components/TrustRow.astro',              sel: '.trust--row .trust__item', first: '.trust--row .trust__item:first-child' },
  { file: 'src/pages/[lang]/about.astro',               sel: '.ab-fact',                 first: '.ab-fact:first-child' },
  { file: 'src/components/industries/Cosmetics.astro',  sel: '.cos-note',                first: '.cos-note:first-child' },
  { file: 'src/components/industries/Marine.astro',     sel: '.mar-mvs li',              first: '.mar-mvs li:first-child' },
  { file: 'src/components/industries/Plumbing.astro',   sel: '.plm-three li',            first: '.plm-three li:first-child' },
  { file: 'src/components/industries/Plumbing.astro',   sel: '.plm-notes__item',         first: '.plm-notes__item:first-child' },
  { file: 'src/components/industries/Medical.astro',    sel: '.med-atlas__index',        first: null },
  { file: 'src/components/industries/Appliances.astro', sel: '.app-bar__seg',            first: '.app-bar__seg:first-child' },
  { file: 'src/components/industries/Custom.astro',     sel: '.cx-tri__rail .cx-tri__tab', first: '.cx-tri__rail .cx-tri__tab:first-child' },
  { file: 'src/components/NavOverlay.astro',            sel: '.ov__col--industries',     first: null },
];

let changed = 0;
const report = [];

for (const t of TARGETS) {
  const path = join(ROOT, t.file);
  let src = await readFile(path, 'utf8');

  // Find the declaration block for this exact selector.
  const escaped = t.sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(^[ \\t]*${escaped}\\s*\\{)([^{}]*)(\\})`, 'm');
  const m = src.match(re);
  if (!m) { report.push(`  · ${t.file} — ${t.sel}: selector not found, skipped`); continue; }

  let body = m[2];
  if (/padding-inline-start\s*:/.test(body)) { report.push(`  · ${t.file} — ${t.sel}: already has a leading pad`); continue; }

  const before = body;

  // `padding-inline: 0 X` → `padding-inline: var(--col-pad) X`
  body = body.replace(/padding-inline\s*:\s*0(\s+[^;]+);/, 'padding-inline: var(--col-pad)$1;');

  if (body === before) {
    // No shorthand: add an explicit leading pad next to the divider.
    body = body.replace(/(\n[ \t]*)(border-inline-end\s*:)/, '$1padding-inline-start: var(--col-pad);$1$2');
  }
  if (body === before) {
    body = `\n    padding-inline-start: var(--col-pad);${body}`;
  }

  src = src.slice(0, m.index) + m[1] + body + m[3] + src.slice(m.index + m[0].length);

  // The first column stays flush with the page gutter so it still lines up
  // with the heading above it.
  if (t.first) {
    const insertAfter = src.indexOf(m[3], m.index) + 1;
    const reset = `\n  ${t.first} { padding-inline-start: 0; }`;
    src = src.slice(0, insertAfter) + reset + src.slice(insertAfter);
  }

  if (!DRY) await writeFile(path, src);
  changed++;
  report.push(`  ✓ ${t.file} — ${t.sel}`);
}

console.log(`\n  Column gutters${DRY ? ' (dry run)' : ''}: ${changed}/${TARGETS.length} rules updated`);
report.forEach((r) => console.log(r));
console.log('');
