#!/usr/bin/env node
/**
 * READING DENSITY
 *
 * How much a visitor actually has to read before they have opened anything.
 *
 * `innerText` is no use here: a closed `.disc` panel is clipped to zero height
 * but still rendered, so it counts. This walks the text nodes instead and
 * skips any whose ancestors include a closed disclosure — which is the whole
 * point of the progressive-disclosure pass, and therefore the only number
 * worth tracking.
 *
 *   node scripts/check-density.mjs [chapter ...]
 */
import { chromium } from 'playwright';

const BASE = process.env.DENSITY_BASE || 'http://localhost:4321';
const ALL = ['medical','beverage','automotive','cosmetics','appliances','chemical','electrical',
  'consumer-products','agriculture','plumbing','furniture','marine','custom-projects'];
const chapters = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light' });

console.log(`\n  chapter${' '.repeat(13)}visible   behind      height   long paras`);
console.log(`  ${'─'.repeat(60)}`);

const totals = { visible: 0, behind: 0, height: 0, long: 0 };

for (const ch of chapters) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/en/industries/${ch}/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const r = await page.evaluate(() => {
    const main = document.querySelector('main');

    /** True if this node sits inside something the reader has not opened. */
    const isHidden = (node) => {
      for (let el = node.parentElement; el && el !== main; el = el.parentElement) {
        if (el.tagName === 'DETAILS' && !el.open) return true;
        if (el.classList?.contains('disc') && el.dataset.open !== 'true') return true;
        if (el.hidden) return true;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return true;
      }
      return false;
    };

    let visible = 0, behind = 0;
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const t = n.textContent.trim();
      if (t.length < 2) continue;
      const words = t.split(/\s+/).length;
      if (isHidden(n)) behind += words; else visible += words;
    }

    const long = [...main.querySelectorAll('p')].filter((el) => {
      if (isHidden(el) || !el.textContent.trim()) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none') return false;
      const lh = parseFloat(cs.lineHeight) || 20;
      return Math.round(el.getBoundingClientRect().height / lh) > 4;
    }).length;

    return { visible, behind, height: document.documentElement.scrollHeight, long };
  });

  totals.visible += r.visible; totals.behind += r.behind;
  totals.height += r.height; totals.long += r.long;

  console.log(
    `  ${ch.padEnd(20)}${String(r.visible).padStart(7)}${String(r.behind).padStart(9)}` +
    `${String(r.height + 'px').padStart(12)}${String(r.long).padStart(13)}`,
  );
  await page.close();
}

await browser.close();
const share = totals.visible + totals.behind > 0
  ? Math.round((totals.visible / (totals.visible + totals.behind)) * 100) : 100;
console.log(`  ${'─'.repeat(60)}`);
console.log(`  ${'across ' + chapters.length + ' chapters'.padEnd(9)}${String(totals.visible).padStart(9)}${String(totals.behind).padStart(9)}${String(Math.round(totals.height / chapters.length) + 'px avg').padStart(12)}${String(totals.long).padStart(13)}`);
console.log(`\n  ${share}% of the words are visible before the reader opens anything.\n`);
