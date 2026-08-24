/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INDUSTRY TAXONOMY + PER-VERTICAL ART DIRECTION
 * ─────────────────────────────────────────────────────────────────────────────
 * The thirteen approved categories. Slugs are stable and shareable: a salesperson
 * sends /hy/industries/beverage/ to a bottler and /en/industries/medical/ to a
 * pharmaceutical buyer.
 *
 * Each vertical carries its own palette and motion signature so the pages read as
 * thirteen chapters of one book rather than thirteen clones. The `brand` tokens
 * (type system, spacing, interaction quality) never change — only the atmosphere.
 *
 * Renaming a category later is a one-line change here plus its content keys.
 */

export type IndustryKey =
  | 'medical' | 'beverage' | 'automotive' | 'cosmetics' | 'appliances'
  | 'chemical' | 'electrical' | 'toys' | 'agriculture' | 'plumbing'
  | 'furniture' | 'marine' | 'custom';

export interface IndustryPalette {
  /** Page background. */
  surface: string;
  /** Recessed / alternating band. */
  surfaceSunk: string;
  /** Raised panel. */
  surfaceRaise: string;
  /** Primary text. */
  ink: string;
  /** Secondary text. */
  inkMuted: string;
  /** Hairlines, rules, technical grid. */
  line: string;
  /** The vertical's signature colour. Used sparingly and structurally. */
  accent: string;
  /** Deeper variant for text-on-light and hover states. */
  accentDeep: string;
  /** Light wash of the accent for fills. */
  accentWash: string;
  /** Rare second colour. Annotation, highlight, alarm. */
  signal: string;
  /** Colour behind the hero when it inverts. */
  inverse: string;
  inverseInk: string;
}

/**
 * ── Per-vertical art direction ──────────────────────────────────────────────
 * The thirteen chapters have to read as thirteen chapters of one book. A
 * different accent colour does not achieve that — it produces one page
 * thirteen times in thirteen tints, which is exactly what the first version
 * of this site did.
 *
 * So the difference is carried by four things that are chosen here and
 * implemented once, in `chapters.css`, rather than reinvented per page:
 *
 *   ground   what the chapter opens on — steel, the vertical's own light
 *            surface, or a saturated tint of its accent
 *   hero     the composition archetype of the opening
 *   texture  the surface treatment, chosen from the sector's own material:
 *            a cavity array is dots, a mould plate is hatch, a pitch comb is
 *            vertical rules, a hull is a swell
 *   weight   how dense the chapter's section rhythm runs
 *
 * No two neighbouring verticals share a ground and a texture, so scrolling
 * from one chapter to the next never feels like a reskin.
 */
export type ChapterGround = 'steel' | 'light' | 'tint';
export type ChapterHeroKind = 'split' | 'stacked' | 'plate' | 'index';
export type ChapterTexture = 'dot' | 'hatch' | 'wave' | 'comb' | 'grain' | 'mesh' | 'sheen';
export type ChapterWeight = 'airy' | 'even' | 'dense';

export interface IndustryArt {
  ground: ChapterGround;
  hero: ChapterHeroKind;
  texture: ChapterTexture;
  weight: ChapterWeight;
}

export interface Industry {
  key: IndustryKey;
  /** URL segment. Stable across all nine languages. */
  slug: string;
  /** Display order in the bento and in navigation. */
  order: number;
  /** Bento column span out of 6 on desktop. */
  span: 2 | 3 | 4 | 6;
  /** Bento row span. Flagships are taller. */
  rowSpan: 1 | 2;
  /** Flagship verticals get more visual weight everywhere they appear. */
  flagship: boolean;
  palette: IndustryPalette;
  /** Motion signature — read by the page and by its bento tile. */
  motion: 'settle' | 'refract' | 'torque' | 'sheen' | 'expand' | 'seal' | 'pulse' | 'assemble' | 'flow' | 'lock' | 'grain' | 'swell' | 'trace';
  /** The one geometric idea the whole page is built on. */
  motif: string;
  /** How that idea is dressed. See IndustryArt above. */
  art: IndustryArt;
}

const P = (p: IndustryPalette) => p;

export const INDUSTRIES: Record<IndustryKey, Industry> = {
  /* ── Flagship 1 ─────────────────────────────────────────────────────────── */
  medical: {
    key: 'medical', slug: 'medical', order: 1, span: 3, rowSpan: 2, flagship: true,
    motion: 'settle',
    motif: 'A repeating cavity array resolving into perfect registration — precision shown as repetition, not as a hospital.',
    art: { ground: 'light', hero: 'index',   texture: 'dot',   weight: 'airy' },
    palette: P({
      surface: '#F7F9FA', surfaceSunk: '#EDF2F4', surfaceRaise: '#FFFFFF',
      ink: '#101E24', inkMuted: '#5A6B72', line: '#D2DDE1',
      accent: '#0E7C86', accentDeep: '#0A5A61', accentWash: '#E2F1F2',
      signal: '#B4531B', inverse: '#0B1D22', inverseInk: '#E8F1F2',
    }),
  },

  /* ── Flagship 2 ─────────────────────────────────────────────────────────── */
  beverage: {
    key: 'beverage', slug: 'beverage', order: 2, span: 3, rowSpan: 2, flagship: true,
    motion: 'refract',
    motif: 'A preform becoming a bottle — mass conserved, wall stretched, light bending through PET.',
    art: { ground: 'tint',  hero: 'stacked', texture: 'wave',  weight: 'even' },
    palette: P({
      surface: '#F4F9FC', surfaceSunk: '#E6F2F8', surfaceRaise: '#FFFFFF',
      ink: '#08222F', inkMuted: '#4E6C7B', line: '#CBE1EC',
      accent: '#0B7FC4', accentDeep: '#075A8C', accentWash: '#DCEEF9',
      signal: '#00A6A6', inverse: '#062634', inverseInk: '#DFF0F8',
    }),
  },

  /* ── Structural / mechanical ────────────────────────────────────────────── */
  automotive: {
    key: 'automotive', slug: 'automotive', order: 3, span: 2, rowSpan: 1, flagship: false,
    motion: 'torque',
    motif: 'Side actions and slides withdrawing — the mechanism inside the tool, drawn as engineering section.',
    art: { ground: 'steel', hero: 'plate',   texture: 'hatch', weight: 'dense' },
    palette: P({
      surface: '#F4F5F6', surfaceSunk: '#E7E9EB', surfaceRaise: '#FDFDFD',
      ink: '#16191C', inkMuted: '#5C646C', line: '#D0D5D9',
      accent: '#3F4C59', accentDeep: '#232C35', accentWash: '#E4E8EC',
      signal: '#C2761A', inverse: '#15181B', inverseInk: '#E6E9EC',
    }),
  },

  cosmetics: {
    key: 'cosmetics', slug: 'cosmetics', order: 4, span: 2, rowSpan: 1, flagship: false,
    motion: 'sheen',
    motif: 'A single unbroken show surface — light travelling across a polish grade, and the gate hidden out of sight.',
    art: { ground: 'light', hero: 'split',   texture: 'sheen', weight: 'airy' },
    palette: P({
      surface: '#FAF7F4', surfaceSunk: '#F2ECE6', surfaceRaise: '#FFFFFF',
      ink: '#241C22', inkMuted: '#6C5E66', line: '#E2D7CE',
      accent: '#8C5E6B', accentDeep: '#5E3B47', accentWash: '#F3E9EB',
      signal: '#B08D57', inverse: '#221A20', inverseInk: '#F3ECE9',
    }),
  },

  appliances: {
    key: 'appliances', slug: 'appliances', order: 5, span: 2, rowSpan: 1, flagship: false,
    motion: 'expand',
    motif: 'A large panel held flat — cooling layout as architecture, warpage as the enemy.',
    art: { ground: 'tint',  hero: 'stacked', texture: 'mesh',  weight: 'even' },
    palette: P({
      surface: '#F6F7F9', surfaceSunk: '#EAEDF1', surfaceRaise: '#FFFFFF',
      ink: '#141920', inkMuted: '#5A646F', line: '#D5DAE1',
      accent: '#3B5F8A', accentDeep: '#28425F', accentWash: '#E4EAF2',
      signal: '#8A6A3B', inverse: '#131820', inverseInk: '#E7EBF1',
    }),
  },

  chemical: {
    key: 'chemical', slug: 'chemical', order: 6, span: 2, rowSpan: 1, flagship: false,
    motion: 'seal',
    motif: 'Thread engaging thread — the millimetre of geometry between contained and leaking.',
    art: { ground: 'steel', hero: 'split',   texture: 'grain', weight: 'even' },
    palette: P({
      surface: '#F5F7F6', surfaceSunk: '#E8EDEB', surfaceRaise: '#FFFFFF',
      ink: '#101A18', inkMuted: '#54635F', line: '#CFD9D6',
      accent: '#20566B', accentDeep: '#143A4A', accentWash: '#E0EBEF',
      signal: '#9BAF16', inverse: '#0E1918', inverseInk: '#E4EBE9',
    }),
  },

  electrical: {
    key: 'electrical', slug: 'electrical', order: 7, span: 2, rowSpan: 1, flagship: false,
    motion: 'pulse',
    motif: 'Thin wall and long flow — the moulding problem drawn as a distance the melt has to travel.',
    art: { ground: 'steel', hero: 'index',   texture: 'comb',  weight: 'dense' },
    palette: P({
      surface: '#F6F6F7', surfaceSunk: '#EAEAEE', surfaceRaise: '#FFFFFF',
      ink: '#131521', inkMuted: '#585C6B', line: '#D3D4DB',
      accent: '#1F2A5C', accentDeep: '#141C3E', accentWash: '#E3E5EF',
      signal: '#B87333', inverse: '#111426', inverseInk: '#E6E7EE',
    }),
  },

  toys: {
    key: 'toys', slug: 'consumer-products', order: 8, span: 2, rowSpan: 1, flagship: false,
    motion: 'assemble',
    motif: 'Part count falling — three mouldings becoming one, and the assembly labour disappearing with them.',
    art: { ground: 'light', hero: 'stacked', texture: 'mesh',  weight: 'even' },
    palette: P({
      surface: '#FAF8F5', surfaceSunk: '#F1ECE5', surfaceRaise: '#FFFFFF',
      ink: '#1F1A16', inkMuted: '#6B6157', line: '#E1D9CF',
      accent: '#C9531F', accentDeep: '#8F3813', accentWash: '#F8E6DC',
      signal: '#2F6B6B', inverse: '#1C1713', inverseInk: '#F4EFE9',
    }),
  },

  agriculture: {
    key: 'agriculture', slug: 'agriculture', order: 9, span: 2, rowSpan: 1, flagship: false,
    motion: 'flow',
    motif: 'A labyrinth channel a few tenths of a millimetre wide, magnified until it becomes architecture.',
    art: { ground: 'tint',  hero: 'plate',   texture: 'wave',  weight: 'even' },
    palette: P({
      surface: '#F6F8F4', surfaceSunk: '#E9EFE5', surfaceRaise: '#FFFFFF',
      ink: '#14200F', inkMuted: '#586453', line: '#D3DDCB',
      accent: '#3F7D45', accentDeep: '#2A5A2F', accentWash: '#E3EFDF',
      signal: '#0F7FA8', inverse: '#121B0E', inverseInk: '#E7EEE3',
    }),
  },

  plumbing: {
    key: 'plumbing', slug: 'plumbing', order: 10, span: 2, rowSpan: 1, flagship: false,
    motion: 'lock',
    motif: 'A family of fittings on a shared grid — one tooling logic serving forty part numbers.',
    art: { ground: 'light', hero: 'index',   texture: 'hatch', weight: 'dense' },
    palette: P({
      surface: '#F5F6F7', surfaceSunk: '#E8EBED', surfaceRaise: '#FFFFFF',
      ink: '#121A1E', inkMuted: '#566268', line: '#D1D8DC',
      accent: '#16607A', accentDeep: '#0E4152', accentWash: '#DFEBF0',
      signal: '#A8813C', inverse: '#101A1E', inverseInk: '#E5EAED',
    }),
  },

  furniture: {
    key: 'furniture', slug: 'furniture', order: 11, span: 2, rowSpan: 1, flagship: false,
    motion: 'grain',
    motif: 'A load path through a moulded part — where the plastic has to be strong, and where it does not.',
    art: { ground: 'tint',  hero: 'split',   texture: 'grain', weight: 'airy' },
    palette: P({
      surface: '#F9F7F2', surfaceSunk: '#F0EBE1', surfaceRaise: '#FFFFFF',
      ink: '#211D16', inkMuted: '#6A6255', line: '#E0D8C9',
      accent: '#6E6242', accentDeep: '#4A4129', accentWash: '#EFEADD',
      signal: '#8C5A2B', inverse: '#1E1A14', inverseInk: '#F2EDE4',
    }),
  },

  marine: {
    key: 'marine', slug: 'marine', order: 12, span: 2, rowSpan: 1, flagship: false,
    motion: 'swell',
    motif: 'A worn part measured back into geometry — reverse engineering where no drawing was ever kept.',
    art: { ground: 'steel', hero: 'stacked', texture: 'wave',  weight: 'even' },
    palette: P({
      surface: '#F3F6F8', surfaceSunk: '#E3EBF0', surfaceRaise: '#FFFFFF',
      ink: '#0A1B26', inkMuted: '#4C626F', line: '#C8D7E0',
      accent: '#0B3D5C', accentDeep: '#062737', accentWash: '#DCE8EF',
      signal: '#3FA7A0', inverse: '#08202E', inverseInk: '#DEEAF0',
    }),
  },

  custom: {
    key: 'custom', slug: 'custom-projects', order: 13, span: 4, rowSpan: 1, flagship: false,
    motion: 'trace',
    motif: 'The engineer’s desk: whatever the visitor brought, annotated in red and turned into a next step.',
    art: { ground: 'light', hero: 'plate',   texture: 'grain', weight: 'even' },
    palette: P({
      surface: '#F8F8F7', surfaceSunk: '#EDEDEB', surfaceRaise: '#FFFFFF',
      ink: '#17181A', inkMuted: '#5E6165', line: '#D6D7D5',
      accent: '#2E4A7D', accentDeep: '#1D3255', accentWash: '#E4E9F2',
      signal: '#C2185B', inverse: '#151618', inverseInk: '#E9E9E7',
    }),
  },
};

export const INDUSTRY_ORDER: IndustryKey[] = (Object.values(INDUSTRIES) as Industry[])
  .sort((a, b) => a.order - b.order)
  .map((i) => i.key);

export const INDUSTRY_LIST: Industry[] = INDUSTRY_ORDER.map((k) => INDUSTRIES[k]);

export const FLAGSHIPS: IndustryKey[] = INDUSTRY_LIST.filter((i) => i.flagship).map((i) => i.key);

export const bySlug = (slug: string): Industry | undefined =>
  INDUSTRY_LIST.find((i) => i.slug === slug);

/** Emits the palette as CSS custom properties, scoped by the caller. */
export function paletteVars(p: IndustryPalette): string {
  return [
    `--surface:${p.surface}`,
    `--surface-sunk:${p.surfaceSunk}`,
    `--surface-raise:${p.surfaceRaise}`,
    `--ink:${p.ink}`,
    `--ink-muted:${p.inkMuted}`,
    `--line:${p.line}`,
    `--accent:${p.accent}`,
    `--accent-deep:${p.accentDeep}`,
    `--accent-wash:${p.accentWash}`,
    `--signal:${p.signal}`,
    // Lightened for use inside an inverted band, where the light-surface signal
    // colour would fall below the contrast threshold.
    `--signal-inverse:color-mix(in oklab, ${p.signal} 55%, #FFE6CC)`,
    // The signal darkened for small text on a light surface.
    `--signal-ink:color-mix(in oklab, ${p.signal} 72%, #1A1209)`,
    // The accent lightened for an inverted band.
    `--accent-inverse:color-mix(in oklab, ${p.accent} 46%, #F2FAFF)`,
    `--inverse:${p.inverse}`,
    `--inverse-ink:${p.inverseInk}`,
  ].join(';');
}
