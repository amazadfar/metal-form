import { chromium } from 'playwright';
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await c.newPage();
await p.goto('http://localhost:4322/en/industries/chemical/', { waitUntil: 'networkidle' });
const r = await p.evaluate(() => {
  const discs = [...document.querySelectorAll('.disc')].map(d => ({ open: d.dataset.open, h: d.getBoundingClientRect().height }));
  const tn = [...document.querySelectorAll('details.tnote')].map(d => ({ open: d.open }));
  const secs = [...document.querySelectorAll('main section')].map(s => ({ id: s.id, h: Math.round(s.getBoundingClientRect().height) }));
  return { discs, tnOpen: tn.filter(x => x.open).length, tnTotal: tn.length, secs };
});
console.log('disc panels:', JSON.stringify(r.discs));
console.log('tech notes open:', r.tnOpen, '/', r.tnTotal);
console.log('sections:'); r.secs.forEach(s => console.log(`   ${(s.id||'—').padEnd(16)} ${s.h}`));
await b.close();
