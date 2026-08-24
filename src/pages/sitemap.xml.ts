/**
 * Sitemap with full hreflang alternates.
 *
 * Every page exists in nine languages and each one is a real, shareable URL —
 * a salesperson sends /hy/industries/beverage/ to a bottler in Yerevan. The
 * sitemap has to say that these are the same page in different languages, or
 * they compete with each other in search.
 */
import type { APIRoute } from 'astro';
import { SITE } from '../config/site.ts';
import { ORIGIN } from '../config/origin.ts';
import { LOCALE_ORDER, LOCALES } from '../i18n/locales.ts';
import { INDUSTRY_LIST } from '../config/industries.ts';

/** Routes within a locale, with a relative priority. */
const ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '', priority: '1.0', changefreq: 'monthly' },
  { path: 'industries', priority: '0.9', changefreq: 'monthly' },
  { path: 'capabilities', priority: '0.8', changefreq: 'monthly' },
  { path: 'about', priority: '0.6', changefreq: 'yearly' },
  { path: 'contact', priority: '0.8', changefreq: 'yearly' },
  ...INDUSTRY_LIST.map((ind) => ({
    path: `industries/${ind.slug}`,
    // The two flagship verticals carry the launch campaigns.
    priority: ind.flagship ? '0.9' : '0.7',
    changefreq: 'monthly',
  })),
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const root = `${ORIGIN}${SITE.base}`;
const url = (locale: string, path: string) =>
  `${root}/${locale}${path ? `/${path}` : ''}/`;

export const GET: APIRoute = () => {
  const entries: string[] = [];

  // The language selector at the root.
  entries.push(
    [
      '  <url>',
      `    <loc>${root}/</loc>`,
      '    <changefreq>monthly</changefreq>',
      '    <priority>1.0</priority>',
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${root}/" />`,
      ...LOCALE_ORDER.map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${LOCALES[l].tag}" href="${esc(url(l, ''))}" />`,
      ),
      '  </url>',
    ].join('\n'),
  );

  for (const route of ROUTES) {
    for (const locale of LOCALE_ORDER) {
      entries.push(
        [
          '  <url>',
          `    <loc>${esc(url(locale, route.path))}</loc>`,
          `    <changefreq>${route.changefreq}</changefreq>`,
          `    <priority>${route.priority}</priority>`,
          ...LOCALE_ORDER.map(
            (alt) =>
              `    <xhtml:link rel="alternate" hreflang="${LOCALES[alt].tag}" href="${esc(url(alt, route.path))}" />`,
          ),
          `    <xhtml:link rel="alternate" hreflang="x-default" href="${root}/" />`,
          '  </url>',
        ].join('\n'),
      );
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
