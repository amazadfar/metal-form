/**
 * Conversion plumbing: WhatsApp deep links, channel availability and analytics
 * hooks. Every primary call-to-action on the site goes through here, so the
 * moment a real number is set in `src/config/site.ts` the whole site is live.
 */
import { CONTACT, isPending, resolved } from '../config/site.ts';
import type { Locale } from '../i18n/locales.ts';

export type CtaSource =
  | 'home_hero' | 'home_cta' | 'home_pillars' | 'home_process'
  | 'nav' | 'footer' | 'contact_page' | 'capabilities' | 'about'
  | `industry_${string}`;

export interface WhatsAppLink {
  /** `undefined` while the number is pending — callers fall back to the contact route. */
  href: string | undefined;
  /** True when a real number is configured. */
  live: boolean;
}

/**
 * Builds a wa.me link with a pre-filled message.
 *
 * The message is written in the visitor's own language and phrased in the first
 * person: an industrial buyer should be able to press send without editing it,
 * and the message should tell Metal Form which page produced the enquiry.
 */
export function whatsappLink(prefill: string, source: CtaSource, locale: Locale): WhatsAppLink {
  const number = resolved(CONTACT.whatsapp);
  if (!number) return { href: undefined, live: false };

  // A quiet routing marker. Visible to Metal Form, meaningless noise to nobody.
  const ref = `\n\n— ${source} · ${locale}`;
  const text = encodeURIComponent(`${prefill}${ref}`);
  return { href: `https://wa.me/${number}?text=${text}`, live: true };
}

export const mailtoLink = (subject: string): string | undefined => {
  const email = resolved(CONTACT.email);
  return email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : undefined;
};

export const telLink = (): string | undefined => {
  const phone = resolved(CONTACT.phone);
  return phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined;
};

/** Which contact channels can actually be offered right now. */
export function availableChannels() {
  return {
    whatsapp: !isPending(CONTACT.whatsapp),
    email: !isPending(CONTACT.email),
    phone: !isPending(CONTACT.phone),
    telegram: !isPending(CONTACT.telegram),
    address: !isPending(CONTACT.address.line1),
  };
}

/**
 * Canonical analytics event names. Wired into the DOM as data attributes and
 * dispatched by `src/scripts/analytics.ts`, so a provider can be connected
 * later without touching a single component.
 */
export const analyticsEvent = (source: CtaSource) => `cta_whatsapp_${source}`;
