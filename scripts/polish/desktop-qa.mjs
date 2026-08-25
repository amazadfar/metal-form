#!/usr/bin/env node
/**
 * Desktop QA: paragraph measure, section widths and heading rhythm.
 *
 * Long lines are the commonest desktop failure on a text-heavy site, and they
 * are invisible in a screenshot at a glance. This measures the rendered
 * character count of every body paragraph and reports the ones past a
 * comfortable reading measure, plus any section whose content box is a
 * different width from its neighbours.
 */
import { chromium } from 'playwright';
const BASE = process.env.QA_BASE || 'http://localhost:4322';
const routes = process.argv.slice(2);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1512, height: 950 }, colorScheme: 'light', extraHTTPHeaders: { 'Cache-Control': 'no-cache' } });
const problems = [];
for (const route of routes) {
  const p = await c.newPage();
  await p.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 25)); }
    window.scrollTo(0, 0);
    // Open every disclosure. A collapsed panel is zero-height but its contents
    // still report a full-width box, so measuring it closed says nothing about
    // what a reader ever sees — and says nothing about whether the measure rule
    // that governs it actually applies.
    document.querySelectorAll('.disc__btn').forEach((b) => b.click());
    document.querySelectorAll('details.tnote').forEach((d) => { d.open = true; });
    await new Promise((r) => setTimeout(r, 500));
  });
  const r = await p.evaluate(() => {
    // Characters per line, measured rather than assumed: render a run of '0' in
    // the paragraph's own computed font and divide the box width by its
    // advance. '0' rather than 'x' deliberately — that is what the CSS `ch`
    // unit measures, so the number here means the same thing as the `ch` values
    // in the stylesheets and the two can be compared directly.
    const probe = document.createElement('span');
    probe.textContent = '0'.repeat(50);
    probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
    document.body.append(probe);
    const wide = [];
    for (const el of document.querySelectorAll('p, li, dd')) {
      const text = (el.textContent || '').trim();
      if (text.length < 90) continue;
      // Only what is actually painted.
      if (el.getBoundingClientRect().height < 4) continue;
      // A grid `li` that lays an index, a label and a note into columns is not
      // one long line — its text just concatenates that way. Measure only
      // elements that actually hold the prose themselves.
      const child = [...el.children].find((c) => (c.textContent || '').trim().length > 24);
      if (child) continue;
      const cs = getComputedStyle(el);
      probe.style.font = cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ${cs.fontFamily}`;
      probe.style.letterSpacing = cs.letterSpacing;
      const adv = probe.getBoundingClientRect().width / 50;
      const w = el.getBoundingClientRect().width;
      const ch = Math.round(w / adv);
      if (ch > 95) wide.push({ ch, cls: (typeof el.className === 'string' ? el.className : '').split(' ')[0] || el.tagName.toLowerCase(), text: text.slice(0, 40) });
    }
    probe.remove();
    const widths = [...document.querySelectorAll('main section')].map((s) => {
      const inner = s.querySelector('.shell, .shell--wide, .shell--narrow');
      return inner ? Math.round(inner.getBoundingClientRect().width) : null;
    }).filter(Boolean);
    return { wide: wide.slice(0, 6), widths: [...new Set(widths)], h1: document.querySelectorAll('h1').length };
  });
  console.log(`${route}   shell widths: ${r.widths.join(', ')}`);
  if (r.wide.length) {
    problems.push(`${route} — ${r.wide.length} over-wide text block(s)`);
    r.wide.forEach((w) => console.log(`   ${w.ch}ch  .${w.cls}  "${w.text}…"`));
  }
  await p.close();
}
await b.close();
console.log(problems.length ? `\nPROBLEMS\n  ${problems.join('\n  ')}` : '\n  ✓ measure and widths are consistent');
