/**
 * The language selector shows all nine languages at once, so its strings cannot
 * live in a per-locale content file — every tile needs its own language
 * regardless of which one the visitor eventually picks.
 *
 * Each tile carries the endonym and a one-line statement of what the company
 * does, written in that language. That is deliberate: the selector is the first
 * proof that the localisation is real rather than a machine-translated shell.
 *
 * ▲ These nine lines are reviewed in the localisation QA pass alongside the rest
 *   of the content — see `research/_terminology.json`.
 */
import type { Locale } from './locales.ts';

export interface SelectorTile {
  /** Short promise, in this language. Kept to roughly four or five words. */
  promise: string;
  /** The action, in this language. Sits under the promise on hover/focus. */
  enter: string;
}

export const SELECTOR: Record<Locale, SelectorTile> = {
  en: { promise: 'From an idea to mass production', enter: 'Enter in English' },
  ru: { promise: 'От идеи до серийного производства', enter: 'Войти на русском' },
  hy: { promise: 'Գաղափարից մինչև զանգվածային արտադրություն', enter: 'Մուտք հայերենով' },
  tr: { promise: 'Fikirden seri üretime', enter: 'Türkçe devam et' },
  th: { promise: 'จากแนวคิดสู่การผลิตจำนวนมาก', enter: 'เข้าสู่เว็บไซต์ภาษาไทย' },
  zh: { promise: '从构想到批量生产', enter: '进入中文网站' },
  ur: { promise: 'تصور سے بڑے پیمانے پر پیداوار تک', enter: 'اردو میں داخل ہوں' },
  ar: { promise: 'من الفكرة إلى الإنتاج الضخم', enter: 'الدخول بالعربية' },
  fa: { promise: 'از ایده تا تولید انبوه', enter: 'ورود به نسخه فارسی' },
};

/**
 * "Select language", written nine times. Set as one continuous mono rule above
 * the grid, it reads as an international instrument panel rather than as a
 * translated label.
 */
export const SELECT_LABEL: Record<Locale, string> = {
  en: 'Select language',
  ru: 'Выберите язык',
  hy: 'Ընտրեք լեզուն',
  tr: 'Dil seçin',
  th: 'เลือกภาษา',
  zh: '选择语言',
  ur: 'زبان منتخب کریں',
  ar: 'اختر اللغة',
  fa: 'زبان را انتخاب کنید',
};
