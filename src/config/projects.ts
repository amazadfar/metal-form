/**
 * ─────────────────────────────────────────────────────────────────────────────
 * REAL PROJECT MEDIA
 * ─────────────────────────────────────────────────────────────────────────────
 * Photographs of actual Metal Form tools, parts and projects.
 *
 * This array is EMPTY, and that is the correct state today. Every drawing on
 * this site is a schematic and is labelled as one; nothing here may be a render,
 * an illustration, a stock photograph or an image of somebody else's equipment.
 *
 * ▲ Before adding an entry, three things must be true:
 *
 *   1. The image is a photograph of work Metal Form actually did.
 *   2. The customer has given WRITTEN permission, and `permission` records which
 *      kind: 'named' (they may be identified) or 'anonymous' (the work may be
 *      shown, the customer may not be named).
 *   3. Nothing in the image or the caption identifies a customer who chose
 *      'anonymous' — including a part that is recognisably theirs.
 *
 * Then switch `FEATURES.realProjectMedia` on in `src/config/site.ts`.
 *
 * Files go in `public/projects/`. Provide real pixel dimensions so the layout
 * reserves space and the page does not shift as images load.
 */
import type { Locale } from '../i18n/locales.ts';
import type { IndustryKey } from './industries.ts';

export interface Project {
  id: string;
  industry: IndustryKey;
  /** Path under /projects/. */
  image: string;
  width: number;
  height: number;
  /**
   * Alt text per locale. English is required; other locales fall back to it.
   * Describe what the photograph shows, technically — this is read aloud.
   */
  alt: Partial<Record<Locale, string>> & { en: string };
  /** One or two sentences on what the project was. Localised the same way. */
  note: Partial<Record<Locale, string>> & { en: string };
  /**
   * 'named'     — written permission to identify the customer. Set `customer`.
   * 'anonymous' — written permission to show the work, not to name the customer.
   * 'none'      — no permission. Never published; entries with 'none' are filtered out.
   */
  permission: 'named' | 'anonymous' | 'none';
  /** Only ever set when `permission` is 'named'. */
  customer?: string;
  /** Year the work was completed, if it may be published. */
  year?: number;
}

export const PROJECTS: Project[] = [
  // Intentionally empty. See the note above before adding anything.
];
