import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const routes = process.argv.slice(2);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
for (const r of routes) {
  const p = await ctx.newPage();
  await p.goto('http://localhost:4321' + r, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const res = await new AxeBuilder({ page: p }).withRules(['color-contrast','definition-list','dlitem']).analyze();
  console.log('\n==== ' + r);
  for (const v of res.violations) {
    for (const n of v.nodes.slice(0, 4)) {
      console.log('  ' + v.id + ' :: ' + n.target.join(' '));
      (n.any||[]).forEach(a => {
        const d = a.data || {};
        if (d.contrastRatio !== undefined) console.log(`     ratio ${d.contrastRatio}  fg ${d.fgColor} bg ${d.bgColor}  size ${d.fontSize} ${d.fontWeight}  needs ${d.expectedContrastRatio}`);
        else console.log('     ' + a.message);
      });
    }
    if (v.nodes.length > 4) console.log(`  … ${v.nodes.length - 4} more`);
  }
  await p.close();
}
await b.close();
