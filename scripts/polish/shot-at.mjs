/**
 * Screenshot the docked controls where the reader actually meets them: a few
 * screens into the page, with the rail and the request dock both on screen.
 *
 *   node scripts/polish/shot-at.mjs /en/industries/medical/ 3
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const OUT = process.env.SHOT_DIR
  || '/tmp/claude-1000/-home-namiral-Projects-Playground-metal-form-2/95b4b450-57b3-4a2c-af4a-6cc33d5e6f4d/scratchpad/shots';
await mkdir(OUT, { recursive: true });
const [route, screensArg, name] = process.argv.slice(2);
const screens = Number(screensArg ?? 3);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, colorScheme: 'light', extraHTTPHeaders: { 'Cache-Control': 'no-cache' } });
const p = await c.newPage();
await p.goto('http://localhost:4322' + route, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(async (n) => {
  const step = Math.round(window.innerHeight * 0.7);
  for (let y = 0; y < window.innerHeight * (n + 1); y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  window.scrollTo(0, window.innerHeight * n);
  await new Promise(r => setTimeout(r, 900));
}, screens);
const file = `${OUT}/${name || route.replace(/\//g, '_')}-at${screens}.png`;
await p.screenshot({ path: file });
console.log(file);
await b.close();
