/**
 * ─────────────────────────────────────────────────────────────────────────────
 * METAL FORM — SINGLE SOURCE OF TRUTH FOR BRAND + CONTACT
 * ─────────────────────────────────────────────────────────────────────────────
 * Everything a future rebrand or a change of contact details would touch lives
 * in this file. Nothing else in the codebase should hardcode the company name,
 * a phone number, an address or a social link.
 *
 * ▲ PRODUCTION VALUES STILL REQUIRED — see `PENDING` at the bottom of this file.
 *   Values marked TBD are inert: the UI renders completely, but any control that
 *   would depend on a missing value degrades to a safe alternative instead of
 *   exposing a placeholder to a visitor.
 */

export type PendingValue = { readonly pending: true; readonly id: string };

const TBD = (id: string): PendingValue => ({ pending: true, id });

export const isPending = (v: unknown): v is PendingValue =>
  typeof v === 'object' && v !== null && (v as PendingValue).pending === true;

/** Returns the value when it is real, or `undefined` when it is still a placeholder. */
export function resolved<T>(v: T | PendingValue): T | undefined {
  return isPending(v) ? undefined : (v as T);
}

/* ── Brand ─────────────────────────────────────────────────────────────────── */

export const BRAND = {
  /** Registered company name. NEVER "Metal Foam". */
  name: 'Metal Form',
  /** Used where the mark is set as two weighted words. */
  nameParts: ['Metal', 'Form'] as const,
  /** Short form for tight spaces and the browser tab. */
  shortName: 'Metal Form',
  /** Legal entity line, if/when required on invoices or legal pages. */
  legalName: 'Metal Form' as string | PendingValue,
  /** Year operations began — verified in the master brief. */
  since: 2006,
  /** Kept generic on purpose: the brand must survive expansion beyond one workshop. */
  discipline: 'Engineering · Tooling · Manufacturing · Supply',
} as const;

/* ── Origin / deployment ───────────────────────────────────────────────────── */

export const SITE = {
  /** Canonical origin. Update at deploy time; used for canonical + hreflang + OG. */
  origin: 'https://metalform.co',
  /** Sub-path if ever deployed under one. Keep '' for root deployments. */
  base: '',
} as const;

/* ── Contact ───────────────────────────────────────────────────────────────── */

export const CONTACT = {
  /**
   * WhatsApp number in full international format, digits only, no `+`.
   * e.g. '989121234567'. While pending, every WhatsApp CTA falls back to the
   * contact section rather than opening a broken wa.me link.
   */
  whatsapp: TBD('WHATSAPP_NUMBER_TBD') as string | PendingValue,
  /** Display form of the same number, e.g. '+98 912 123 4567'. */
  whatsappDisplay: TBD('WHATSAPP_DISPLAY_TBD') as string | PendingValue,

  email: TBD('EMAIL_TBD') as string | PendingValue,
  phone: TBD('PHONE_TBD') as string | PendingValue,

  /** Registered address, shown small and discreetly. */
  address: {
    line1: TBD('ADDRESS_LINE1_TBD') as string | PendingValue,
    city: TBD('ADDRESS_CITY_TBD') as string | PendingValue,
    country: 'Iran',
    countryCode: 'IR',
  },

  /** Optional secondary channels. Leave pending until confirmed. */
  telegram: TBD('TELEGRAM_TBD') as string | PendingValue,
  wechat: TBD('WECHAT_TBD') as string | PendingValue,
  linkedin: TBD('LINKEDIN_TBD') as string | PendingValue,

  /** Approved commitment from the master brief. */
  responseWindowDays: 2,
} as const;

/* ── Capability flags ──────────────────────────────────────────────────────── */
/**
 * Modules that depend on assets or facts the company does not yet have are
 * switched off here rather than shipped with visible placeholders.
 */
export const FEATURES = {
  /** Real, customer-approved project photography exists. */
  realProjectMedia: false,
  /** A factory / workshop film exists and is cleared for publication. */
  facilityFilm: false,
  /** Named references or logos have written permission. */
  namedReferences: false,
  /** Legal pages have approved final text. */
  legalPages: false,
  /** Analytics endpoint is live (events are queued to the console until then). */
  analytics: false,
} as const;

/* ── Verified public facts ─────────────────────────────────────────────────── */
/**
 * The ONLY numbers permitted in public copy. Anything not in this object must
 * not be stated as a fact about Metal Form. See `src/config/claims.ts`.
 */
export const FACTS = {
  sinceYear: 2006,
  projectsCompleted: 1000,
  projectsCompletedIsMinimum: true,
  maxCavitiesDelivered: 46,
  cadSoftware: ['CATIA', 'SolidWorks'] as const,
  responseWindowDays: 2,
} as const;

/* ── Outstanding production values ─────────────────────────────────────────── */

export const PENDING = [
  { id: 'WHATSAPP_NUMBER_TBD', what: 'WhatsApp business number (digits only, international format)', blocks: 'Every primary CTA. Until set, CTAs route to the contact section.' },
  { id: 'EMAIL_TBD', what: 'Public enquiry email address', blocks: 'Secondary contact channel + structured data.' },
  { id: 'PHONE_TBD', what: 'Public telephone number', blocks: 'Secondary contact channel + structured data.' },
  { id: 'ADDRESS_LINE1_TBD', what: 'Registered street address', blocks: 'Discreet address line in the footer + structured data.' },
  { id: 'ADDRESS_CITY_TBD', what: 'City of registration', blocks: 'Same as above.' },
  { id: 'TELEGRAM_TBD', what: 'Telegram handle (optional secondary channel)', blocks: 'Nothing — module hidden while pending.' },
  { id: 'SITE_ORIGIN', what: 'Final production domain (currently https://metalform.co)', blocks: 'Canonical URLs, hreflang and Open Graph tags.' },
] as const;
