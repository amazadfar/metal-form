#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const locales = ['en', 'fa', 'ar', 'ur', 'ru', 'hy', 'tr', 'th', 'zh'];
const errors = [];

for (const locale of locales) {
  const path = join(DIST, locale, 'contact', 'index.html');
  let html;
  try { html = await readFile(path, 'utf8'); }
  catch { errors.push(`${locale}: built Contact page is missing`); continue; }

  if (/\b(?:TBD|EMAIL_TBD|PHONE_TBD|WHATSAPP_NUMBER_TBD)\b/.test(html)) {
    errors.push(`${locale}: placeholder contact data leaked into the built page`);
  }
  if (/data-channel="contact-page"/.test(html)) {
    errors.push(`${locale}: Contact page contains a self-referencing CTA fallback`);
  }
  const hasDirect = /data-channel="(?:whatsapp|email|phone)"/.test(html);
  const common = JSON.parse(await readFile(join(ROOT, 'src', 'content', locale, 'common.json'), 'utf8'));
  if (!hasDirect && !html.includes(common.contact.pendingNote)) {
    errors.push(`${locale}: no live channel and no noninteractive pending notice`);
  }
}

if (errors.length) {
  console.error(`\n  CONTACT CHECK FAILED (${errors.length})`);
  errors.forEach((error) => console.error(`    ${error}`));
  process.exit(1);
}
console.log('\n  ✓ Contact pages expose no placeholders or self-referencing CTA fallbacks.\n');
