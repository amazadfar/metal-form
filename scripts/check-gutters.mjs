#!/usr/bin/env node
/**
 * GUTTER CHECK
 *
 * A rule that divides two columns needs air on both sides of it. It is an easy
 * thing to get wrong — you pad the trailing edge of a column, the divider looks
 * right in the component you are writing, and every column after the first ends
 * up with its text sitting on the line.
 *
 * This walks a real page and flags any element that draws a border on one of
 * its inline edges but leaves less than a readable gap between that border and
 * its own text. It also flags an element whose text starts within a few pixels
 * of a border drawn by the element immediately before it.
 *
 *   npm run build && npx astro preview --port 4321 &
 *   node scripts/check-gutters.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.GUTTER_BASE || 'http://localhost:4321';
/** Below this, a character is touching the rule. */
const MIN_GAP = 9;

const ROUTES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      '/', '/en/', '/en/capabilities/', '/en/about/', '/en/contact/', '/en/industries/',
      '/en/industries/medical/', '/en/industries/beverage/', '/en/industries/automotive/',
      '/en/industries/cosmetics/', '/en/industries/appliances/', '/en/industries/chemical/',
      '/en/industries/electrical/', '/en/industries/consumer-products/',
      '/en/industries/agriculture/', '/en/industries/plumbing/', '/en/industries/furniture/',
      '/en/industries/marine/', '/en/industries/custom-projects/',
      '/fa/', '/fa/industries/beverage/', '/ar/industries/medical/',
    ];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: 'light',
  reducedMotion: 'reduce',
});

const findings = [];

for (const route of ROUTES) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready);

    const hits = await page.evaluate((minGap) => {
      const out = [];
      const seen = new Set();
      const rtl = document.documentElement.dir === 'rtl';

      const describe = (el) => {
        const cls = typeof el.className === 'string' && el.className
          ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
          : '';
        return el.tagName.toLowerCase() + cls;
      };

      /**
       * The first line box of an element's own text. Measuring the text rather
       * than the box is the whole point: a padding value tells you nothing when
       * the column is separated by a grid gap instead, and a box tells you
       * nothing when the text inside it is indented.
       */
      const firstTextRect = (el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
        range.detach?.();
        if (!rects.length) return null;
        return rects.reduce((best, r) => {
          if (r.top < best.top - 2) return r;
          if (Math.abs(r.top - best.top) < 2) {
            return rtl ? (r.right > best.right ? r : best) : (r.left < best.left ? r : best);
          }
          return best;
        });
      };

      /** Distance from a vertical rule to the first character after it. */
      const gapFrom = (lineX, textRect) =>
        rtl ? lineX - textRect.right : textRect.left - lineX;

      const hasOwnText = (el) =>
        [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);

      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 12) continue;

        const startW = parseFloat(cs.borderInlineStartWidth) || 0;
        const endW = parseFloat(cs.borderInlineEndWidth) || 0;
        const blockStart = parseFloat(cs.borderBlockStartWidth) || 0;
        const blockEnd = parseFloat(cs.borderBlockEndWidth) || 0;
        // A border on all four sides frames a chip or a plate; it is not a
        // divider between two columns and its inset is a design decision.
        if (startW > 0 && endW > 0 && blockStart > 0 && blockEnd > 0) continue;

        const text = hasOwnText(el) ? firstTextRect(el) : null;

        // 1. The element draws its own divider and its text sits on it.
        if (startW > 0 && text) {
          const lineX = rtl ? r.right - startW : r.left + startW;
          const gap = gapFrom(lineX, text);
          if (gap >= 0 && gap < minGap) {
            const key = describe(el) + '|own';
            if (!seen.has(key)) { seen.add(key); out.push({ where: describe(el), edge: 'on its own rule', gap: Math.round(gap) }); }
          }
        }

        // 2. The previous sibling draws a divider this element's text sits on.
        const prev = el.previousElementSibling;
        if (prev) {
          const pcs = getComputedStyle(prev);
          const prevEnd = parseFloat(pcs.borderInlineEndWidth) || 0;
          const pr = prev.getBoundingClientRect();
          const sameRow = Math.abs(pr.top - r.top) < 6;
          if (prevEnd > 0 && sameRow) {
            // The element's own text, or the text of whatever leads it.
            let t = text;
            if (!t) {
              const lead = el.querySelector('*');
              if (lead && hasOwnText(lead)) t = firstTextRect(lead);
            }
            if (t) {
              const lineX = rtl ? pr.left + prevEnd : pr.right - prevEnd;
              const gap = gapFrom(lineX, t);
              if (gap >= 0 && gap < minGap) {
                const key = describe(el) + '|prev';
                if (!seen.has(key)) { seen.add(key); out.push({ where: describe(el), edge: 'after a sibling rule', gap: Math.round(gap) }); }
              }
            }
          }
        }
      }
      return out;
    }, MIN_GAP);

    hits.forEach((h) => findings.push({ route, ...h }));
  } catch (err) {
    findings.push({ route, where: 'page', edge: String(err).slice(0, 80), gap: 0 });
  }
  await page.close();
}

await browser.close();

console.log(`\n  ${ROUTES.length} routes checked for column gutters (minimum ${MIN_GAP}px).`);
if (findings.length) {
  console.log(`\n  TIGHT GUTTERS (${findings.length})`);
  const byRoute = new Map();
  for (const f of findings) {
    if (!byRoute.has(f.route)) byRoute.set(f.route, []);
    byRoute.get(f.route).push(f);
  }
  for (const [route, list] of byRoute) {
    console.log(`\n    ${route}`);
    list.slice(0, 12).forEach((f) => console.log(`      ${f.where.padEnd(40)} ${f.edge.padEnd(22)} ${f.gap}px`));
    if (list.length > 12) console.log(`      … and ${list.length - 12} more`);
  }
  console.log('');
  process.exit(1);
}
console.log('\n  ✓ Every ruled column clears its divider.\n');
