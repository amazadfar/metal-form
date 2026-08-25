#!/usr/bin/env node
/**
 * Right-to-left bidi audit.
 *
 * Latin technical runs — PCO 1881, CATIA, 48 Rc, IQ / OQ / PQ, ±0.05 mm — sit
 * inside Arabic-script paragraphs on three of the nine locales. The Unicode
 * bidi algorithm resolves those correctly on its own; what it cannot resolve is
 * a *neutral* character between a Latin run and the surrounding text, which
 * takes the paragraph's direction and jumps to the other end of the run.
 *
 * This reads the rendered text of every RTL page and reports every Latin run
 * whose immediate neighbour is a neutral — bracket, slash, percent, unit — so
 * each one can be looked at rather than assumed.
 *
 *   node scripts/polish/rtl-qa.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4322';
const LOCALES = ['fa', 'ar', 'ur'];
const PAGES = ['', 'industries/', 'capabilities/', 'about/', 'contact/'];
const CHAPTERS = ['medical', 'beverage', 'automotive', 'chemical', 'plumbing', 'toys',
  'electrical', 'marine', 'custom-projects', 'agriculture', 'appliances', 'cosmetics', 'furniture'];

const routes = [];
for (const l of LOCALES) {
  for (const p of PAGES) routes.push(`/${l}/${p}`);
  for (const c of CHAPTERS) routes.push(`/${l}/industries/${c}/`);
}

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const findings = new Map();
let pages = 0;

for (const route of routes) {
  const p = await c.newPage();
  try {
    await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
  } catch { await p.close(); continue; }
  pages++;
  const hits = await p.evaluate(() => {
    const RTL = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    // A Latin run: letters and digits, possibly with internal spaces or dots.
    const RUN = /[A-Za-z][A-Za-z0-9]*(?:[ ._/-][A-Za-z0-9]+)*/g;
    const out = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const t = n.textContent || '';
      if (!RTL.test(t)) continue;                    // pure-Latin nodes are not bidi
      const el = n.parentElement;
      if (!el || !el.offsetParent) continue;         // not rendered
      for (const m of t.matchAll(RUN)) {
        const run = m[0];
        if (run.trim().length < 2) continue;
        const before = t[m.index - 1] ?? '';
        const after = t[m.index + run.length] ?? '';
        // A neutral immediately adjacent to the run, with RTL on the far side,
        // is the shape that reorders. Anything else the algorithm handles.
        const neutral = /[()[\]{}%/«»‹›"'+\-–—±<>=]/;
        if (neutral.test(after) || neutral.test(before)) {
          out.push(`${before}${run}${after}`.trim());
        }
      }
    }
    return [...new Set(out)];
  });
  for (const h of hits) {
    if (!findings.has(h)) findings.set(h, new Set());
    findings.get(h).add(route);
  }
  await p.close();
}
await b.close();

console.log(`\n  ${pages} right-to-left pages read.`);
if (!findings.size) { console.log('  ✓ No Latin run sits next to a neutral character.\n'); process.exit(0); }
console.log(`\n  Latin runs adjacent to a neutral (${findings.size}) — each needs an eye:\n`);
for (const [run, rs] of [...findings].sort((a, b) => b[1].size - a[1].size)) {
  console.log(`    ${JSON.stringify(run).padEnd(28)} ${rs.size} page(s)  e.g. ${[...rs][0]}`);
}
console.log('');
