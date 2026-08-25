#!/usr/bin/env node
/**
 * PROGRESSIVE-DISCLOSURE CODEMOD
 *
 * Wraps a named block in an industry chapter in <TechNote>, so its content
 * stays on the page but behind one restrained control instead of in front of
 * every visitor.
 *
 * Doing this by hand across thirteen 70KB chapters is where mistakes come
 * from: these blocks are deeply nested, and mis-balancing one tag silently
 * moves half a section inside a disclosure. This balances the tags.
 *
 *   node scripts/collapse-block.mjs Marine.astro mar-caveat reasoning
 *   node scripts/collapse-block.mjs Marine.astro mar-loss detail --label=b.economics.lossHeading
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [file, cls, kind = 'detail', ...rest] = process.argv.slice(2);
if (!file || !cls) {
  console.error('usage: collapse-block.mjs <Chapter.astro> <class> [kind] [--label=expr]');
  process.exit(2);
}
const labelArg = rest.find((a) => a.startsWith('--label='))?.slice(8);

const path = join(ROOT, 'src/components/industries', file);
let src = await readFile(path, 'utf8');

/* ── Make sure the component is imported and `locale` is in scope ───────── */
if (!src.includes("import TechNote")) {
  const i = src.indexOf('\n', src.indexOf('import '));
  src = src.slice(0, i + 1) + "import TechNote from '../TechNote.astro';\n" + src.slice(i + 1);
}
const propsMatch = src.match(/const \{ ([^}]*) \} = Astro\.props;/);
if (propsMatch && !/\blocale\b/.test(propsMatch[1])) {
  src = src.replace(propsMatch[0], `const { locale, ${propsMatch[1].trim()} } = Astro.props;`);
}

/* ── Find the opening tag ───────────────────────────────────────────────── */
/* Block-level HTML only. An SVG <path class="el-steel"> shares its class name
   with a <div class="el-steel"> in the same chapter, and balancing the wrong
   tag silently moves half a figure inside the disclosure. */
const open = new RegExp(`<(div|section|ol|ul|dl|aside|figure)([^>]*\\bclass="[^"]*\\b${cls}\\b[^"]*"[^>]*)>`);
/* The same block class often repeats across a chapter's sections; the
   `--all` flag wraps every occurrence that is not already inside a note. */
const wrapAll = rest.includes('--all');
let wrapped_count = 0;
let searchFrom = 0;

function findNext() {
  const rel = src.slice(searchFrom).match(open);
  if (!rel) return null;
  return { ...rel, index: rel.index + searchFrom };
}

let m = findNext();
if (!m) { console.error(`  ✗ ${file}: .${cls} not found`); process.exit(1); }
/* Already inside a note? Count opens against closes before this point. */
{
  const before = src.slice(0, m.index);
  const opens = (before.match(/<TechNote\b/g) || []).length;
  const closes = (before.match(/<\/TechNote>/g) || []).length;
  if (opens > closes) {
    console.error(`  · ${file}: .${cls} is already inside a note, skipped`);
    process.exit(0);
  }
}

while (m) {
const tag = m[1];
const start = m.index;

/* ── Balance to the closing tag ─────────────────────────────────────────── */
let depth = 0;
let i = start;
const openTag = new RegExp(`<${tag}\\b`, 'g');
const closeTag = new RegExp(`</${tag}>`, 'g');
while (i < src.length) {
  openTag.lastIndex = i; closeTag.lastIndex = i;
  const o = openTag.exec(src);
  const c = closeTag.exec(src);
  if (!c) { console.error(`  ✗ ${file}: unbalanced <${tag}> from .${cls}`); process.exit(1); }
  if (o && o.index < c.index) { depth++; i = o.index + tag.length + 1; }
  else {
    depth--; i = c.index + tag.length + 3;
    if (depth === 0) break;
  }
}
const end = i;

const indent = (src.slice(0, start).match(/\n([ \t]*)$/) || [, '      '])[1];
const label = labelArg ? ` label={${labelArg}}` : '';
const wrapped =
  `<TechNote locale={locale} kind="${kind}"${label}>\n` +
  `${indent}  ` + src.slice(start, end).split('\n').join('\n  ') + `\n` +
  `${indent}</TechNote>`;

src = src.slice(0, start) + wrapped + src.slice(end);
wrapped_count++;
searchFrom = start + wrapped.length;
m = wrapAll ? findNext() : null;
// Skip any occurrence already inside a note.
while (m) {
  const before = src.slice(0, m.index);
  if ((before.match(/<TechNote\b/g) || []).length > (before.match(/<\/TechNote>/g) || []).length) {
    searchFrom = m.index + 4; m = findNext();
  } else break;
}
}
await writeFile(path, src);
console.log(`  ✓ ${file}: .${cls} × ${wrapped_count} → <TechNote kind="${kind}">`);
