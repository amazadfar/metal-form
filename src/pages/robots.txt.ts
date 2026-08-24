/**
 * robots.txt.
 *
 * A preview or branch deployment disallows everything. Only the build served
 * from the production origin invites crawlers and points at the sitemap —
 * otherwise a client preview URL ends up indexed and competing with the real
 * site for the same nine languages.
 */
import type { APIRoute } from 'astro';
import { ORIGIN, IS_PRODUCTION_ORIGIN } from '../config/origin.ts';
import { SITE } from '../config/site.ts';

export const GET: APIRoute = () => {
  const body = IS_PRODUCTION_ORIGIN
    ? [
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${ORIGIN}${SITE.base}/sitemap.xml`,
        '',
      ]
    : [
        '# Preview deployment — not the production origin.',
        '# See src/config/origin.ts.',
        'User-agent: *',
        'Disallow: /',
        '',
      ];

  return new Response(body.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
