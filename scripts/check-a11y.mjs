#!/usr/bin/env node
/**
 * ACCESSIBILITY CHECK
 *
 * Runs axe against a representative slice of the site: the language selector,
 * a left-to-right page, a right-to-left page, both flagship chapters and the
 * two most interactive pages. Right-to-left is checked explicitly because
 * direction bugs surface as reading-order and label problems, not as visual
 * ones.
 *
 *   npm run build && npx astro preview --port 4322 &
 *   node scripts/check-a11y.mjs
 */
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.A11Y_BASE || 'http://localhost:4322';

const ROUTES = [
  ['/', 'language selector'],
  ['/en/', 'home · ltr'],
  ['/fa/', 'home · rtl'],
  ['/en/industries/beverage/', 'beverage chapter'],
  ['/en/industries/medical/', 'medical chapter'],
  ['/ar/industries/custom-projects/', 'custom projects · rtl'],
  ['/en/contact/', 'contact'],
  ['/en/capabilities/', 'capabilities'],
  // Urdu is set in Nastaliq, which has unusual metrics; Chinese has the widest
  // glyphs and the shortest lines. Both stress the layout differently from the
  // Latin locales and are worth checking on their own.
  ['/ur/', 'home · urdu nastaliq'],
  ['/zh/industries/medical/', 'medical · chinese'],
  ['/hy/', 'home · armenian'],
];

const browser = await chromium.launch();
// axe requires a real context rather than the default page-level one.
// Reduced motion rather than an injected stylesheet: the site's own
// prefers-reduced-motion rules already collapse transitions to 1ms and force
// every reveal target visible, so axe measures resolved colours instead of
// mid-fade ones. Injecting a <style> tag would be blocked by the site's CSP —
// correctly, which is the point of having one.
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: 'reduce',
});
let failures = 0;

for (const [route, label] of ROUTES) {
  const page = await context.newPage();
  await page.goto(BASE + route, { waitUntil: 'networkidle' });
  // Belt and braces: force any remaining reveal target open before auditing.
  await page.evaluate(() => {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.setAttribute('data-reveal', 'in'));
  });
  await page.waitForTimeout(150);

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();

  const serious = results.violations.filter((v) => ['critical', 'serious'].includes(v.impact));
  const minor = results.violations.filter((v) => !['critical', 'serious'].includes(v.impact));

  console.log(
    `\n  ${label.padEnd(24)} ${route}\n    ${serious.length} serious/critical · ${minor.length} moderate/minor`,
  );
  for (const v of [...serious, ...minor]) {
    console.log(`    [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length})`);
    v.nodes.slice(0, 2).forEach((n) => console.log(`        ${n.target.join(' ')}`.slice(0, 150)));
  }
  failures += serious.length;
  await page.close();
}

await browser.close();
console.log(failures ? `\n  ✗ ${failures} serious violation(s).\n` : '\n  ✓ No serious accessibility violations.\n');
process.exit(failures ? 1 : 0);
