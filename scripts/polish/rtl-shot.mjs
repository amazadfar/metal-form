/** Screenshot the element containing a given substring, on an RTL page. */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const OUT = process.env.SHOT_DIR || '/tmp/claude-1000/-home-namiral-Projects-Playground-metal-form-2/95b4b450-57b3-4a2c-af4a-6cc33d5e6f4d/scratchpad/shots';
await mkdir(OUT, { recursive: true });
const [route, needle, name] = process.argv.slice(2);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 2 })).newPage();
await p.goto('http://localhost:4322' + route, { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(async () => { const s = Math.round(innerHeight*0.8); for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,25));} scrollTo(0,0); });
const found = await p.evaluate((needle) => {
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n; while ((n = walk.nextNode())) {
    if ((n.textContent || '').includes(needle) && n.parentElement?.offsetParent) {
      n.parentElement.setAttribute('data-shotme', '1');
      n.parentElement.scrollIntoView({ block: 'center' });
      return true;
    }
  } return false;
}, needle);
if (!found) { console.log('not found:', needle); await b.close(); process.exit(1); }
await p.waitForTimeout(400);
// Some of these live inside a collapsed disclosure or a tab that is not the
// active one. Open everything first, then clip a band around the element.
await p.evaluate(async () => {
  document.querySelectorAll('.disc__btn').forEach((b) => { if (b.getAttribute('aria-expanded') !== 'true') b.click(); });
  document.querySelectorAll('details').forEach((d) => { d.open = true; });
  await new Promise((r) => setTimeout(r, 400));
  document.querySelector('[data-shotme]')?.scrollIntoView({ block: 'center' });
  await new Promise((r) => setTimeout(r, 400));
});
const clip = await p.evaluate(() => {
  const el = document.querySelector('[data-shotme]');
  const b = el.getBoundingClientRect();
  const pad = 26;
  const y = Math.max(0, Math.min(window.innerHeight - 80, b.top - pad));
  return {
    x: 0,
    y,
    width: window.innerWidth,
    height: Math.max(80, Math.min(window.innerHeight - y, b.height + pad * 2)),
  };
});
const file = `${OUT}/${name}.png`;
await p.screenshot({ path: file, clip });
console.log(file);
await b.close();
