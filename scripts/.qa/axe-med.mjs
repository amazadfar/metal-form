import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const b = await chromium.launch();
for (const r of ['/en/industries/medical/','/ar/industries/medical/']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  await p.goto('http://localhost:4321' + r, { waitUntil: 'networkidle' });
  const res = await new AxeBuilder({ page: p }).analyze();
  console.log(r, 'violations:', res.violations.length);
  for (const v of res.violations) console.log('  ', v.id, v.impact, v.nodes.length, v.nodes[0]?.target?.join(' '), '|', (v.nodes[0]?.failureSummary||'').split('\n').slice(0,3).join(' / '));
  await p.close();
}
await b.close();
