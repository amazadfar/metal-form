#!/usr/bin/env node
/**
 * ─────────────────────────────────────────────────────────────────────────────
 * FONT PIPELINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Fonts are self-hosted, not linked. fonts.googleapis.com is unreachable from
 * both Iran and mainland China — two of this site's actual audiences — so a CDN
 * link would render the site typeless for the people it is aimed at.
 *
 * The families are chosen as one system rather than assembled ad hoc:
 *   IBM Plex Sans        Latin · Cyrillic · Greek      body + display
 *   IBM Plex Sans Thai   Thai                          drawn against the same skeleton
 *   IBM Plex Sans Arabic Arabic                        ditto
 *   IBM Plex Mono        Latin                         technical labels, part numbers, units
 *   Vazirmatn            Persian                       the standard for quality Persian setting;
 *                                                      an Arabic-first face reads foreign in Persian
 *   Noto Nastaliq Urdu   Urdu                          Nastaliq is what Urdu readers expect;
 *                                                      Naskh reads as "an Arabic font" to them
 *   Noto Sans Armenian   Armenian
 *   Noto Sans SC         Simplified Chinese
 *
 * Google's CSS is requested with a modern UA so it returns woff2 with
 * unicode-range subsetting intact — a Latin page never downloads Cyrillic.
 *
 *   node scripts/fetch-fonts.mjs
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'fonts');
// One stylesheet per family, served from /fonts/ and linked by the layout for
// the current locale only. A single combined file would make every page pay for
// the ~200 @font-face rules that Noto Sans SC needs, in every language.
const CSS_DIR = join(OUT_DIR, 'css');

const UA_MODERN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** family → { google, weights, keepSubsets, note } */
const FAMILIES = {
  'Metal Grotesk': {
    google: 'IBM+Plex+Sans',
    weights: [400, 500, 600, 700],
    // Vietnamese and Greek-ext are dead weight for this audience.
    keepSubsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    note: 'Latin + Cyrillic body and display',
  },
  'Metal Mono': {
    google: 'IBM+Plex+Mono',
    weights: [400, 500],
    keepSubsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
    note: 'Technical labels, indices, units',
  },
  'Metal Thai': {
    google: 'IBM+Plex+Sans+Thai',
    weights: [400, 500, 600],
    keepSubsets: ['thai', 'latin', 'latin-ext'],
    note: 'Thai',
  },
  'Metal Arabic': {
    google: 'IBM+Plex+Sans+Arabic',
    weights: [400, 500, 600],
    keepSubsets: ['arabic', 'latin', 'latin-ext'],
    note: 'Arabic',
  },
  'Metal Persian': {
    google: 'Vazirmatn',
    weights: [400, 500, 600, 700],
    keepSubsets: ['arabic', 'latin', 'latin-ext'],
    note: 'Persian',
  },
  'Metal Urdu': {
    google: 'Noto+Nastaliq+Urdu',
    weights: [400, 500, 600, 700],
    keepSubsets: ['arabic', 'latin', 'latin-ext'],
    note: 'Urdu — Nastaliq',
  },
  'Metal Armenian': {
    google: 'Noto+Sans+Armenian',
    weights: [400, 500, 600, 700],
    keepSubsets: ['armenian', 'latin', 'latin-ext'],
    note: 'Armenian',
  },
  'Metal Han': {
    google: 'Noto+Sans+SC',
    weights: [400, 600],
    // Google splits CJK into ~100 numbered ranges; keeping them all is correct —
    // a page pulls only the four or five that its characters fall into.
    keepSubsets: null,
    note: 'Simplified Chinese',
  },
};

const exists = (p) => access(p).then(() => true).catch(() => false);

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA_MODERN } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.text();
}

async function fetchBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA_MODERN } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Splits a Google Fonts CSS payload into its @font-face blocks.
 *
 * Most families are served with a `/* subset-name *\/` comment above each block.
 * The CJK families are not: Google splits Noto Sans SC into ~100 numbered ranges
 * with no labels at all, so the subset name is recovered from the file's numeric
 * suffix (`…k3kCo84.4.woff2` → `4`). Without this the Chinese faces are silently
 * dropped and the site renders Simplified Chinese in a fallback system font.
 */
function parseFaces(css) {
  const faces = [];
  const blockRe = /(?:\/\*\s*([\w\-[\]]+)\s*\*\/\s*)?@font-face\s*\{([^}]+)\}/g;
  let m;
  while ((m = blockRe.exec(css)) !== null) {
    const [, labelled, body] = m;
    const get = (prop) => {
      const mm = body.match(new RegExp(`${prop}\\s*:\\s*([^;]+);`));
      return mm ? mm[1].trim() : null;
    };
    const srcRaw = get('src');
    const urlMatch = srcRaw && srcRaw.match(/url\(([^)]+)\)/);
    if (!urlMatch) continue;
    const url = urlMatch[1].replace(/['"]/g, '');
    const numbered = url.match(/\.(\d+)\.woff2$/);
    faces.push({
      subset: labelled || (numbered ? `r${numbered[1]}` : 'default'),
      labelled: Boolean(labelled),
      style: get('font-style') || 'normal',
      weight: get('font-weight') || '400',
      unicodeRange: get('unicode-range'),
      url,
    });
  }
  return faces;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  await mkdir(CSS_DIR, { recursive: true });

  const header = (family, note) => [
    '/* ═══════════════════════════════════════════════════════════════════════',
    `   ${family} — ${note}`,
    '   GENERATED — do not edit. Run `npm run fonts` to regenerate.',
    '   Self-hosted so the site renders in Iran and mainland China, where',
    '   fonts.googleapis.com is unreachable.',
    '   ═══════════════════════════════════════════════════════════════════════ */',
    '',
  ];

  let downloaded = 0;
  let reused = 0;
  const manifest = {};

  for (const [family, def] of Object.entries(FAMILIES)) {
    const url =
      `https://fonts.googleapis.com/css2?family=${def.google}:wght@${def.weights.join(';')}&display=swap`;
    process.stdout.write(`· ${family.padEnd(16)} (${def.google}) `);

    let css;
    try {
      css = await fetchText(url);
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      continue;
    }

    let faces = parseFaces(css);
    if (def.keepSubsets) {
      faces = faces.filter((f) => def.keepSubsets.includes(f.subset));
    }

    const famSlug = slug(family);
    const famDir = join(OUT_DIR, famSlug);
    await mkdir(famDir, { recursive: true });

    const cssChunks = header(family, def.note);
    const files = [];
    for (const face of faces) {
      const name = `${famSlug}-${face.weight}-${slug(face.subset)}.woff2`;
      const dest = join(famDir, name);
      if (await exists(dest)) {
        reused++;
      } else {
        const buf = await fetchBinary(face.url);
        await writeFile(dest, buf);
        downloaded++;
      }
      const href = `/fonts/${famSlug}/${name}`;
      files.push({ href, weight: Number(face.weight), subset: face.subset });

      cssChunks.push(
        '@font-face {',
        `  font-family: '${family}';`,
        `  font-style: ${face.style};`,
        `  font-weight: ${face.weight};`,
        `  font-display: swap;`,
        `  src: url('${href}') format('woff2');`,
        ...(face.unicodeRange ? [`  unicode-range: ${face.unicodeRange};`] : []),
        '}',
      );
    }
    const cssPath = join(CSS_DIR, `${famSlug}.css`);
    await writeFile(cssPath, cssChunks.join('\n') + '\n', 'utf8');
    const cssBytes = cssChunks.join('\n').length;

    manifest[family] = { slug: famSlug, note: def.note, css: `/fonts/css/${famSlug}.css`, files };
    console.log(`${String(faces.length).padStart(3)} faces · ${(cssBytes / 1024).toFixed(1)} KB css`);
  }

  await writeFile(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`\n  ${downloaded} downloaded, ${reused} already present`);
  console.log('  CSS   → public/fonts/css/<family>.css  (linked per locale)');
  console.log('  Files → public/fonts/');
}

run().catch((err) => { console.error(err); process.exit(1); });
