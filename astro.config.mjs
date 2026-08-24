// @ts-check
import { defineConfig } from 'astro/config';
import { SITE } from './src/config/site.ts';

// Metal Form — static multilingual industrial site.
// Root `/` is the language selector, so Astro's automatic default-locale
// redirect is disabled and every language lives under its own prefix.
export default defineConfig({
  site: SITE.origin,
  output: 'static',
  trailingSlash: 'always',
  build: {
    inlineStylesheets: 'auto',
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ru', 'hy', 'tr', 'th', 'zh', 'ur', 'ar', 'fa'],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
      fallbackType: 'redirect',
    },
  },
  // The dev toolbar sits over the bottom of the page and gets in the way of
  // design review screenshots; nothing here depends on it.
  devToolbar: { enabled: false },
  // Astro computes a hash for every inline script and style it emits and puts
  // them in a per-page CSP meta tag. Writing the policy by hand in vercel.json
  // instead would block the one inline script that sets the `js` class before
  // first paint — the whole reveal system depends on it.
  // Astro computes a hash for every inline script and style it emits and puts
  // them in a per-page CSP meta tag. Writing the policy by hand in vercel.json
  // instead would block the one inline script that sets the `js` class before
  // first paint — the whole reveal system depends on it.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "form-action 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        // frame-ancestors is ignored in a <meta> policy, so it is sent as a
        // response header from vercel.json instead.
      ],
      styleDirective: {
        // Palettes, stagger indices and reveal delays are all custom properties
        // set as style ATTRIBUTES, which Astro cannot hash — it hashes <style>
        // elements. Scoping 'unsafe-inline' to style-src-attr keeps them
        // working without loosening the stylesheet or script policy. A style
        // attribute cannot execute anything, so the exposure is presentational.
        resources: ["'self'", { resource: "'unsafe-inline'", kind: 'attribute' }],
      },
    },
  },

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
      assetsInlineLimit: 2048,
    },
  },
});
