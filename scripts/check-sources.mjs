#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const register = await readFile(join(ROOT, 'src', 'content', 'references.ts'), 'utf8');
const required = {
  'REF-EU-2019-904-A6': ['eur-lex.europa.eu', 'Beverage.astro'],
  'REF-ISO-9261': ['iso.org', 'Agriculture.astro'],
  'REF-ISO-8317': ['iso.org', 'Chemical.astro'],
  'REF-US-16CFR-1700': ['ecfr.gov', 'Chemical.astro'],
  'REF-CPSC-F963': ['cpsc.gov', 'Toys.astro'],
};
const errors = [];

for (const [id, [host, component]] of Object.entries(required)) {
  if (!register.includes(`'${id}'`)) errors.push(`${id}: missing from source register`);
  if (!register.includes(host)) errors.push(`${id}: expected official host ${host}`);
  const componentSource = await readFile(join(ROOT, 'src', 'components', 'industries', component), 'utf8');
  if (!componentSource.includes(id)) errors.push(`${id}: not rendered in ${component}`);
}

for (const locale of ['en', 'fa', 'ar', 'ur', 'ru', 'hy', 'tr', 'th', 'zh']) {
  const common = JSON.parse(await readFile(join(ROOT, 'src', 'content', locale, 'common.json'), 'utf8'));
  if (!common.references?.sourceLabel || !common.references?.referenceLabel) {
    errors.push(`${locale}/common.json: source/reference UI labels are missing`);
  }
}

if (errors.length) {
  console.error(`\n  SOURCE CHECK FAILED (${errors.length})`);
  errors.forEach((error) => console.error(`    ${error}`));
  process.exit(1);
}
console.log('\n  ✓ Approved references use official sources and localized UI labels.\n');
