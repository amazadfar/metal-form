import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4322';
const routes = process.argv.slice(2);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
for (const r of routes) {
  const p = await c.newPage();
  await p.goto(BASE + r, { waitUntil: 'networkidle' });
  await p.evaluate(async () => {
    const s = Math.round(innerHeight * 0.7);
    for (let y = 0; y < document.body.scrollHeight; y += s) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
    scrollTo(0, 0);
  });
  const h = await p.evaluate(() => document.body.scrollHeight);
  console.log(`${r.padEnd(38)} ${String(h).padStart(6)} px  ${(h / 844).toFixed(1)} screens`);
  await p.close();
}
await b.close();
