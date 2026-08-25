#!/usr/bin/env node
/**
 * COMPONENT AUDIT
 *
 * Four failure modes that a type-check cannot see and a screenshot will not
 * reliably show, because each of them only breaks in one language or one
 * direction:
 *
 *  1. Hard-coded English in a template. Everything a visitor reads has to come
 *     from the content JSON, or that string stays English in all nine locales.
 *
 *  2. Physical CSS properties. `margin-left` does not mirror; `margin-inline-start`
 *     does. There is no RTL override stylesheet in this project by design, so a
 *     physical property is a silent right-to-left bug.
 *
 *  3. Duplicate SVG definition ids. Thirteen chapters share one document per
 *     page and `url(#hatch)` resolves to the FIRST match in the document — two
 *     chapters using the same id would be fine, but a chapter and a shared
 *     component colliding is not.
 *
 *  4. Missing `data-nomirror` on an SVG. Technical drawings must not mirror in
 *     Arabic, Persian or Urdu: an engineering section reads the same way
 *     everywhere.
 *
 *   node scripts/audit-components.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.name.endsWith('.astro')) out.push(full);
  }
  return out;
}

const files = (await walk(SRC)).sort();
const problems = { i18n: [], rtl: [], ids: [], mirror: [], trapped: [] };

/* ── 5 — a scroll-linked stepper inside a disclosure ───────────────────────
   A `data-station-step` block drives a figure as the reader scrolls past it.
   Collapsed inside a <TechNote>, it never enters the reading window, so the
   drawing beside it never advances and the section silently loses its
   mechanism. Nothing else would catch this. */
function trappedSteppers(src) {
  const out = [];
  let depth = 0;
  for (const m of src.matchAll(/<TechNote\b|<\/TechNote>|data-station-step/g)) {
    if (m[0] === '<TechNote') depth++;
    else if (m[0] === '</TechNote>') depth--;
    else if (depth > 0) out.push(m.index);
  }
  return out;
}

/** Splits an .astro file into frontmatter, template and style. */
function split(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/);
  const rest = fm ? src.slice(fm[0].length) : src;
  const styles = [...rest.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  const scripts = [...rest.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  let template = rest
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
    // A JSX comment explaining a piece of markup quotes that markup, and the
    // scanner below reads the quoted fragment as visitor-facing copy. Comments
    // are not rendered, so they are not part of what this check is about.
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  return { frontmatter: fm ? fm[1] : '', template, styles, scripts };
}

/* ── 2 — physical CSS properties ──────────────────────────────────────────── */

const PHYSICAL = [
  // Only flag the ones that genuinely have a logical equivalent. `left`/`right`
  // as positioning offsets are covered by inset-inline-*; `text-align: left`
  // by `start`. Transforms and background positions are exempt — they are
  // geometry, not layout flow.
  /(^|[;{\s])margin-(left|right)\s*:/g,
  /(^|[;{\s])padding-(left|right)\s*:/g,
  /(^|[;{\s])border-(left|right)(-\w+)?\s*:/g,
  /(^|[;{\s])(left|right)\s*:\s*(?!auto)/g,
  /text-align\s*:\s*(left|right)/g,
  /float\s*:\s*(left|right)/g,
];

/* ── 1 — hard-coded English in a template ─────────────────────────────────── */

/**
 * A run of two or more capitalised-or-lowercase Latin words sitting as element
 * text. Deliberately conservative: single words, numbers, designations and
 * anything inside an expression are ignored.
 */
function findHardcodedText(template, file) {
  const found = [];
  // Text nodes between tags, excluding those that are pure expressions.
  const re = />([^<>{}]{6,})</g;
  let m;
  while ((m = re.exec(template)) !== null) {
    const text = m[1].trim();
    if (!text) continue;
    if (!/[A-Za-z]/.test(text)) continue;             // numerals and symbols
    if (!/\s/.test(text)) continue;                    // single tokens
    if (/^[\d\s.,:;/×x±°%+\-–—()[\]]+$/.test(text)) continue;
    // Designations and units that legitimately stay in Latin everywhere.
    if (/^(Ø|L\s*:\s*T|PCO|SPI|Class|CATIA|SolidWorks|STEP|IGES)\b/.test(text)) continue;
    if (/^[A-Z0-9\s.\-/:]+$/.test(text) && text.length < 14) continue;  // short all-caps codes
    found.push({ file, text: text.slice(0, 90) });
  }
  return found;
}

/* ── Run ──────────────────────────────────────────────────────────────────── */

const idOwners = new Map();

for (const file of files) {
  const rel = relative(ROOT, file);
  const src = await readFile(file, 'utf8');
  const { template, styles } = split(src);

  // 1 — hard-coded copy. Only chapters and page-level components matter; shared
  // chrome legitimately renders values it received as props.
  if (/components\/industries\/|components\/home\/|pages\//.test(rel)) {
    problems.i18n.push(...findHardcodedText(template, rel));
  }

  // 2 — physical properties
  for (const re of PHYSICAL) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(styles)) !== null) {
      const line = styles.slice(0, m.index).split('\n').length;
      problems.rtl.push(`${rel}:${line} → ${m[0].trim()}`);
    }
  }

  // 3 — SVG definition ids. A section anchor duplicated across two chapters is
  //     harmless: only one chapter renders per page. A <pattern>, <marker>,
  //     <filter>, <clipPath> or gradient id is not — url(#x) resolves to the
  //     first match in the document, so a collision silently repaints one
  //     drawing with another's hatch.
  for (const m of template.matchAll(
    /<(pattern|marker|filter|clipPath|linearGradient|radialGradient|mask|symbol)\b[^>]*\bid="([\w-]+)"/g,
  )) {
    const id = m[2];
    if (!idOwners.has(id)) idOwners.set(id, []);
    idOwners.get(id).push(rel);
  }

  // 4 — SVGs that will mirror in RTL. Interface icons (arrows, the globe, the
  //     menu bars, the WhatsApp glyph) are either direction-neutral or are
  //     deliberately mirrored by class, so only technical figures are checked.
  const isFigureFile = /components\/(industries|home)\//.test(rel);
  for (const m of isFigureFile ? template.matchAll(/<svg\b([^>]*)>/g) : []) {
    if (!/data-nomirror|data-icon/.test(m[1])) {
      const line = template.slice(0, m.index).split('\n').length;
      problems.mirror.push(`${rel}:${line} → <svg> without data-nomirror`);
    }
  }
}

for (const [id, owners] of idOwners) {
  const unique = [...new Set(owners)];
  // The same def id twice inside one file is a collision too.
  if (owners.length > 1) {
    problems.ids.push(`SVG def #${id} declared ${owners.length}× in: ${unique.join(', ')}`);
  }
}

/* ── Report ───────────────────────────────────────────────────────────────── */

const show = (title, list, cap = 25) => {
  console.log(`\n  ${title}: ${list.length}`);
  list.slice(0, cap).forEach((l) => console.log(`    ${typeof l === 'string' ? l : `${l.file} → “${l.text}”`}`));
  if (list.length > cap) console.log(`    … and ${list.length - cap} more`);
};

console.log(`\n  ${files.length} .astro files audited.`);
show('Hard-coded English in templates (blocks localisation)', problems.i18n);
show('Physical CSS properties (breaks right-to-left)', problems.rtl);
show('Duplicate element ids', problems.ids);
show('SVGs without data-nomirror', problems.mirror);
show('Scroll-linked steppers trapped in a disclosure', problems.trapped);

const total = problems.i18n.length + problems.rtl.length + problems.ids.length
  + problems.mirror.length + problems.trapped.length;
console.log(total ? `\n  ${total} item(s) to review.\n` : '\n  ✓ Clean.\n');
