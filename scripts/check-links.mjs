#!/usr/bin/env node
/**
 * LINK INTEGRITY
 *
 * Crawls the built site and proves that every internal href resolves to a page
 * that was actually generated. With 163 pages across nine languages and a
 * locale-swapping navigation that rewrites the current path, a broken link is
 * easy to introduce and impossible to spot by hand.
 *
 * Also flags fragment links whose target id does not exist on the same page,
 * and any anchor with no href at all.
 *
 *   npm run build && node scripts/check-links.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(full);
  }
  return out;
}

const all = await walk(DIST);
const pages = all.filter((f) => f.endsWith('.html'));
const assets = new Set(all.map((f) => '/' + relative(DIST, f).split('\\').join('/')));

/** '/en/about/' → the file that serves it. */
const routeExists = (href) => {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '' || clean === '/') return assets.has('/index.html');
  const path = clean.endsWith('/') ? `${clean}index.html` : clean;
  return assets.has(path) || assets.has(`${clean}/index.html`) || assets.has(clean);
};

const broken = [];
const badFragments = [];
let checked = 0;

for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const route = '/' + relative(DIST, file).replace(/index\.html$/, '').split('\\').join('/');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const m of html.matchAll(/<a\b[^>]*?href="([^"]*)"/g)) {
    const href = m[1];
    if (!href) { broken.push(`${route} → empty href`); continue; }
    if (/^(https?:|mailto:|tel:|wa\.me)/.test(href)) continue;
    checked++;

    if (href.startsWith('#')) {
      const id = href.slice(1);
      if (id && !ids.has(id)) badFragments.push(`${route} → ${href} (no such id on the page)`);
      continue;
    }
    if (!routeExists(href)) broken.push(`${route} → ${href}`);
  }
}

console.log(`\n  ${pages.length} pages, ${checked} internal links checked.`);

const show = (title, list) => {
  console.log(`\n  ${title}: ${list.length}`);
  [...new Set(list)].slice(0, 25).forEach((l) => console.log(`    ${l}`));
};
show('Broken internal links', broken);
show('Fragment links with no target', badFragments);

console.log('');
if (broken.length) { console.error(`  ✗ ${broken.length} broken link(s).\n`); process.exit(1); }
console.log('  ✓ Every internal link resolves.\n');
