#!/usr/bin/env node
/**
 * STEPPER STABILITY CHECK
 *
 * Scroll-linked steppers are easy to get subtly wrong: put the switching
 * threshold on a line and a reader who nudges the wheel near that line sees the
 * drawing strobe between two stages. It is the kind of defect that never shows
 * up in a screenshot.
 *
 * This drives a real browser down each page in small increments — smaller than
 * a wheel notch — and counts how many times each stepper changes state. A
 * healthy stepper changes once per stage. A flapping one changes far more, and
 * changes BACK, which is what this actually looks for: reversals.
 *
 *   node scripts/check-steppers.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.STEP_BASE || 'http://localhost:4321';
const ROUTES = process.argv.slice(2).length ? process.argv.slice(2) : [
  '/en/',
  '/en/industries/medical/',
  '/en/industries/automotive/',
  '/en/industries/marine/',
  '/en/industries/beverage/',
  '/fa/',
];

/** Smaller than one wheel notch, so it lands on thresholds rather than over them. */
const STEP_PX = 40;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });

let failures = 0;

for (const route of ROUTES) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);

  const result = await page.evaluate(async (stepPx) => {
    const steppers = Array.from(document.querySelectorAll('[data-stepper]'));
    if (!steppers.length) return { steppers: 0, log: [] };

    const history = steppers.map(() => []);
    const sample = () => steppers.forEach((s, i) => {
      const v = s.dataset.step;
      const h = history[i];
      if (!h.length || h[h.length - 1] !== v) h.push(v);
    });

    sample();
    const total = document.documentElement.scrollHeight;
    for (let y = 0; y < total; y += stepPx) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      sample();
    }
    window.scrollTo(0, 0);

    // A reversal is the signature of flapping: the value goes A → B → A.
    return {
      steppers: steppers.length,
      log: history.map((h, i) => {
        let reversals = 0;
        for (let k = 2; k < h.length; k++) if (h[k] === h[k - 2]) reversals++;
        return {
          id: steppers[i].id || steppers[i].className.split(/\s+/)[0] || `stepper-${i}`,
          stages: new Set(h).size,
          changes: h.length - 1,
          reversals,
          path: h.join('→'),
        };
      }),
    };
  }, STEP_PX);

  if (result.steppers) {
    console.log(`\n  ${route}`);
    for (const s of result.log) {
      const bad = s.reversals > 0;
      if (bad) failures++;
      console.log(
        `    ${bad ? '✗' : '✓'} ${s.id.padEnd(22)} ${s.stages} stages · ${s.changes} changes · ${s.reversals} reversals`,
      );
      if (bad) console.log(`        ${s.path}`);
    }
  }
  await page.close();
}

await browser.close();
console.log(failures ? `\n  ${failures} stepper(s) flap under slow scroll.\n` : '\n  ✓ No stepper reverses under slow scroll.\n');
process.exit(failures ? 1 : 0);
