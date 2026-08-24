#!/usr/bin/env node
/**
 * Types the callback parameters in industry chapter templates.
 *
 * Chapter content is read out of `content.blocks`, which is deliberately typed
 * as `any` — thirteen chapters each define their own shape, and forcing a union
 * type on them would make the content contract unusable. The consequence is
 * that `blocks.items.map((item) => …)` has an implicitly-typed parameter, which
 * `astro check` rejects under `strict`.
 *
 * Rather than loosening `noImplicitAny` for the whole project — which would hide
 * real errors everywhere else — this annotates the callback parameters in the
 * chapter templates only. Index parameters are typed `number`; everything else
 * `any`, because that is genuinely what they are.
 *
 *   node scripts/fix-implicit-any.mjs [file …]
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'src', 'components', 'industries');

/**
 * Parameter names that are conventionally the array index — and only ever in
 * the second position. `n` in first position is usually a note or a number
 * object, not a counter, so position matters as much as the name.
 */
const INDEXY = /^(i|idx|index|_i)$/;

/** `.map((a, b) => ` and friends, where the parameters carry no annotation. */
const CALLBACK = /\.(map|filter|forEach|flatMap|find|findIndex|some|every|reduce)\(\s*\(([^)]*)\)\s*=>/g;

function annotate(params) {
  return params
    .split(',')
    .map((raw, position) => {
      const p = raw.trim();
      if (!p) return null;
      if (p.includes(':')) return p;               // already annotated
      if (p.startsWith('{') || p.startsWith('[')) return p; // destructured — leave alone
      if (p === '_') return '_: any';
      return position > 0 && INDEXY.test(p) ? `${p}: number` : `${p}: any`;
    })
    .filter(Boolean)
    .join(', ');
}

/** Only the template half of an .astro file needs this; the frontmatter is real TS. */
function fixTemplate(src) {
  const fm = src.match(/^---\n[\s\S]*?\n---\n/);
  const head = fm ? fm[0] : '';
  const body = fm ? src.slice(fm[0].length) : src;
  let changed = 0;
  const fixed = body.replace(CALLBACK, (whole, method, params) => {
    const next = annotate(params);
    if (next === params.trim()) return whole;
    changed++;
    return `.${method}((${next}) =>`;
  });
  return { out: head + fixed, changed };
}

const targets = process.argv.slice(2).length
  ? process.argv.slice(2)
  : (await readdir(DIR)).filter((f) => f.endsWith('.astro')).map((f) => join(DIR, f));

let total = 0;
for (const file of targets) {
  const src = await readFile(file, 'utf8');
  const { out, changed } = fixTemplate(src);
  if (changed) {
    await writeFile(file, out, 'utf8');
    console.log(`  ${relative(ROOT, file)} — ${changed} callback(s) annotated`);
    total += changed;
  }
}
console.log(total ? `\n  ${total} annotated.\n` : '\n  Nothing to annotate.\n');
