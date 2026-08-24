#!/usr/bin/env node
/**
 * CONTENT INTEGRITY CHECK
 *
 * Three things this catches that nothing else will:
 *
 *  1. Structural drift — a translated file whose shape no longer matches the
 *     English master. Because every industry chapter reads its own keys out of
 *     `blocks`, a renamed or dropped key renders "undefined" on a live page in
 *     one language only, which is exactly the kind of bug nobody sees.
 *
 *  2. Claims that must never be published — the register in
 *     src/config/claims.ts, plus the marketing filler this project bans.
 *     Checked in every language, because a translator can reintroduce a claim
 *     the English copy was careful to avoid.
 *
 *  3. Untranslated leaves — a value in a non-English file that is byte-identical
 *     to the English one. Some are legitimate (part numbers, standards, brand
 *     names); most are a translation that never happened.
 *
 *   node scripts/check-content.mjs [--verbose]
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'src', 'content');
const LOCALES = ['en', 'ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'];
const MASTER = 'en';
const verbose = process.argv.includes('--verbose');

/* ── Phrases that must not appear in any language ─────────────────────────── */

const FORBIDDEN = [
  // Claim register: prohibited capability claims.
  { re: /\bISO\s?13485\b/i, why: 'prohibited claim: ISO 13485' },
  { re: /\bISO\s?9001\b/i, why: 'prohibited claim: ISO 9001' },
  { re: /\bIATF\b/i, why: 'prohibited claim: IATF' },
  { re: /\bGMP\b/, why: 'prohibited claim: GMP' },
  { re: /\bFDA[-\s](approved|registered|cleared)\b/i, why: 'prohibited claim: FDA status' },
  { re: /\bMoldflow\b/i, why: 'prohibited claim: named simulation software' },
  { re: /\bUL\s?94\b/i, why: 'prohibited claim: UL 94 testing' },
  { re: /\btwo[-\s]shot\b/i, why: 'prohibited capability: two-shot moulding' },
  { re: /\bstarting (from|at)\s*[$€£]/i, why: 'prohibited: published pricing' },
  // Brand integrity.
  { re: /\bMetal\s*Foam\b/i, why: 'wrong company name — it is Metal Form', always: true },
  // Marketing filler this project bans outright.
  { re: /\bworld[-\s]class\b/i, why: 'banned filler', always: true },
  { re: /\bcutting[-\s]edge\b/i, why: 'banned filler', always: true },
  { re: /\bstate[-\s]of[-\s]the[-\s]art\b/i, why: 'banned filler', always: true },
  { re: /\bone[-\s]stop[-\s]shop\b/i, why: 'banned filler', always: true },
  { re: /\bwe pride ourselves\b/i, why: 'banned filler', always: true },
  { re: /\bseamlessly\b/i, why: 'banned filler', always: true },
  // Placeholders that must never reach a visitor.
  { re: /\bTBD\b/, why: 'placeholder leaked into content', always: true },
  { re: /\bLorem ipsum\b/i, why: 'placeholder leaked into content', always: true },
  { re: /\bTODO\b/, why: 'placeholder leaked into content', always: true },
  { re: /undefined/, why: 'literal "undefined" in content', always: true },
];

/**
 * Claims that ARE allowed but only in an approved framing. Flagged for review
 * rather than failed, because the surrounding sentence decides.
 */
const REVIEW = [
  { re: /\bcleanroom|clean room\b/i, why: 'cleanroom mentioned — must be a disclaimer, never a capability' },
  { re: /\bsteril(e|ised|ized|isation|ization)\b/i, why: 'sterile mentioned — must be a disclaimer' },
  { re: /\b(guarantee|guaranteed)\b/i, why: 'a guarantee was made — check it is one we can keep' },
  { re: /\b\d{1,2}\s?%\s*(saving|cheaper|reduction|less)\b/i, why: 'a percentage saving was claimed' },
];

/**
 * Key paths where a prohibited term is EXPECTED, because the section exists to
 * say we do not do it. "We hold no ISO 13485" and "we are ISO 13485 certified"
 * contain the same substring and are opposite statements; the key path is what
 * separates them, and key paths are never translated.
 *
 * Terms found here are reported for review rather than failed — a human still
 * has to read the sentence.
 */
const DISCLAIMER_CONTEXTS = [
  /\bboundar(y|ies)\b/i,        // blocks.boundary.*, boundaries.points
  /\bline\.stays\b/i,          // medical: "stays with the manufacturer"
  /\.not\b/,                    // blocks.boundary.not[n]
  /\bdontList\b/i,
  /\brefuse\b/i,
  /\bexclusions?\b/i,
  /\bdisclosure\b/i,
  /\bmediaNote\b/i,
  /\bwhatWeDoNot/i,
  /\bscopeLimit/i,
];

const isDisclaimerContext = (key) => DISCLAIMER_CONTEXTS.some((re) => re.test(key));

/**
 * Key paths whose values are identifiers, not prose. `id` fields wire tab
 * controls to their panels — a translated id breaks the component.
 */
const NEVER_TRANSLATED_KEYS = [/\.id$/, /\.key$/, /\.slug$/, /\.index$/, /\bcls$/];

/** Values that are legitimately identical across languages. */
const IDENTICAL_OK = [
  /^[\s\d.,:;/×x±°%+\-–—()[\]]*$/,           // pure numerals and punctuation
  /^(CATIA|SolidWorks|STEP|IGES|X_T|STL|PET|HDPE|PP|PA\d*|PBT|PC|ABS|POM|PVC|PEX|PP-R|PE)$/i,
  /^(PCO ?18\d\d|29\/25|30\/25|26\/22|38 ?mm|GME ?30\.37)/i,
  /^Metal Form/,
  /^(WhatsApp|Telegram|CATIA · SolidWorks)$/i,
  /^Class ?10\d$/i,
  // Designations, grades, standards and measured quantities. These are read the
  // same way by an engineer in every one of the nine languages, which is the
  // whole reason the Latin face leads every font stack.
  /^\d[\d\s.,–—\-]*(mm|cm|m|g|kg|s|h|t|°C|°F|Rc|HRC|BHN|ppm|dL\/g|µm|bar|MPa|%)?$/i,
  /^(SPI|VDI|ISO|EN|BIFMA|ASTM|IEC|DIN|GME|PCO|UL|CTI)[\s-]?[\w.\/]*$/i,
  /^(PA|PBT|PC|ABS|POM|PVC|PEX|PP|PE|HDPE|LDPE|LCP|TPE|TPU|COC|COP|SAN|PMMA|EVOH|PET)[\d\s\-+/]*(GF\d+)?$/i,
  /^[A-Z]{1,4}[- ]?\d{1,4}([- ]?\d{1,4})?$/,      // FD-01, X5.1, 1.2344
  /^L\s*[:/]\s*[Tt]$/,
  /^Ø/,
];

/* ── Walk ─────────────────────────────────────────────────────────────────── */

/** Every leaf path in an object, as 'a.b[0].c'. */
function leaves(obj, prefix = '', out = new Map()) {
  if (obj === null || obj === undefined) return out;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => leaves(v, `${prefix}[${i}]`, out));
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      leaves(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.set(prefix, obj);
  }
  return out;
}

async function listJson(dir, base = dir) {
  const out = [];
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listJson(full, base)));
    else if (e.name.endsWith('.json')) out.push(relative(base, full).replace(/\.json$/, ''));
  }
  return out;
}

const load = async (locale, path) => {
  try { return JSON.parse(await readFile(join(CONTENT, locale, `${path}.json`), 'utf8')); }
  catch { return null; }
};

/* ── Run ──────────────────────────────────────────────────────────────────── */

const errors = [];
const warnings = [];
const notes = [];

const masterPaths = (await listJson(join(CONTENT, MASTER))).sort();
console.log(`\n  ${masterPaths.length} content files in the English master.\n`);

const coverage = {};

for (const locale of LOCALES) {
  const present = [];
  const missing = [];
  let sameCount = 0;
  let leafCount = 0;

  for (const path of masterPaths) {
    const master = await load(MASTER, path);
    const doc = await load(locale, path);

    if (!doc) { missing.push(path); continue; }
    present.push(path);

    const mLeaves = leaves(master);
    const dLeaves = leaves(doc);

    // 1 — structural drift
    for (const key of mLeaves.keys()) {
      if (!dLeaves.has(key)) {
        errors.push(`[${locale}] ${path}: missing key "${key}"`);
      }
    }
    for (const key of dLeaves.keys()) {
      if (!mLeaves.has(key)) {
        warnings.push(`[${locale}] ${path}: extra key "${key}" not in the English master`);
      }
    }

    for (const [key, value] of dLeaves) {
      if (typeof value !== 'string') continue;
      leafCount++;

      // 2 — forbidden content
      const disclaimer = isDisclaimerContext(key);
      for (const rule of FORBIDDEN) {
        if (!rule.re.test(value)) continue;
        if (disclaimer && !rule.always) {
          notes.push(`[${locale}] ${path} → ${key}: ${rule.why} — in a disclaimer context, verify the sentence is a denial`);
        } else {
          errors.push(`[${locale}] ${path} → ${key}: ${rule.why}\n        “${value.slice(0, 120)}”`);
        }
      }
      for (const rule of REVIEW) {
        if (rule.re.test(value)) {
          notes.push(`[${locale}] ${path} → ${key}: ${rule.why}`);
        }
      }

      // 3 — untranslated leaves
      if (locale !== MASTER) {
        const m = mLeaves.get(key);
        if (typeof m === 'string' && m === value && m.trim().length > 2) {
          const isIdentifier = NEVER_TRANSLATED_KEYS.some((re) => re.test(key));
          if (!isIdentifier && !IDENTICAL_OK.some((re) => re.test(m.trim()))) {
            sameCount++;
            if (verbose) warnings.push(`[${locale}] ${path} → ${key}: identical to English`);
          }
        }
      }
    }
  }

  coverage[locale] = { present: present.length, missing, sameCount, leafCount };
}

/* ── Report ───────────────────────────────────────────────────────────────── */

console.log('  LOCALE  FILES              LEAVES   UNTRANSLATED');
for (const locale of LOCALES) {
  const c = coverage[locale];
  const files = `${c.present}/${masterPaths.length}`;
  const bar = c.present === masterPaths.length ? '·' : '!';
  console.log(
    `  ${bar} ${locale.padEnd(4)} ${files.padEnd(18)} ${String(c.leafCount).padEnd(8)} ${
      locale === MASTER ? '—' : c.sameCount
    }`,
  );
  if (c.missing.length && c.missing.length <= 6) {
    c.missing.forEach((m) => console.log(`         missing: ${m}`));
  } else if (c.missing.length) {
    console.log(`         missing ${c.missing.length} files`);
  }
}

const show = (title, list, cap = 30) => {
  if (!list.length) return;
  console.log(`\n  ${title} (${list.length})`);
  list.slice(0, cap).forEach((l) => console.log(`    ${l}`));
  if (list.length > cap) console.log(`    … and ${list.length - cap} more`);
};

show('ERRORS', errors);
show('WARNINGS', warnings);
show('FOR REVIEW', notes, 20);

console.log('');
if (errors.length) {
  console.error(`  ✗ ${errors.length} error(s).\n`);
  process.exit(1);
}
console.log('  ✓ Content integrity check passed.\n');
