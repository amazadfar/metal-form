/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEPLOYMENT ORIGIN
 * ─────────────────────────────────────────────────────────────────────────────
 * Resolved at build time, in this order:
 *
 *   1. PUBLIC_SITE_ORIGIN   — set it explicitly and it wins. Use this on the
 *                             production deployment.
 *   2. VERCEL_URL           — the deployment's own hostname. Preview builds get
 *                             canonicals and hreflang that point at themselves
 *                             rather than at a domain that does not exist yet.
 *   3. SITE.origin          — the intended production domain, from site.ts.
 *
 * The point of (2) is that a client preview should not tell search engines that
 * the canonical version of every page lives at metalform.co. It does not, yet.
 */
import { SITE } from './site.ts';

const env = import.meta.env as Record<string, string | undefined>;

const fromVercel = env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined;

/** The origin this build should present as its own. No trailing slash. */
export const ORIGIN: string = (env.PUBLIC_SITE_ORIGIN || fromVercel || SITE.origin).replace(/\/+$/, '');

/**
 * True only when this build is being served from the intended production
 * domain. Everything else — a preview URL, a branch deployment, a staging host
 * — is kept out of search results rather than competing with the real site.
 */
export const IS_PRODUCTION_ORIGIN: boolean = ORIGIN === SITE.origin.replace(/\/+$/, '');
