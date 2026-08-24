#!/usr/bin/env node
/**
 * HORIZONTAL OVERFLOW CHECK
 *
 * A page that scrolls sideways on a phone is the most obvious possible defect
 * and the easiest to ship: it usually comes from one element — a wide table, a
 * fixed-width figure, a grid track that will not shrink — and `body` hides the
 * symptom with `overflow-x: clip` while the layout underneath is still broken.
 *
 * A pass/fail is not actionable, so this names the element. It walks every
 * element, finds the ones whose box extends past the viewport, and reports the
 * outermost of them — the one actually causing it, rather than the fifty
 * children being carried along with it.
 *
 *   npm run build && npx astro preview --port 4321 &
 *   node scripts/check-overflow.mjs [route ...]
 */
import { chromium } from 'playwright';

const BASE = process.env.OVERFLOW_BASE || 'http://localhost:4321';
const WIDTHS = [390, 768];
const SLACK = 2;

const INDUSTRIES = [
  'medical', 'beverage', 'automotive', 'cosmetics', 'appliances', 'chemical',
  'electrical', 'consumer-products', 'agriculture', 'plumbing', 'furniture',
  'marine', 'custom-projects',
];

const routes = process.argv.slice(2).length ? process.argv.slice(2) : [
  '/',
  ...['en', 'fa', 'ar', 'ur', 'ru', 'zh'].flatMap((l) => [
    `/${l}/`, `/${l}/capabilities/`, `/${l}/about/`, `/${l}/contact/`, `/${l}/industries/`,
  ]),
  ...INDUSTRIES.flatMap((i) => [`/en/industries/${i}/`, `/fa/industries/${i}/`]),
];

const browser = await chromium.launch();
const findings = [];

for (const width of WIDTHS) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });

  for (const route of routes) {
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
      await page.evaluate(() => document.fonts.ready);

      const hits = await page.evaluate((slack) => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        const over = [];

        /**
         * An element inside a box that scrolls or clips is allowed to be wider
         * than the viewport — that is the whole point of `.scroller`, and of a
         * 3200-unit drawing rail the reader pans along. Only overflow that
         * actually escapes to the page is a defect.
         */
        const isContained = (el) => {
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p);
            if (['auto', 'scroll', 'hidden', 'clip'].includes(o.overflowX)) return true;
            if (o.position === 'fixed') return true;
          }
          return false;
        };

        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') continue;
          // A fixed overlay is allowed to be its own width.
          if (cs.position === 'fixed') continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const past = Math.max(0, Math.round(r.right - vw), Math.round(-r.left));
          if (past <= slack) continue;
          if (isContained(el)) continue;
          over.push({ el, past });
        }

        // Report only the outermost offenders: a child carried along by its
        // parent is not the bug.
        for (const { el, past } of over) {
          if (over.some((o) => o.el !== el && o.el.contains(el))) continue;
          const cls = typeof el.className === 'string' && el.className
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
          out.push({ where: el.tagName.toLowerCase() + cls, past });
        }
        return out.slice(0, 6);
      }, SLACK);

      /**
       * The document's own width, which is a different question from whether
       * any element sticks out.
       *
       * A wide table inside a scroll container can still expand the html box
       * past the viewport. `body { overflow-x: clip }` then hides the symptom —
       * the page will not scroll, `window.scrollX` stays 0, and in a
       * left-to-right locale nothing looks wrong at all. In a right-to-left
       * locale the layout origin is the RIGHT edge of that wider box, so every
       * line starts 200px off-screen and the page looks broken. That is the
       * defect this catches, and nothing else on the site would have.
       */
      const doc = await page.evaluate(() => {
        const de = document.documentElement;
        return { scrollW: de.scrollWidth, clientW: de.clientWidth };
      });
      if (doc.scrollW > doc.clientW + SLACK) {
        findings.push({
          route,
          width,
          where: 'the document itself',
          past: doc.scrollW - doc.clientW,
          scrolls: true,
        });
      }

      hits.forEach((h) => findings.push({ route, width, ...h, scrolls: false }));
    } catch (err) {
      findings.push({ route, width, where: 'page', past: 0, scrolls: false, err: String(err).slice(0, 80) });
    }
    await page.close();
  }
  await ctx.close();
}

await browser.close();

console.log(`\n  ${routes.length} routes × ${WIDTHS.join('px, ')}px checked — element overflow and document width.`);
if (findings.length) {
  console.log(`\n  OVERFLOW (${findings.length})`);
  const byRoute = new Map();
  for (const f of findings) {
    const k = `${f.route} @${f.width}`;
    if (!byRoute.has(k)) byRoute.set(k, []);
    byRoute.get(k).push(f);
  }
  for (const [k, list] of byRoute) {
    console.log(`\n    ${k}${list.some((f) => f.scrolls) ? '  — THE DOCUMENT IS WIDER THAN THE VIEWPORT' : ''}`);
    list.forEach((f) => console.log(`      ${f.where.padEnd(40)} ${f.past}px past the edge${f.err ? '  ' + f.err : ''}`));
  }
  console.log('');
  process.exit(1);
}
console.log('\n  ✓ Nothing reaches past the viewport at phone or tablet width.\n');
