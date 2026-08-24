#!/usr/bin/env node
/**
 * Open Graph card.
 *
 * These links get pasted into WhatsApp and email threads with buyers, so the
 * preview is often the first thing a decision-maker sees. It uses the same mark,
 * the same type and the same drawing conventions as the site — a stepped
 * component in section with its parting line and cavity, not a logo on a
 * gradient.
 *
 * Rendered from SVG through sharp so it stays a build artefact rather than a
 * binary somebody has to remember to update.
 *
 *   node scripts/make-og.mjs
 */
import sharp from 'sharp';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');

const W = 1200;
const H = 630;

const INK = '#14161A';
const MUTED = '#5B6167';
const LINE = '#DCDDDA';
const ACCENT = '#1F4E66';
const SURFACE = '#FBFBFA';

/** The same stepped component the hero figure is built on. */
const PART =
  'M200 110 L400 110 L400 150 L365 150 L365 320 L340 320 L340 380 L325 392 L275 392 L260 380 L260 320 L235 320 L235 150 L200 150 Z';

const fontPath = join(ROOT, 'public', 'fonts', 'metal-grotesk');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${SURFACE}"/>

  <!-- Measured grid, the same 28px module as the site -->
  <defs>
    <pattern id="og-grid" width="28" height="28" patternUnits="userSpaceOnUse">
      <path d="M28 0 H0 V28" fill="none" stroke="${INK}" stroke-width="1" opacity="0.05"/>
    </pattern>
    <linearGradient id="og-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="${SURFACE}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#og-grid)"/>
  <rect width="${W}" height="${H}" fill="url(#og-fade)" opacity="0.7"/>

  <!-- Sheet corner ticks -->
  <g stroke="${LINE}" stroke-width="1.5" fill="none">
    <path d="M40 40 h34 M40 40 v34"/>
    <path d="M1160 40 h-34 M1160 40 v34"/>
    <path d="M40 590 h34 M40 590 v-34"/>
    <path d="M1160 590 h-34 M1160 590 v-34"/>
  </g>

  <!-- Mark -->
  <g transform="translate(72 64)">
    <rect x="1.6" y="1.6" width="30.8" height="30.8" fill="none" stroke="${INK}" stroke-width="1.9"/>
    <line x1="17" y1="1.6" x2="17" y2="32.4" stroke="${INK}" stroke-width="1.3" opacity="0.55"/>
    <circle cx="17" cy="17" r="7.4" fill="none" stroke="${INK}" stroke-width="1.9"/>
    <line x1="17" y1="1.6" x2="17" y2="9.6" stroke="${INK}" stroke-width="2.8"/>
  </g>
  <text x="122" y="88" font-family="Metal Grotesk, IBM Plex Sans, sans-serif" font-size="24"
        letter-spacing="2.8" fill="${INK}"><tspan font-weight="600">METAL</tspan><tspan font-weight="400" opacity="0.72" dx="10">FORM</tspan></text>

  <!-- Headline -->
  <text x="72" y="286" font-family="Metal Grotesk, IBM Plex Sans, sans-serif" font-size="62"
        font-weight="500" letter-spacing="-1.6" fill="${INK}">From an idea, a photograph,</text>
  <text x="72" y="358" font-family="Metal Grotesk, IBM Plex Sans, sans-serif" font-size="62"
        font-weight="500" letter-spacing="-1.6" fill="${INK}">a sample or a drawing —</text>
  <text x="72" y="430" font-family="Metal Grotesk, IBM Plex Sans, sans-serif" font-size="62"
        font-weight="500" letter-spacing="-1.6" fill="${ACCENT}">to mass production.</text>

  <!-- Fact rail -->
  <line x1="72" y1="500" x2="1128" y2="500" stroke="${LINE}" stroke-width="1"/>
  <text x="72" y="536" font-family="Metal Mono, IBM Plex Mono, monospace" font-size="17"
        letter-spacing="1.9" fill="${MUTED}">EST. 2006   ·   1,000+ PROJECTS   ·   TOOLING TO 46 CAVITIES   ·   CATIA · SOLIDWORKS</text>

  <!-- The component, in section, at the trailing edge -->
  <g transform="translate(852 108) scale(0.58)" opacity="0.9">
    <path d="${PART}" fill="none" stroke="${ACCENT}" stroke-width="2.6"/>
    <line x1="300" y1="86" x2="300" y2="418" stroke="${ACCENT}" stroke-width="1.4"
          stroke-dasharray="16 5 3 5" opacity="0.5"/>
    <line x1="285" y1="110" x2="285" y2="392" stroke="${ACCENT}" stroke-width="1.4" stroke-dasharray="7 5" opacity="0.45"/>
    <line x1="315" y1="110" x2="315" y2="392" stroke="${ACCENT}" stroke-width="1.4" stroke-dasharray="7 5" opacity="0.45"/>
    <line x1="200" y1="74" x2="400" y2="74" stroke="${ACCENT}" stroke-width="1.6"/>
    <line x1="200" y1="64" x2="200" y2="104" stroke="${ACCENT}" stroke-width="1.2" opacity="0.5"/>
    <line x1="400" y1="64" x2="400" y2="104" stroke="${ACCENT}" stroke-width="1.2" opacity="0.5"/>
  </g>
</svg>`;

await mkdir(OUT, { recursive: true });

// sharp resolves font families from the system, and the self-hosted faces are
// not installed there — so the card is rendered with the fontconfig path
// pointed at the project's own woff2 directory where possible, and falls back
// to a system grotesque otherwise. The composition does not depend on it.
process.env.FONTCONFIG_PATH = process.env.FONTCONFIG_PATH || fontPath;

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(join(OUT, 'og.png'));

const { size } = await import('node:fs').then((fs) => fs.promises.stat(join(OUT, 'og.png')));
console.log(`  public/og.png — ${W}×${H}, ${(size / 1024).toFixed(0)} KB`);
