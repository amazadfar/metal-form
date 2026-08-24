/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LOCALES
 * ─────────────────────────────────────────────────────────────────────────────
 * Nine languages, five scripts, two writing directions.
 * Every entry drives routing, <html lang/dir>, font loading, hreflang and the
 * language selector — nothing about a language is hardcoded anywhere else.
 */

export type Locale = 'en' | 'ru' | 'hy' | 'tr' | 'th' | 'zh' | 'ur' | 'ar' | 'fa';
export type Direction = 'ltr' | 'rtl';
export type Script = 'latin' | 'cyrillic' | 'armenian' | 'thai' | 'han' | 'arabic';

export interface LocaleDef {
  code: Locale;
  /** BCP-47 tag used for `lang`, hreflang and Intl formatting. */
  tag: string;
  /** Endonym — how speakers write the language's own name. Never anglicised. */
  native: string;
  /** English name, used in internal tooling and the selector's secondary line. */
  english: string;
  dir: Direction;
  script: Script;
  /** CSS custom property holding this script's font stack. */
  fontVar: string;
  /**
   * Optical correction. Armenian, Thai and Arabic faces sit differently against
   * the Latin baseline; these multiply the base type scale for that locale.
   */
  typeScale: number;
  /** Line-height multiplier. Thai and Nastaliq-adjacent scripts need more room. */
  leading: number;
  /**
   * Prose runs longer than English in most of these languages. Used to reserve
   * space in tight components so a translation cannot break a layout.
   */
  expansion: number;
  /**
   * Western digits everywhere. Technical B2B writing in Persian, Arabic and
   * Urdu uses Western digits for specifications, tolerances and cavity counts;
   * Eastern digits would read as consumer-facing and complicate scanning.
   */
  numerals: 'latn' | 'arab' | 'arabext';
  /** Region hint used only to order the selector sensibly. */
  region: string;
}

export const LOCALES: Record<Locale, LocaleDef> = {
  en: { code: 'en', tag: 'en',    native: 'English',  english: 'English',           dir: 'ltr', script: 'latin',    fontVar: '--font-latin',    typeScale: 1,     leading: 1,    expansion: 1,    numerals: 'latn', region: 'International' },
  ru: { code: 'ru', tag: 'ru',    native: 'Русский',  english: 'Russian',           dir: 'ltr', script: 'cyrillic', fontVar: '--font-cyrillic', typeScale: 0.97,  leading: 1.02, expansion: 1.15, numerals: 'latn', region: 'Russia & CIS' },
  hy: { code: 'hy', tag: 'hy',    native: 'Հայերեն',  english: 'Armenian',          dir: 'ltr', script: 'armenian', fontVar: '--font-armenian', typeScale: 0.98,  leading: 1.05, expansion: 1.12, numerals: 'latn', region: 'Armenia' },
  tr: { code: 'tr', tag: 'tr',    native: 'Türkçe',   english: 'Turkish',           dir: 'ltr', script: 'latin',    fontVar: '--font-latin',    typeScale: 1,     leading: 1,    expansion: 1.1,  numerals: 'latn', region: 'Türkiye' },
  th: { code: 'th', tag: 'th',    native: 'ไทย',      english: 'Thai',              dir: 'ltr', script: 'thai',     fontVar: '--font-thai',     typeScale: 1.04,  leading: 1.28, expansion: 0.95, numerals: 'latn', region: 'Thailand' },
  zh: { code: 'zh', tag: 'zh-Hans', native: '中文',   english: 'Chinese',           dir: 'ltr', script: 'han',      fontVar: '--font-han',      typeScale: 1.02,  leading: 1.12, expansion: 0.6,  numerals: 'latn', region: 'China' },
  ur: { code: 'ur', tag: 'ur',    native: 'اردو',     english: 'Urdu',              dir: 'rtl', script: 'arabic',   fontVar: '--font-urdu',     typeScale: 1.06,  leading: 1.35, expansion: 1.05, numerals: 'latn', region: 'Pakistan' },
  ar: { code: 'ar', tag: 'ar',    native: 'العربية',  english: 'Arabic',            dir: 'rtl', script: 'arabic',   fontVar: '--font-arabic',   typeScale: 1.05,  leading: 1.22, expansion: 1.0,  numerals: 'latn', region: 'Middle East' },
  fa: { code: 'fa', tag: 'fa',    native: 'فارسی',    english: 'Persian',           dir: 'rtl', script: 'arabic',   fontVar: '--font-persian',  typeScale: 1.04,  leading: 1.22, expansion: 1.0,  numerals: 'latn', region: 'Iran' },
};

/** Order shown in the language selector. Deliberate, not alphabetical. */
export const LOCALE_ORDER: Locale[] = ['en', 'ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'];

export const DEFAULT_LOCALE: Locale = 'en';

export const RTL_LOCALES: Locale[] = LOCALE_ORDER.filter((l) => LOCALES[l].dir === 'rtl');

export const isLocale = (v: unknown): v is Locale =>
  typeof v === 'string' && Object.prototype.hasOwnProperty.call(LOCALES, v);

export const dirOf = (l: Locale): Direction => LOCALES[l].dir;
export const isRtl = (l: Locale): boolean => LOCALES[l].dir === 'rtl';

/* ── Routing ───────────────────────────────────────────────────────────────── */

/** Build a locale-prefixed, trailing-slashed path: localePath('fa', 'industries/beverage'). */
export function localePath(locale: Locale, ...segments: (string | undefined)[]): string {
  const parts = segments
    .filter((s): s is string => typeof s === 'string' && s.length > 0)
    .flatMap((s) => s.split('/'))
    .filter(Boolean);
  return `/${[locale, ...parts].join('/')}/`;
}

/** Swap the locale on the current path, preserving the rest of the route. */
export function swapLocale(pathname: string, next: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length && isLocale(parts[0])) parts[0] = next;
  else parts.unshift(next);
  return `/${parts.join('/')}/`;
}

/** Read the active locale out of a pathname, falling back to the default. */
export function localeFromPath(pathname: string): Locale {
  const first = pathname.split('/').filter(Boolean)[0];
  return isLocale(first) ? first : DEFAULT_LOCALE;
}

/**
 * Best-effort match of an Accept-Language / navigator.language value.
 * Used only as a *hint* in the selector — the selector is always shown.
 */
export function matchLocale(preferred: string | null | undefined): Locale | null {
  if (!preferred) return null;
  const lower = preferred.toLowerCase();
  const primary = lower.split('-')[0];
  if (primary === 'zh') return 'zh';
  if (primary === 'fa' || primary === 'per') return 'fa';
  if (isLocale(primary)) return primary;
  return null;
}
