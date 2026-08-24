/**
 * Content registry.
 *
 * Every locale folder is globbed eagerly at build time. Lookups fall back to
 * English key-by-key, so a partially translated file still renders a complete
 * page — the untranslated leaves simply appear in English rather than as gaps.
 */
import type { Locale } from '../i18n/locales.ts';
import { DEFAULT_LOCALE } from '../i18n/locales.ts';
import type {
  CommonContent, HomeContent, IndustryContent, IndustriesIndexContent,
  CapabilitiesContent, AboutContent, ContactContent,
} from './types.ts';

type Json = Record<string, unknown>;

const modules = import.meta.glob<Json>('./*/**/*.json', { eager: true, import: 'default' });

/** './en/industries/medical.json' → { locale: 'en', path: 'industries/medical' } */
function parseKey(key: string): { locale: string; path: string } | null {
  const m = key.match(/^\.\/([^/]+)\/(.+)\.json$/);
  return m ? { locale: m[1], path: m[2] } : null;
}

const store = new Map<string, Json>();
for (const [key, mod] of Object.entries(modules)) {
  const parsed = parseKey(key);
  if (parsed) store.set(`${parsed.locale}::${parsed.path}`, mod);
}

const missing = new Set<string>();

/** Deep-merges a translation over the English master so no key can be absent. */
function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return base;
    // Arrays are positional: a short translation keeps the master's tail.
    return base.map((item, i) => merge(item, over[i])) as unknown as T;
  }
  if (typeof base === 'object' && base !== null) {
    if (typeof over !== 'object' || Array.isArray(over)) return base;
    const out: Json = {};
    for (const [k, v] of Object.entries(base as Json)) {
      out[k] = merge(v, (over as Json)[k]);
    }
    // Keys present only in the translation are preserved rather than dropped.
    for (const [k, v] of Object.entries(over as Json)) {
      if (!(k in out)) out[k] = v;
    }
    return out as unknown as T;
  }
  return (typeof over === typeof base ? over : base) as T;
}

function load<T>(locale: Locale, path: string): T {
  const base = store.get(`${DEFAULT_LOCALE}::${path}`);
  if (!base) throw new Error(`[content] Missing English master: ${path}.json`);
  if (locale === DEFAULT_LOCALE) return base as unknown as T;

  const translated = store.get(`${locale}::${path}`);
  if (!translated) {
    const id = `${locale}::${path}`;
    if (!missing.has(id) && import.meta.env.DEV) {
      missing.add(id);
      console.warn(`[content] No ${locale} translation for "${path}" — falling back to English.`);
    }
    return base as unknown as T;
  }
  return merge(base as unknown as T, translated);
}

export const getCommon = (l: Locale) => load<CommonContent>(l, 'common');
export const getHome = (l: Locale) => load<HomeContent>(l, 'home');
export const getCapabilities = (l: Locale) => load<CapabilitiesContent>(l, 'capabilities');
export const getAbout = (l: Locale) => load<AboutContent>(l, 'about');
export const getContact = (l: Locale) => load<ContactContent>(l, 'contact');
export const getIndustriesIndex = (l: Locale) => load<IndustriesIndexContent>(l, 'industries-index');
export const getIndustry = (l: Locale, key: string) =>
  load<IndustryContent>(l, `industries/${key}`);

/** Build-time coverage report, printed by `scripts/check-content.mjs`. */
export function coverage(): Record<string, { present: string[]; absent: string[] }> {
  const paths = new Set<string>();
  for (const k of store.keys()) {
    const [loc, p] = k.split('::');
    if (loc === DEFAULT_LOCALE) paths.add(p);
  }
  const out: Record<string, { present: string[]; absent: string[] }> = {};
  for (const k of store.keys()) {
    const [loc] = k.split('::');
    if (!out[loc]) out[loc] = { present: [], absent: [] };
  }
  for (const loc of Object.keys(out)) {
    for (const p of paths) {
      (store.has(`${loc}::${p}`) ? out[loc].present : out[loc].absent).push(p);
    }
  }
  return out;
}
