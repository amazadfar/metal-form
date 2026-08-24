#!/usr/bin/env node
/**
 * Design QA screenshots.
 *
 * Uses a clean headless Chromium rather than the desktop browser, which on this
 * machine has forced dark mode enabled and inverts every page it renders.
 *
 *   node scripts/shots.mjs <path> [--w 1512] [--h 950] [--full] [--out name]
 *   node scripts/shots.mjs /en/ --full
 *   node scripts/shots.mjs /fa/industries/beverage/ --w 420 --h 900 --full
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = process.env.SHOT_DIR
  || '/tmp/claude-1000/-home-namiral-Projects-Playground-metal-form-2/95b4b450-57b3-4a2c-af4a-6cc33d5e6f4d/scratchpad/shots';
const BASE = process.env.SHOT_BASE || 'http://localhost:4321';

const args = process.argv.slice(2);
// Only route arguments, so flag values (`--w 1512`) are not mistaken for paths.
const paths = args.filter((a) => a.startsWith('/'));
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const width = Number(flag('w', 1512));
const height = Number(flag('h', 950));
const full = has('full');
const nameOverride = flag('out', null);
const scrollWait = Number(flag('wait', 900));

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--disable-lcd-text'] });
const ctx = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});

const errors = [];
for (const path of paths.length ? paths : ['/']) {
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${path} :: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${path} :: ${e.message}`));

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);

  const at = flag('at', null);
  if (full || at) {
    // Walk the page so IntersectionObserver reveals and steppers all fire.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight * 0.7);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 110));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));

      // Deterministic capture: anything the observer has not resolved by now is
      // forced to its revealed state. A screenshot should show the page as a
      // reader who has scrolled to it sees it, not a race with the observer.
      document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-reveal', 'in'));
      await new Promise((r) => setTimeout(r, 250));
    });
  }
  // `--at <selector>` frames one section at full size, which is how design
  // review actually has to happen: a whole-page capture of an 11,000px document
  // scales hairlines and small type out of existence.
  if (at) {
    await page.evaluate(async (sel) => {
      const el = document.querySelector(sel);
      if (el) {
        el.scrollIntoView({ block: 'start', behavior: 'instant' });
        window.scrollBy(0, -80);
      }
      await new Promise((r) => setTimeout(r, 400));
    }, at);
  }

  await page.waitForTimeout(scrollWait);

  const slug = nameOverride
    || (path.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'root') + `_${width}${full ? '_full' : ''}`;
  const file = join(OUT, `${slug}.png`);
  await page.screenshot({ path: file, fullPage: full && !at });
  console.log(file);
  await page.close();
}

await browser.close();
if (errors.length) {
  console.error('\nCONSOLE ERRORS:');
  errors.forEach((e) => console.error('  ! ' + e));
}
