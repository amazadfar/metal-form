#!/usr/bin/env node
/**
 * Seeds the English industry content files from the research briefs.
 *
 * The envelope only — meta, name, tile, hero, cta. The `blocks` object is where
 * each chapter's bespoke content goes and is authored per page, because no two
 * of the thirteen pages have the same sections.
 *
 * Bento lines are written here rather than lifted from research: a tile has to
 * sell in one sentence, and research summaries do not do that.
 *
 * Existing `blocks` content is preserved on re-run.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RESEARCH = join(ROOT, 'research');
const OUT = join(ROOT, 'src', 'content', 'en', 'industries');

/** name · tile · tileParts, authored rather than generated. */
const TILES = {
  medical: {
    name: 'Medical & Pharmaceutical',
    tile: 'High-cavitation tooling for components where cavity 1 and cavity 32 have to be the same part. We build the tool and the engineering behind it — validated manufacture stays with you.',
    tileParts: 'Multi-cavity · DFM · Second tools',
  },
  beverage: {
    name: 'Beverage & PET Packaging',
    tile: 'Preform and closure tooling, neck-standard conversion and gram-weight work. The lightest cavity in a tool sets the weight of every bottle you make — that is where the resin money goes.',
    tileParts: 'Preforms · Closures · Blow-mould parts',
  },
  automotive: {
    name: 'Automotive & Heavy Vehicles',
    tile: 'Filled polymers, slides and lifters, and dimension that repeats for a decade. Tooling for trucks, buses, agricultural and construction machines — including parts whose original tool is long gone.',
    tileParts: 'Functional parts · Slides · Re-tooling',
  },
  cosmetics: {
    name: 'Cosmetics & Personal Care',
    tile: 'Closures, jars, pumps and dispensers where the show surface is the product. Polish grade, parting-line placement and gate location decided before the steel is cut.',
    tileParts: 'Closures · Jars · Dispensers',
  },
  appliances: {
    name: 'Home Appliances',
    tile: 'Large mouldings that have to stay flat and fit an assembly. Cooling layout, wall section and cycle time on parts where material and machine time dominate the cost.',
    tileParts: 'Housings · Liners · Structural parts',
  },
  chemical: {
    name: 'Chemical & Detergent',
    tile: 'Closures, threads and sealing geometry at high volume. Tamper evidence, child-resistance and the millimetre of thread that separates contained from leaking.',
    tileParts: 'Caps · Closures · Containers',
  },
  electrical: {
    name: 'Electrical & Electronics',
    tile: 'Housings, connector bodies and thin-wall parts where flow length, weld lines and mating tolerances decide whether the assembly goes together.',
    tileParts: 'Housings · Connectors · Thin wall',
  },
  toys: {
    name: 'Toys & Consumer Goods',
    tile: 'Productisation: from an idea, a sample or a 3D print to a tooled part at a unit cost that works. Part consolidation, family tools and the cost of volume.',
    tileParts: 'Productisation · Family tools · Volume',
  },
  agriculture: {
    name: 'Agriculture & Irrigation',
    tile: 'Drippers, emitters and fittings by the hundred million. A labyrinth a few tenths of a millimetre wide, repeated across a very high cavity count, every shot, every season.',
    tileParts: 'Emitters · Fittings · High cavitation',
  },
  plumbing: {
    name: 'Plumbing & Construction',
    tile: 'Fitting families where one tooling logic has to serve forty part numbers. Threads, sealing geometry, unscrewing and collapsible cores, and dimensional consistency across the range.',
    tileParts: 'Fittings · Threads · Families',
  },
  furniture: {
    name: 'Furniture & Decor',
    tile: 'Castors, mechanisms, glides and fittings that carry load and get sat on. Rib design, glass-filled materials and part consolidation that takes assembly labour out.',
    tileParts: 'Castors · Mechanisms · Fittings',
  },
  marine: {
    name: 'Marine & Offshore',
    tile: 'Awkward geometry, larger parts and low-to-medium volumes where a full production tool is hard to justify — plus components whose drawings nobody kept.',
    tileParts: 'Fittings · Hatches · Reverse engineering',
  },
  custom: {
    name: 'Custom Projects',
    tile: 'Your project does not need to fit a category. A photograph, a broken part, a competitor product, a sketch or a problem you have not solved yet — all of them are a starting point.',
    tileParts: 'Anything · Any input · Any stage',
  },
};

const exists = (p) => access(p).then(() => true).catch(() => false);

await mkdir(OUT, { recursive: true });

for (const [key, tile] of Object.entries(TILES)) {
  const brief = JSON.parse(await readFile(join(RESEARCH, `${key}.json`), 'utf8'));
  const dest = join(OUT, `${key}.json`);

  let existing = {};
  if (await exists(dest)) existing = JSON.parse(await readFile(dest, 'utf8'));

  const headline = String(brief.page.heroHeadline || '')
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);

  const doc = {
    meta: {
      title: brief.page.metaTitle,
      description: brief.page.metaDescription,
    },
    name: tile.name,
    tile: tile.tile,
    tileParts: tile.tileParts,
    hero: {
      kicker: existing.hero?.kicker ?? tile.name,
      headline: existing.hero?.headline ?? (headline.length ? headline : [brief.page.heroHeadline]),
      lead: existing.hero?.lead ?? brief.page.heroSub,
      markers: existing.hero?.markers ?? undefined,
    },
    // Authored per page — the whole point is that no two are the same shape.
    blocks: existing.blocks ?? {},
    cta: {
      headline: existing.cta?.headline ?? brief.page.ctaHeadline,
      body: existing.cta?.body ?? brief.page.ctaSub,
      action: existing.cta?.action ?? 'Send your project',
      actionAlt: existing.cta?.actionAlt ?? 'See all contact options',
      prefill: existing.cta?.prefill ?? brief.page.whatsappPrefill,
      note: existing.cta?.note ?? 'Initial technical response within 48 business hours. NDA before detailed disclosure if you prefer.',
    },
  };

  if (!doc.hero.markers) delete doc.hero.markers;

  await writeFile(dest, JSON.stringify(doc, null, 2) + '\n', 'utf8');
  console.log(`· ${key.padEnd(12)} → ${doc.hero.headline.length} headline line(s)`);
}

console.log(`\n  ${Object.keys(TILES).length} English industry files seeded.`);
