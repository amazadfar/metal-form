// Capture a page as sequential viewport-height slices so design review sees real pixel sizes.
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
const OUT = process.env.SHOT_DIR;
const BASE = process.env.SHOT_BASE || 'http://localhost:4321';
const [path, name, wArg, hArg] = process.argv.slice(2);
const width = Number(wArg || 1512), height = Number(hArg || 950);
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--force-color-profile=srgb'] });
const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, colorScheme: 'light' });
const page = await ctx.newPage();
await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(async () => {
  const step = Math.round(window.innerHeight * 0.7);
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
  window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 200));
  document.querySelectorAll('[data-reveal]').forEach(el => el.setAttribute('data-reveal', 'in'));
  await new Promise(r => setTimeout(r, 300));
});
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const n = Math.ceil(total / height);
console.log(`${path} -> ${total}px tall, ${n} slices at ${width}x${height}`);
for (let i = 0; i < n; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * height);
  await new Promise(r => setTimeout(r, 250));
  await page.screenshot({ path: join(OUT, `${name}-${String(i).padStart(2,'0')}.png`) });
}
await browser.close();
