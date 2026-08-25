#!/usr/bin/env node
/**
 * How long is the default browsing layer?
 *
 * The brief asks that a chapter be understandable in 60–90 seconds without
 * opening anything. That is a word count on the *visible* text — everything
 * behind a closed disclosure does not count, because nobody has read it yet.
 * Counts what a reader actually meets, and what waits behind a click.
 */
import { chromium } from 'playwright';
const BASE = process.env.QA_BASE || 'http://localhost:4322';
const WPM = 240;                                  // silent reading, technical prose
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
console.log('\n  route                                visible   behind    ~read');
for (const route of process.argv.slice(2)) {
  const p = await c.newPage();
  await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
  await p.evaluate(async () => {
    const s = Math.round(innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 20)); }
    scrollTo(0, 0);
  });
  const r = await p.evaluate(() => {
    const words = (s) => (s || '').trim().split(/\s+/).filter(Boolean).length;
    // CJK and Thai do not space their words; count characters and scale.
    const count = (s) => {
      const cjk = (s.match(/[一-鿿㐀-䶿฀-๿]/g) || []).length;
      return cjk > s.length / 3 ? Math.round(cjk / 2.2) : words(s);
    };
    const main = document.querySelector('main');
    const hiddenText = [...document.querySelectorAll(".disc[data-open='false'] .disc__panel, details.tnote:not([open]) .tnote__body")]
      .map((e) => e.textContent || '').join(' ');
    return { total: count(main.innerText + ' ' + hiddenText), hidden: count(hiddenText) };
  });
  const visible = r.total - r.hidden;
  console.log(`  ${route.padEnd(36)} ${String(visible).padStart(6)} ${String(r.hidden).padStart(8)}   ${(visible / WPM).toFixed(1)} min`);
  await p.close();
}
await b.close();
console.log('');
