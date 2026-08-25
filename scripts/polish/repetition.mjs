#!/usr/bin/env node
/**
 * Which two sections of a chapter say the same thing?
 *
 * The brief's rule is that every section must contribute a genuinely new idea.
 * Judging that by eye across thirteen chapters means reading 55,000 words.
 * This narrows it: for each pair of blocks in a chapter, compare their content
 * words (stopwords and the vocabulary common to the whole chapter removed) and
 * report the pairs that overlap enough to be worth reading side by side.
 */
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const STOP = new Set(`a an the and or but of to in on at for with from by is are was were be been
being it its this that these those as not no we you your our their they them he she which who whom
what when where why how than then so if can could will would should may might must do does did
have has had one two three four five six seven eight nine ten more most less least other another
same different each every all any both few many much some such only just also very over under into
out up down about after before between during through while because since until against above below
there here now yet still even own too own s t re ll ve d m`.split(/\s+/));

const text = (o, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => text(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => text(v, out));
  return out;
};
const bag = (s) => {
  const m = new Map();
  for (const w of s.toLowerCase().match(/[a-z][a-z'-]{2,}/g) ?? []) {
    if (STOP.has(w)) continue;
    m.set(w, (m.get(w) ?? 0) + 1);
  }
  return m;
};

let found = 0;
for (const file of globSync('src/content/en/industries/*.json').sort()) {
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const name = file.split('/').pop().replace('.json', '');
  const blocks = Object.entries(d.blocks ?? {})
    .map(([k, v]) => ({ k, words: text(v).join(' ') }))
    .filter((b) => b.words.split(/\s+/).length > 60);

  // A word that appears in most of the chapter's blocks is the chapter's own
  // subject, not evidence that two sections repeat each other.
  const df = new Map();
  blocks.forEach((b) => { for (const w of new Set(bag(b.words).keys())) df.set(w, (df.get(w) ?? 0) + 1); });
  const common = new Set([...df].filter(([, n]) => n > blocks.length * 0.5).map(([w]) => w));

  const sets = blocks.map((b) => ({ k: b.k, s: new Set([...bag(b.words).keys()].filter((w) => !common.has(w))) }));
  const pairs = [];
  for (let i = 0; i < sets.length; i++) {
    for (let j = i + 1; j < sets.length; j++) {
      const A = sets[i].s, B = sets[j].s;
      if (A.size < 12 || B.size < 12) continue;
      let hit = 0; for (const w of A) if (B.has(w)) hit++;
      const jac = hit / (A.size + B.size - hit);
      if (jac > 0.16) pairs.push({ a: sets[i].k, b: sets[j].k, jac });
    }
  }
  if (!pairs.length) continue;
  found += pairs.length;
  console.log(`\n  ${name}`);
  pairs.sort((x, y) => y.jac - x.jac).slice(0, 4)
    .forEach((p) => console.log(`     ${(p.jac * 100).toFixed(0)}%  ${p.a} ↔ ${p.b}`));
}
console.log(found ? `\n  ${found} pair(s) worth reading side by side.\n` : '\n  ✓ No two blocks overlap materially.\n');
