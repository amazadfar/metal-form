#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [expectedOrigin, expectedMode] = process.argv.slice(2);
if (!expectedOrigin || !['index', 'noindex'].includes(expectedMode)) {
  console.error('Usage: node scripts/check-seo.mjs <expected-origin> <index|noindex>');
  process.exit(2);
}

const origin = expectedOrigin.replace(/\/+$/, '');
const html = await readFile(join(ROOT, 'dist', 'en', 'index.html'), 'utf8');
const robots = await readFile(join(ROOT, 'dist', 'robots.txt'), 'utf8');
const sitemap = await readFile(join(ROOT, 'dist', 'sitemap.xml'), 'utf8');
const errors = [];

if (!html.includes(`rel="canonical" href="${origin}/en/"`)) errors.push('canonical origin mismatch');
const alternateCount = (html.match(/rel="alternate" hreflang=/g) ?? []).length;
if (alternateCount !== 10) errors.push(`expected 10 hreflang alternates, found ${alternateCount}`);
if (!sitemap.includes(`${origin}/en/`)) errors.push('sitemap origin mismatch');

if (expectedMode === 'index') {
  if (!/name="robots" content="[^"]*\bindex\b[^\"]*\bfollow\b/.test(html)) {
    errors.push('production page is not indexable');
  }
  if (!robots.includes('Allow: /') || !robots.includes(`${origin}/sitemap.xml`)) errors.push('production robots.txt is not open');
} else {
  if (!html.includes('content="noindex, nofollow"')) errors.push('preview page is not noindex');
  if (!robots.includes('Disallow: /')) errors.push('preview robots.txt is not closed');
}

if (errors.length) {
  console.error(`\n  SEO CHECK FAILED (${errors.length})`);
  errors.forEach((error) => console.error(`    ${error}`));
  process.exit(1);
}
console.log(`\n  ✓ ${expectedMode} SEO behavior verified for ${origin}.\n`);
