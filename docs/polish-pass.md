# Final polish pass — what changed and how it was checked

Not a redesign. The visual identity, the structure, the thirteen chapter
architectures and the "one chain, five stages" concept are unchanged.

## Content

**English editorial pass first**, because it is the factual source every other
language is written from. 228 strings rewritten, 82 removed. The register in
`src/config/claims.ts` is unchanged — nothing was added, and every removal was a
repeat rather than a fact.

Repetition removed at three levels:

- **Whole blocks.** The closing call to action states response time, NDA and
  delivery as three labelled assurances. Every page's `cta.note` and most
  `cta.body` strings said the same two things again a paragraph later, and six
  chapters ended their last section on the response-time promise the call to
  action then repeated. Medical keeps a note, because the thing it says —
  validated manufacture stays with you — is not in the assurances and is the
  most important sentence on the page.
- **Between sections.** `scripts/polish/repetition.mjs` compares every pair of
  blocks in a chapter on content words, with the chapter's own vocabulary
  discounted. It found the Custom triage rail asking seven of the intake
  ledger's questions in the ledger's own words, and the Furniture overture
  answering the question its seventh section is built to answer. Both fixed in
  all nine languages. Every remaining pair is a deeper-detail panel elaborating
  its own visible section, which is the intended relationship.
- **Inside sections.** The Custom "what arrives" atlas repeated the triage rail
  below it almost line for line; it is now drawings and labels. The Medical
  intake block's generic four-step rail — send, read, NDA, quote — is on the
  contact page and in the same chapter's closing note, so it is gone.

**Defensive copy** rewritten positively. "We are not a multinational and we do
not pretend to be" is now a statement about the distance between the person who
reads the drawing and the person who cuts the steel. Two headings that said what
we will not pretend now say what is true, in all nine languages.

**Progressive disclosure tightened.** Every deeper-detail panel now opens
closed. Twelve of the thirteen chapters had the first one open, which put
several hundred words of specification in front of a reader who had not asked
for it.

**Response time.** One promise, stated identically in nine languages: initial
response within 2 business days. No hour count anywhere; `responseWindowDays`
in `src/config/site.ts` is the single source.

## Localisation

Nine languages, `docs/terminology.md` as the internal map. Every rewritten
English string was rewritten in each language rather than translated — clause
order, headline grammar and idiom follow the target language, and the technical
abbreviations engineers actually use stay in Latin script.

Persian thousands separators were dots, which read as decimal points to the same
engineers who read the drawings; 70 of them across 14 files are now commas.
Chinese keeps 万 grouping, which is the native convention and correct.

## Layout

- **Touch targets.** The header's three controls were sized by their glyphs —
  under 25px each on a phone, on the only navigation a twenty-screen chapter
  has. They, the footer columns, the chapter footer nav and the disclosure
  toggles now clear 44px on a coarse pointer, from padding, so nothing changes
  on a mouse. The rules live in the components rather than in the global sheet,
  because Astro's scoping would otherwise outrank them.
- **Desktop measure.** Deeper-detail panels ran to 113 characters a line. Each
  chapter capped its panel at ~82ch, but on the list, whose font is the body
  size, while the type inside is a step smaller — and `ch` is the advance of the
  element's own "0". Capping the `li` puts the constraint where the type is.
  Seven other blocks had the same problem and are fixed the same way.
- **Footer.** The closing offer is gone: it repeated the call to action's button
  and promise one screen later.

## How it was checked

Every script below is in `scripts/polish/` and runs against a preview build.

| | |
|---|---|
| `parity.mjs <locale>` | structural completeness of a translation, and leaves still identical to the English |
| `stale.mjs` | translations that have not caught up with an English rewrite |
| `sync-structure.mjs` | replays English deletions into the eight translations, refusing if the alignment cannot reproduce the new structure |
| `repetition.mjs` | pairs of blocks in a chapter that reach the same conclusion |
| `mobile-qa.mjs` | 390px: docked chrome as a share of the viewport, sideways overflow, sub-44px tap targets |
| `desktop-qa.mjs` | rendered characters per line, measured in the element's own font |
| `bidi-order.mjs` | every Latin run in a right-to-left paragraph, walked character by character |
| `rtl-qa.mjs` | Latin runs adjacent to a neutral character, which is the shape that reorders |
| `reading.mjs` | words in the default browsing layer against words behind a click |

Results: nine locales structurally complete · 0 type errors · 0 serious
accessibility violations across 11 routes including 3 RTL · 0 broken internal
links · 163/163 pages clean in a live browser · 72 mobile routes across four
languages clean at 390px, docked chrome peaking at 13.7% of the viewport · 1,799
Latin runs across 54 right-to-left pages all rendering in written order.
