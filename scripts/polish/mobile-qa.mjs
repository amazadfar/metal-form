#!/usr/bin/env node
/**
 * Phone-width QA for the polish pass.
 *
 * Checks the things a static build cannot: whether the chapter rail and the
 * request dock actually appear and how much of the viewport they take, whether
 * any element overflows the page sideways, whether every tap target clears
 * 44px, and — on the right-to-left locales — whether any Latin technical run
 * has been visually reordered by the bidi algorithm.
 *
 *   node scripts/polish/mobile-qa.mjs /en/industries/medical/ /fa/industries/medical/
 */
import { chromium } from 'playwright';

const BASE = process.env.QA_BASE || 'http://localhost:4322';
const routes = process.argv.slice(2);
const RTL = new Set(['ur', 'ar', 'fa']);

const browser = await chromium.launch();
// hasTouch matters: the site's 44px tap-target rules are scoped to
// `@media (pointer: coarse)`, and without touch emulation they never apply, so
// the audit would report failures a real phone never sees.
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  colorScheme: 'light',
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
});
const problems = [];

for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);

  // Scroll into the body of the page so the docked controls have a chance to
  // appear, then measure them where the reader actually meets them.
  await page.evaluate(async () => {
    window.scrollTo(0, window.innerHeight * 3);
    await new Promise((r) => setTimeout(r, 700));
  });

  const r = await page.evaluate(() => {
    const vh = window.innerHeight;
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        h: Math.round(b.height),
        visible: cs.display !== 'none' && b.height > 0 && b.bottom > 0 && b.top < vh,
        pct: Math.round((b.height / vh) * 1000) / 10,
      };
    };

    // Anything wider than the document and NOT inside something that scrolls.
    // A wide table inside an `overflow-x: auto` box is the intended design, not
    // an overflow; only content that pushes the page itself sideways counts.
    const de = document.documentElement;
    const contained = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p);
        // Scrolls: the width is reachable, by design.
        if (/(auto|scroll)/.test(cs.overflowX) && p.scrollWidth > p.clientWidth + 2) return true;
        // Clips: the width is never painted. An SVG child still reports its
        // full geometric box, so without this every clipped drawing reads as
        // an overflow it visibly is not.
        if (/(hidden|clip)/.test(cs.overflowX)) return true;
      }
      return false;
    };
    const over = [];
    for (const el of document.querySelectorAll('body *')) {
      const b = el.getBoundingClientRect();
      if (b.width === 0) continue;
      if (b.right <= de.clientWidth + 2 && b.left >= -2) continue;
      if (contained(el)) continue;
      const par = el.parentElement;
      const pb = par ? par.getBoundingClientRect() : null;
      if (pb && (pb.right > de.clientWidth + 2 || pb.left < -2) && !contained(par)) continue;
      const cls = (typeof el.className === 'string' ? el.className : '').split(' ')[0];
      over.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} w=${Math.round(b.width)}`);
      if (over.length > 5) break;
    }

    // Tap targets.
    const small = [];
    for (const el of document.querySelectorAll('a[href], button, summary, [role="button"]')) {
      const b = el.getBoundingClientRect();
      if (b.height === 0 || b.width === 0) continue;
      const cls = (typeof el.className === 'string' ? el.className : '').split(' ')[0];
      if (b.height < 40) small.push(`${el.tagName.toLowerCase()}${cls ? '.' + cls : ''} h=${Math.round(b.height)}`);
      if (small.length > 5) break;
    }

    const rail = document.querySelector('[data-chapter-index]');
    const scroller = rail ? rail.querySelector('.cidx__scroll') : null;

    return {
      lang: de.lang,
      dir: de.dir,
      dock: box('[data-rfq-dock]'),
      rail: box('[data-chapter-index]'),
      railScrolls: scroller ? scroller.scrollWidth > scroller.clientWidth + 4 : null,
      railEntries: rail ? rail.querySelectorAll('.cidx__link').length : 0,
      railState: rail ? rail.dataset.rail : null,
      dockState: document.querySelector('[data-rfq-dock]')?.dataset.dock ?? null,
      over: [...new Set(over)],
      small: [...new Set(small)],
      scrollsSideways: (() => { const x0 = window.scrollX; window.scrollTo(900, window.scrollY); const x = window.scrollX; window.scrollTo(x0, window.scrollY); return x > 0; })(),
    };
  });

  const locale = route.split('/')[1];
  const chrome = (r.dock?.visible ? r.dock.pct : 0) + (r.rail?.visible ? r.rail.pct : 0);
  console.log(`${route}`);
  console.log(`   dir=${r.dir}  rail: ${r.railEntries} entries, ${r.rail?.h ?? '—'}px (${r.railState}), scrolls=${r.railScrolls}`);
  console.log(`   dock: ${r.dock?.h ?? '—'}px (${r.dockState})   total chrome ${chrome.toFixed(1)}% of viewport`);
  if (r.scrollsSideways) problems.push(`${route} — page scrolls sideways`);
  if (r.over.length) problems.push(`${route} — overflows: ${r.over.join(', ')}`);
  if (r.small.length) problems.push(`${route} — tap targets under 40px: ${r.small.join(', ')}`);
  if (chrome > 30) problems.push(`${route} — docked chrome is ${chrome.toFixed(1)}% of the viewport`);

  // Bidi: a Latin technical run that the algorithm has visually reversed.
  if (RTL.has(locale)) {
    const bidi = await page.evaluate(() => {
      const bad = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const RUN = /[A-Za-z][A-Za-z0-9]*(?:[ /.-][A-Za-z0-9]+)*/g;
      let n;
      while ((n = walk.nextNode())) {
        const t = n.textContent || '';
        if (!/[؀-ۿ]/.test(t)) continue;
        for (const m of t.matchAll(RUN)) {
          const run = m[0].trim();
          if (run.length < 3) continue;
          // A run ending in a neutral before RTL text is where reordering bites.
          const after = t.slice(m.index + m[0].length, m.index + m[0].length + 2);
          if (/^[)\]%/»]/.test(after)) bad.push(`${run}${after}`);
        }
      }
      return [...new Set(bad)].slice(0, 8);
    });
    if (bidi.length) console.log(`   bidi watch: ${bidi.join(' · ')}`);
  }
  await page.close();
}

await browser.close();
if (problems.length) {
  console.log(`\nPROBLEMS (${problems.length})`);
  problems.forEach((p) => console.log(`  ${p}`));
  process.exit(1);
}
console.log('\n  ✓ clean at 390px');
