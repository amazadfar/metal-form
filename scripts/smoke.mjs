#!/usr/bin/env node
/**
 * SMOKE TEST
 *
 * Loads every page of the built site in a real browser and checks the things a
 * static build cannot: that nothing throws, that no request fails, that the
 * document declares the right language and direction, that the primary call to
 * action resolves somewhere, that no page scrolls sideways at phone width, and
 * that no visible "undefined" leaked out of a partial translation.
 *
 *   npm run build && npx astro preview --port 4322 &
 *   node scripts/smoke.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.SMOKE_BASE || 'http://localhost:4322';
const LOCALES = ['en', 'ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'];
const RTL = new Set(['ur', 'ar', 'fa']);
const TAG = { en: 'en', ru: 'ru', hy: 'hy', tr: 'tr', th: 'th', zh: 'zh-Hans', ur: 'ur', ar: 'ar', fa: 'fa' };
const INDUSTRIES = [
  'medical', 'beverage', 'automotive', 'cosmetics', 'appliances', 'chemical',
  'electrical', 'consumer-products', 'agriculture', 'plumbing', 'furniture',
  'marine', 'custom-projects',
];

const routes = ['/'];
for (const l of LOCALES) {
  routes.push(`/${l}/`, `/${l}/industries/`, `/${l}/capabilities/`, `/${l}/about/`, `/${l}/contact/`);
  for (const i of INDUSTRIES) routes.push(`/${l}/industries/${i}/`);
}

const browser = await chromium.launch();
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });

const problems = [];
let checked = 0;

for (const route of routes) {
  const page = await desktop.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`JS: ${e.message.slice(0, 120)}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 120)}`); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(`${r.status()}: ${r.url().replace(BASE, '')}`); });

  try {
    const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    if (!res || res.status() >= 400) {
      problems.push(`${route} — HTTP ${res ? res.status() : 'no response'}`);
      await page.close();
      continue;
    }

    const locale = route === '/' ? 'en' : route.split('/')[1];
    const info = await page.evaluate(() => {
      const de = document.documentElement;
      const cta = document.querySelector('[data-analytics^="cta_whatsapp"]');
      const body = document.body.innerText;
      return {
        lang: de.lang,
        dir: de.dir,
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        ctaHref: cta ? cta.getAttribute('href') : null,
        ctaChannel: cta ? cta.getAttribute('data-channel') : null,
        contactPending: Boolean(document.querySelector('.ct-channel__pending')),
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') ?? null,
        alternates: document.querySelectorAll('link[rel=alternate][hreflang]').length,
        undefinedText: /(^|\s)undefined(\s|$|[.,])/.test(body),
        nanText: /\bNaN\b/.test(body),
        emptyBrackets: /\[object Object\]/.test(body),
      };
    });

    // Language and direction come from one place; if they are wrong here, the
    // whole locale is wrong.
    if (info.lang !== TAG[locale]) problems.push(`${route} — lang="${info.lang}", expected "${TAG[locale]}"`);
    const wantDir = RTL.has(locale) ? 'rtl' : 'ltr';
    if (info.dir !== wantDir) problems.push(`${route} — dir="${info.dir}", expected "${wantDir}"`);

    if (!info.title || info.title.length < 10) problems.push(`${route} — title missing or too short`);
    if (info.h1 !== 1) problems.push(`${route} — ${info.h1} <h1> elements, expected exactly 1`);
    if (!info.canonical) problems.push(`${route} — no canonical link`);
    if (route !== '/' && info.alternates !== 10) {
      problems.push(`${route} — ${info.alternates} hreflang alternates, expected 10`);
    }
    const isContact = route.endsWith('/contact/');
    if (route !== '/' && !isContact && !info.ctaHref) problems.push(`${route} — no primary call to action`);
    if (isContact && !info.ctaHref && !info.contactPending) problems.push(`${route} — no direct channel or pending notice`);
    if (isContact && info.ctaChannel === 'contact-page') problems.push(`${route} — self-referencing contact CTA`);

    // Signs of a content key that did not resolve.
    if (info.undefinedText) problems.push(`${route} — the word "undefined" is visible on the page`);
    if (info.nanText) problems.push(`${route} — "NaN" is visible on the page`);
    if (info.emptyBrackets) problems.push(`${route} — "[object Object]" is visible on the page`);

    errors.forEach((e) => problems.push(`${route} — ${e}`));
    checked++;
  } catch (err) {
    problems.push(`${route} — ${String(err).slice(0, 120)}`);
  }
  await page.close();
}

// Horizontal overflow is a phone-width problem, checked on one page per locale
// plus every chapter in English.
const narrow = [
  ...LOCALES.map((l) => `/${l}/`),
  ...INDUSTRIES.map((i) => `/en/industries/${i}/`),
];
for (const route of narrow) {
  const page = await phone.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
    const scrolls = await page.evaluate(() => {
      window.scrollTo(900, 0);
      const x = window.scrollX;
      window.scrollTo(0, 0);
      return x > 0;
    });
    if (scrolls) problems.push(`${route} — scrolls sideways at 390px`);
  } catch { /* covered by the desktop pass */ }
  await page.close();
}

await browser.close();

console.log(`\n  ${checked}/${routes.length} pages loaded · ${narrow.length} checked at phone width.`);
if (problems.length) {
  console.log(`\n  PROBLEMS (${problems.length})`);
  [...new Set(problems)].slice(0, 40).forEach((p) => console.log(`    ${p}`));
  console.log('');
  process.exit(1);
}
console.log('\n  ✓ Every page loads clean in all nine languages.\n');
