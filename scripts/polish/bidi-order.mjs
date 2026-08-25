#!/usr/bin/env node
/**
 * Does a Latin technical run render in the order it was written?
 *
 * A screenshot answers this for one string on one page. This answers it for
 * every one of them: for each Latin run inside a right-to-left paragraph, walk
 * the run character by character with a Range, read each glyph's x position,
 * and check they ascend — which is what left-to-right inside right-to-left is
 * supposed to look like. Then check the run's own bounding box does not
 * overlap the text on either side of it, which is what a reordering looks like
 * when it happens.
 *
 *   node scripts/polish/bidi-order.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4322';
const LOCALES = ['fa', 'ar', 'ur'];
const CHAPTERS = ['medical', 'beverage', 'automotive', 'chemical', 'plumbing', 'toys',
  'electrical', 'marine', 'custom-projects', 'agriculture', 'appliances', 'cosmetics', 'furniture'];
const routes = LOCALES.flatMap((l) => [
  `/${l}/`, `/${l}/capabilities/`, `/${l}/about/`, `/${l}/contact/`, `/${l}/industries/`,
  ...CHAPTERS.map((c) => `/${l}/industries/${c}/`),
]);

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1200, height: 900 } });
const bad = [];
let runs = 0, pages = 0;

for (const route of routes) {
  const p = await c.newPage();
  try { await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 }); }
  catch { await p.close(); continue; }
  await p.evaluate(() => document.fonts.ready);
  // Open everything so text inside panels and inactive tabs is measurable.
  await p.evaluate(async () => {
    document.querySelectorAll('.disc__btn').forEach((x) => { if (x.getAttribute('aria-expanded') !== 'true') x.click(); });
    document.querySelectorAll('details').forEach((d) => { d.open = true; });
    document.querySelectorAll('[hidden]').forEach((e) => e.removeAttribute('hidden'));
    await new Promise((r) => setTimeout(r, 350));
  });
  pages++;

  const res = await p.evaluate(() => {
    const RTL = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const RUN = /[A-Za-z][A-Za-z0-9]*(?:[ ._/-][A-Za-z0-9]+)*/g;
    const out = { checked: 0, bad: [] };
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent || '';
      if (!RTL.test(t)) continue;
      const el = n.parentElement;
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;

      for (const m of t.matchAll(RUN)) {
        const run = m[0].trim();
        if (run.length < 3) continue;
        const start = m.index + (m[0].length - m[0].trimStart().length);
        out.checked++;

        // Where does each character of the run actually sit?
        const xs = [];
        for (let i = 0; i < run.length; i++) {
          if (run[i] === ' ') continue;
          const r = document.createRange();
          try { r.setStart(n, start + i); r.setEnd(n, start + i + 1); } catch { continue; }
          const rect = r.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) continue;
          xs.push({ ch: run[i], x: rect.left, y: Math.round(rect.top) });
        }
        if (xs.length < 3) continue;

        // Only judge characters that share a line — a run that wraps is not
        // a bidi failure, it is a line break.
        const line = xs.filter((v) => v.y === xs[0].y);
        if (line.length < 3) continue;
        let ascending = true;
        for (let i = 1; i < line.length; i++) if (line[i].x < line[i - 1].x - 0.5) { ascending = false; break; }
        if (!ascending) {
          out.bad.push({ run, visual: line.slice().sort((a, b) => a.x - b.x).map((v) => v.ch).join('') });
        }
      }
    }
    return out;
  });

  runs += res.checked;
  for (const x of res.bad) bad.push({ route, ...x });
  await p.close();
}
await b.close();

console.log(`\n  ${pages} right-to-left pages · ${runs} Latin runs measured character by character.`);
if (!bad.length) {
  console.log('  ✓ Every run renders left to right, in the order it was written.\n');
  process.exit(0);
}
console.log(`\n  REORDERED (${bad.length})`);
for (const x of bad.slice(0, 20)) console.log(`    ${x.route}  wrote "${x.run}"  renders "${x.visual}"`);
console.log('');
process.exit(1);
