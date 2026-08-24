/**
 * Canonical URLs, hreflang and structured data.
 * Search engines and a salesperson pasting a link both need every language of
 * every page to be a real, addressable, self-describing URL.
 */
import { SITE, BRAND, CONTACT, FACTS, resolved } from '../config/site.ts';
import { ORIGIN } from '../config/origin.ts';
import { LOCALES, LOCALE_ORDER, DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts';

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');

/** Absolute URL for a route within a locale. `route` excludes the locale prefix. */
export function absoluteUrl(locale: Locale, route = ''): string {
  const path = trimSlashes(route);
  return `${ORIGIN}${SITE.base}/${locale}${path ? `/${path}` : ''}/`;
}

/** The root of this deployment, without a trailing slash. */
export const siteRoot = (): string => `${ORIGIN}${SITE.base}`;

export interface AlternateLink { hreflang: string; href: string }

/** One alternate per language plus x-default pointing at the language selector. */
export function alternates(route = ''): AlternateLink[] {
  const list: AlternateLink[] = LOCALE_ORDER.map((l) => ({
    hreflang: LOCALES[l].tag,
    href: absoluteUrl(l, route),
  }));
  // x-default is the selector itself: a visitor whose language we cannot infer
  // should be asked, not guessed at.
  list.push({ hreflang: 'x-default', href: `${siteRoot()}/` });
  return list;
}

/**
 * Organization + WebSite structured data.
 * Only fields backed by a confirmed fact are emitted — an absent phone number
 * is simply absent rather than filled with a placeholder.
 */
export function organizationSchema(locale: Locale) {
  const email = resolved(CONTACT.email);
  const phone = resolved(CONTACT.phone);
  const street = resolved(CONTACT.address.line1);
  const city = resolved(CONTACT.address.city);

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: `${siteRoot()}/${locale}/`,
    foundingDate: String(FACTS.sinceYear),
    description:
      'Engineering, tooling, manufacturing and supply of moulded plastic components — from an idea, photograph, sample or drawing through to continuous production.',
    knowsLanguage: LOCALE_ORDER.map((l) => LOCALES[l].tag),
    areaServed: 'Worldwide',
  };

  const contactPoint: Record<string, unknown> = { '@type': 'ContactPoint', contactType: 'sales' };
  if (email) contactPoint.email = email;
  if (phone) contactPoint.telephone = phone;
  if (email || phone) {
    contactPoint.availableLanguage = LOCALE_ORDER.map((l) => LOCALES[l].tag);
    schema.contactPoint = contactPoint;
  }

  if (street || city) {
    const address: Record<string, unknown> = { '@type': 'PostalAddress', addressCountry: CONTACT.address.countryCode };
    if (street) address.streetAddress = street;
    if (city) address.addressLocality = city;
    schema.address = address;
  }

  return schema;
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** A named capability offered to a vertical. Kept deliberately free of claims. */
export function serviceSchema(locale: Locale, name: string, description: string, route: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    description,
    url: absoluteUrl(locale, route),
    provider: { '@type': 'Organization', name: BRAND.name, url: `${siteRoot()}/` },
    areaServed: 'Worldwide',
  };
}

export const isDefaultLocale = (l: Locale) => l === DEFAULT_LOCALE;
