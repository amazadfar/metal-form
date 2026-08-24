/**
 * Per-locale font preloading.
 *
 * A page is only ever one language, so it should only ever pay for one script.
 * These are the two or three files that block first paint for a given locale;
 * everything else in `fonts.css` is left to `font-display: swap` and the
 * browser's own unicode-range matching.
 */
import type { Locale } from '../i18n/locales.ts';

export interface PreloadFont {
  href: string;
  /** woff2 everywhere — no legacy formats are shipped. */
  type: 'font/woff2';
}

const f = (href: string): PreloadFont => ({ href, type: 'font/woff2' });

/**
 * Latin is preloaded alongside every non-Latin script: part numbers, neck-finish
 * designations, cavity counts, CAD format names and the wordmark itself stay in
 * Latin characters in all nine languages.
 */
const LATIN_BODY = f('/fonts/metal-grotesk/metal-grotesk-400-latin.woff2');
const LATIN_MED = f('/fonts/metal-grotesk/metal-grotesk-500-latin.woff2');
const MONO = f('/fonts/metal-mono/metal-mono-400-latin.woff2');

export const PRELOAD: Record<Locale, PreloadFont[]> = {
  en: [LATIN_BODY, LATIN_MED, MONO],
  tr: [LATIN_BODY, LATIN_MED, MONO],
  ru: [
    f('/fonts/metal-grotesk/metal-grotesk-400-cyrillic.woff2'),
    f('/fonts/metal-grotesk/metal-grotesk-500-cyrillic.woff2'),
    LATIN_BODY,
    MONO,
  ],
  hy: [
    f('/fonts/metal-armenian/metal-armenian-400-armenian.woff2'),
    f('/fonts/metal-armenian/metal-armenian-500-armenian.woff2'),
    LATIN_BODY,
    MONO,
  ],
  th: [
    f('/fonts/metal-thai/metal-thai-400-thai.woff2'),
    f('/fonts/metal-thai/metal-thai-500-thai.woff2'),
    LATIN_BODY,
    MONO,
  ],
  // Chinese is served as ~100 unicode ranges; preloading any single one would be
  // a guess. The Latin faces are preloaded and Han resolves through swap.
  zh: [LATIN_BODY, MONO],
  ar: [
    f('/fonts/metal-arabic/metal-arabic-400-arabic.woff2'),
    f('/fonts/metal-arabic/metal-arabic-500-arabic.woff2'),
    LATIN_BODY,
    MONO,
  ],
  fa: [
    f('/fonts/metal-persian/metal-persian-400-arabic.woff2'),
    f('/fonts/metal-persian/metal-persian-500-arabic.woff2'),
    LATIN_BODY,
    MONO,
  ],
  ur: [
    f('/fonts/metal-urdu/metal-urdu-400-arabic.woff2'),
    LATIN_BODY,
    MONO,
  ],
};

/**
 * The @font-face stylesheets a locale needs, linked from the document head.
 *
 * They are split per family for one reason: Noto Sans SC is served as ~200
 * unicode ranges and its @font-face block alone is over 200 KB of CSS. Shipping
 * that to a Turkish reader on factory Wi-Fi to render a page with no Chinese
 * characters on it would be indefensible.
 *
 * The Latin and mono faces load in every locale — part numbers, resin grades,
 * neck designations and the wordmark stay in Latin characters everywhere.
 */
const CSS = (slug: string) => `/fonts/css/${slug}.css`;
const BASE_CSS = [CSS('metal-grotesk'), CSS('metal-mono')];

export const FONT_CSS: Record<Locale, string[]> = {
  en: BASE_CSS,
  tr: BASE_CSS,
  ru: BASE_CSS,
  hy: [...BASE_CSS, CSS('metal-armenian')],
  th: [...BASE_CSS, CSS('metal-thai')],
  zh: [...BASE_CSS, CSS('metal-han')],
  ar: [...BASE_CSS, CSS('metal-arabic')],
  fa: [...BASE_CSS, CSS('metal-persian')],
  ur: [...BASE_CSS, CSS('metal-urdu')],
};

/**
 * The selector renders all nine scripts at once, so it is the one page that
 * legitimately loads every stylesheet — including Han, for the 中文 tile.
 */
export const SELECTOR_CSS = [
  ...BASE_CSS,
  CSS('metal-armenian'),
  CSS('metal-thai'),
  CSS('metal-arabic'),
  CSS('metal-persian'),
  CSS('metal-urdu'),
  CSS('metal-han'),
];

/**
 * The selector's preload set.
 *
 * Deliberately NOT all nine scripts. The page's first meaningful paint is the
 * Latin headline, and preloading nine faces — one of which, Noto Nastaliq Urdu,
 * is 233 KB on its own — would put a quarter of a megabyte in front of it on a
 * mobile connection in Yerevan or Tehran. The other eight arrive a beat later
 * through `font-display: swap`, which is exactly what swap is for: those tiles
 * sit below the headline and are read second.
 */
export const SELECTOR_PRELOAD: PreloadFont[] = [LATIN_BODY, LATIN_MED, MONO];
