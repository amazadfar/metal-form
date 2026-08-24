# Metal Form

A multilingual industrial B2B website for **Metal Form** — engineering, tooling,
manufacturing and supply of moulded components.

It has two jobs at once. Read alone, it has to explain a manufacturing business
in about forty seconds. Presented live in a meeting, it has to give a salesperson
obvious talking points and let them jump between verticals in one click.

---

## Running it

```bash
npm install
npm run fonts     # first time only — downloads and self-hosts the type system
npm run dev       # http://localhost:4321
npm run build     # astro check + static build into dist/
npm run preview
```

### Checks

```bash
npm run verify        # type-check, build, content, component audit, links
npm run check:content # structural drift, forbidden claims, untranslated leaves
npm run audit         # hard-coded English, physical CSS, SVG id collisions
npm run check:links   # every internal href resolves (needs a build first)
npm run check:a11y    # axe over 11 routes, three of them right-to-left
npm run smoke         # loads all 163 pages in a browser, all nine languages
npm run og            # regenerates the Open Graph card
npm run shots -- /en/ --full        # design-review screenshots
npm run shots -- /en/ --at .hero    # one section, framed at full size
```

`check:a11y`, `smoke` and `check:links` run against a build:

```bash
npm run build && npx astro preview --port 4322 &
npm run check:a11y && npm run smoke
```

`smoke` is the one that catches what a type-check cannot: a page that throws, a
request that 404s, a `lang`/`dir` that does not match its locale, a missing
canonical or hreflang set, a page with no call to action, a stray `undefined`
from a content key that did not resolve, and horizontal scroll at phone width.

Screenshots run through a clean headless Chromium rather than the desktop
browser — on a machine with forced dark mode enabled the desktop browser inverts
every page and design review becomes meaningless.

**Output is fully static.** 163 pages: a language selector at the root, then
nine languages × (home + industries index + capabilities + about + contact +
thirteen industry chapters), plus `sitemap.xml` and `robots.txt`.

---

## Before this goes live

Everything below is centralised in **`src/config/site.ts`**. Nothing else in the
codebase hardcodes a contact detail or the company name, so setting these is a
single-file change.

| Value | What it is | What it blocks today |
|---|---|---|
| `CONTACT.whatsapp` | WhatsApp number, digits only, international format (e.g. `989121234567`) | **Every primary call to action.** While it is pending, each CTA routes to the contact page instead of opening a broken `wa.me` link. Nothing is visibly broken. |
| `CONTACT.whatsappDisplay` | The same number formatted for display | The number shown on the contact page |
| `CONTACT.email` | Public enquiry address | The email row in the footer and on the contact page; `Organization` structured data |
| `CONTACT.phone` | Public telephone number | The telephone row; structured data |
| `CONTACT.address.line1` / `.city` | Registered address | The discreet address line in the footer, and `PostalAddress` structured data |
| `SITE.origin` | Final production domain (currently `https://metalform.co`) | Canonical URLs, `hreflang` and Open Graph tags |

Channels that are still pending are **not rendered at all** — there are no
placeholder phone numbers or dead links anywhere on the site.

`FEATURES` in the same file switches on modules that need assets or facts the
company does not have yet:

- `realProjectMedia` — real, customer-approved project photography
- `facilityFilm` — a cleared workshop film
- `namedReferences` — named customers or logos, with written permission
- `legalPages` — privacy policy and terms, once approved text exists
- `analytics` — a live analytics endpoint

---

## How it is put together

```
src/
  config/
    site.ts          brand, contact, verified facts, feature flags   ← edit this
    industries.ts    the thirteen verticals: slugs, palettes, motion
    claims.ts        the claim register — what may and may not be said
  i18n/
    locales.ts       nine languages: direction, script, font, optical corrections
    selector.ts      the language selector's own nine-language strings
  content/
    types.ts         the content contract
    index.ts         loader with key-by-key English fallback
    en/ ru/ hy/ …    one folder per locale, identical key structure
  components/
    industries/      thirteen bespoke chapters, one file each
    home/            hero, process rail, pillars
  layouts/
    Base.astro              document, metadata, hreflang, fonts, structured data
    IndustryChapter.astro   the shell all thirteen chapters sit inside
  pages/
    index.astro                        the language selector (the site root)
    [lang]/industries/<slug>.astro     one file per vertical
    [lang]/…                           everything else
  styles/            tokens → base → components
scripts/             fonts, content seeding, integrity check, screenshots
research/            the market research the content was written from
```

### Content

Content is JSON, one folder per locale, mirroring the same key paths. English is
the master: it is authored first, then localised. Because every locale file has
an identical shape, a translator only ever replaces leaf strings — the structure,
and therefore the layout, cannot drift between languages.

A missing key falls back to English at build time and prints a warning in dev, so
a page never renders an empty slot while a translation is outstanding.

**Every human-readable string on the site lives in these files, including the
labels drawn inside the diagrams.** That is why `home.json` has a `diagram`
object and why the pillar figures carry a `figure` object: an SVG `<text>` cannot
wrap, so long labels live in HTML beside the drawing and short ones inside it —
but both are translated.

Run the integrity check before shipping any translation:

```bash
node scripts/check-content.mjs          # summary
node scripts/check-content.mjs --verbose  # lists every untranslated leaf
```

It catches three things: structural drift against the English master; claims that
must never be published (in *any* language — a translator can reintroduce a claim
the English was careful to avoid); and leaves that are byte-identical to English,
which is usually a translation that never happened.

### The claim register

`src/config/claims.ts` is the source of truth for what this company is allowed to
say about itself. Every claim carries a status:

- **confirmed** — stated as fact in the project brief. Safe to publish.
- **industry-context** — true of the industry, not of Metal Form. Usable as
  context, never as a capability.
- **needs-verification** — plausible but unverified. Not published.
- **prohibited** — publishing it would be an overclaim.

The rule the whole project runs on: *public research establishes facts about an
industry; it never establishes a fact about Metal Form.* Where a page quotes an
industry figure — a cavitation band, a drying temperature, an SPI tool class — it
says on the page that this is published industry practice rather than a Metal
Form measurement.

Several chapters end on an explicit statement of what Metal Form does **not** do.
Those sections are not disclaimers bolted on at the end; they are the strongest
credibility instrument on the site, and the Medical chapter is built around one.

### The thirteen chapters

Each vertical has its own page file under `src/pages/[lang]/industries/`, and each
one is four lines: it imports `layouts/IndustryChapter.astro` and its own chapter
component. The layout owns everything shared — the palette applied to the
document, metadata, structured data, the header, the closing call to action,
chapter navigation and the footer — so the chapters read as chapters of one book
rather than thirteen clones or thirteen unrelated sites.

Thirteen page files rather than one dynamic route is a **performance** decision,
not a stylistic one. A single route that imports all thirteen chapters bundles
all thirteen stylesheets into one chunk, and every industry page then downloads
roughly 375 KB of CSS to use a thirteenth of it. Split, each page ships about
24 KB of its own.

Each chapter has its own page architecture: the automotive chapter is composed as
a drawing sheet, the appliances chapter is large-format, the electrical chapter is
built on a pitch comb, the custom-projects chapter is an intake desk. Palettes,
rhythm, composition, motion language and diagram type all differ; the type system,
spacing discipline and interaction quality do not.

To rename or reorder a vertical, edit `src/config/industries.ts` and the matching
content key. Slugs are stable and shareable — a salesperson sends
`/hy/industries/beverage/` to a bottler in Yerevan.

### Typography

Fonts are **self-hosted, not linked**. `fonts.googleapis.com` is unreachable from
both Iran and mainland China — two of this site's actual audiences — so a CDN link
would render the site typeless for the people it is aimed at.

| Script | Family | Why |
|---|---|---|
| Latin, Cyrillic | IBM Plex Sans | The spine. A technical grotesk with a true mono companion on one skeleton. |
| Technical labels | IBM Plex Mono | Designations, tolerances, part numbers, indices. Loaded in every locale, because designations are never translated. |
| Thai | IBM Plex Sans Thai | Drawn against the same skeleton. |
| Arabic | IBM Plex Sans Arabic | Same. |
| Persian | Vazirmatn | An Arabic-first face reads foreign in Persian. |
| Urdu | Noto Nastaliq Urdu | Nastaliq is what Urdu readers expect; Naskh reads as "an Arabic font" to them. It slopes steeply and has deep descenders, so `base.css` sets a line-height floor for Urdu that overrides each chapter's display leading — otherwise consecutive lines collide. |
| Armenian | Noto Sans Armenian | |
| Simplified Chinese | Noto Sans SC | Served as ~100 unicode ranges; a page pulls only the few it needs. |

The Latin face leads **every** stack. A neck designation, a resin grade or a
cavity count stays in Latin characters in all nine languages and should carry the
same skeleton in Tehran as in Yerevan; the script face below it only picks up
characters Latin cannot set.

Only the current locale's script is preloaded — see `src/lib/fonts.ts`.

Re-run `npm run fonts` after changing a family. It is idempotent; existing files
are reused.

### Right-to-left

Persian, Arabic and Urdu run right-to-left. There is **no RTL override
stylesheet**, deliberately — that pattern doubles the CSS surface and the two
copies drift. Instead:

- `dir` and `lang` are set once, on `<html>`, from `locales.ts`.
- Every component is authored in logical properties: `margin-inline-start`,
  `padding-block`, `inset-inline-end`, `border-inline-start`, `text-align: start`.
- Technical drawings carry `data-nomirror` and stay left-to-right. An engineering
  section reads the same way in Tehran as in Yerevan.
- Directional icons flip by class (`data-mirror-icon`), never globally.
- The wordmark is `dir="ltr"`: it is a registered name, not a translatable string.
- Western digits in all nine locales. Persian and Urdu prose commonly uses
  Eastern digits, but technical and commercial writing does not, and a page that
  sets `۴۸ hours` in the hero and `0.15 mm` in the spec table is inconsistent in
  the half that cannot change.

### Colour rules

Two conventions the whole project depends on. Both exist because one value
cannot do both jobs:

- **`--accent` marks, `--accent-deep` sets type.** The mid accent is chosen to
  read as a rule, a stroke or a fill against a near-white surface. At 11px it
  does not clear 4.5:1, so every `color:` uses the deep variant.
- **Inverted blocks flip the whole token family, not just the background.** A
  section that sets `--ink: var(--inverse-ink)` also takes `--accent-inverse`,
  `--signal-inverse` and a `--btn-bg` / `--btn-fg` pair. Remapping only the
  background is how you get a light button with light text on it, or a dark
  orange warning on near-black.

A stepper dims its inactive steps by changing the *marker*, never by fading the
prose — body copy already sits close to the contrast floor, so any meaningful
fade takes it under. That rule lives in `components.css` and overrides each
chapter's own dimming.

`translateX` has no logical equivalent, so anything that must move with the
reading direction multiplies its X by `var(--dir)` (`1` in LTR, `-1` in RTL,
reset to `1` inside `[data-nomirror]` so drawings still travel left to right).

### Motion

Motion is expected to explain something. The tests it has to pass: does it show
the reader a mechanism, a sequence or a relationship they would otherwise have to
be told about? If not, it is removed.

- Scroll reveal and scroll-linked steppers are progressive enhancement. The `js`
  class on `<html>` is what allows anything to be hidden in the first place, so a
  failed script leaves a complete, readable page.
- Steppers advance **discretely**. A mechanism indexes; it does not drift.
- `prefers-reduced-motion` collapses transitions and jumps every sequence to its
  resolved end state, so no information is lost.

### Accessibility

`npm run check:a11y` runs axe across eight routes — the selector, an LTR page,
an RTL page, both flagship chapters, an RTL chapter, contact and capabilities —
with transitions disabled so it measures resolved colours rather than mid-fade
ones, and with every scroll-reveal forced open so hidden content is audited too.

The site currently reports **no serious or critical violations** on any of them.

Horizontal scroll containers get a tab stop, `role="region"` and a name taken
from the nearest heading at runtime (`src/scripts/reveal.ts`) rather than
being annotated thirteen times by hand.

### Analytics

No provider is connected. The wiring is: every CTA, industry link and language
switch carries a `data-analytics` attribute, and `src/scripts/analytics.ts` turns
those into one consistently-named event stream (`cta_whatsapp_*`,
`nav_industry_*`, `page_view`, `scroll_depth`), tagged with locale and route.
Events queue in memory until a provider attaches `window.__mf_sink`. Connecting a
provider is one function, not a sweep through forty components.

---

### Real project media

`src/components/ProjectProof.astro` is the only place a photograph of actual work
may appear, and it renders nothing until three things are true: the
`realProjectMedia` flag is on, `src/config/projects.ts` has an entry for that
vertical with recorded written permission, and the chapter's content file
supplies a `blocks.proof` object with the three strings that go around it.

That last condition is why no chapter carries those strings today: a module that
renders nothing should not put three untranslatable sentences into eight
localisation queues. Whoever adds the first photograph adds the copy with it.

---

## Media policy

Every drawing, diagram and animation on this site is a **schematic**, drawn to
explain engineering. None of it is a photograph of Metal Form equipment,
facilities or completed work, and every figure is labelled as such — in nine
languages, via `common.schematic`.

That is stated plainly in the footer of every page and in the homepage's
"Evidence" section. When real, customer-approved project media exists, switch
`FEATURES.realProjectMedia` on and populate the proof modules; until then those
modules are hidden rather than filled with visible placeholders.

There are no invented client names, no fabricated case studies, no borrowed
certifications and no stock factory photography presented as our own.
