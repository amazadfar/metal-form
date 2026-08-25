# Metal Form — art direction

One design system, thirteen chapters. This is the contract: what never changes,
what changes per vertical, and where each of those lives.

If you are editing an industry chapter, read the whole of this file first. Most
of the decisions you are about to make have already been made here, once, so
that thirteen pages cannot drift apart.

---

## 1 · What never changes

The brand is carried by these, and a chapter may not restate or override them:

| | Where it lives |
|---|---|
| Type scale, leading, tracking, per-script stacks | `src/styles/tokens.css` |
| Spacing rhythm, container widths, radii, hairlines | `src/styles/tokens.css` |
| Buttons, eyebrows, plates, badges, capability modules, spec rows, disclosures | `src/styles/components.css` |
| Layout primitives — `.shell*`, `.split`, `.scroller`, `.t-statement` | `src/styles/base.css` |
| Grounds, textures, chapter rhythm | `src/styles/chapters.css` |
| Header, footer, chapter navigation, closing call to action | shared components |

Corners are near-square (`--r-1` is 2px). Colour is structural — an accent
**marks**, `--accent-deep` **sets type**. Rules and one-pixel relief carry the
technical register; drop shadows do not. Every inline direction is logical, so
right-to-left is a property of the document rather than a stylesheet of
overrides.

---

## 2 · The three grounds

A band on this site sits on one of three grounds. They are declared per vertical
in `src/config/industries.ts` (`art.ground`) and implemented once in
`chapters.css`.

**`ground--light`** — the vertical's own near-white surface. For chapters whose
argument is precision and cleanliness: medical, cosmetics, consumer products,
plumbing, custom.

**`ground--steel`** — the vertical's `inverse` colour, a near-black with that
sector's cast. For chapters whose argument is structure, mechanism and mass:
automotive, chemical, electrical, marine. A drawing on steel reads as a
blueprint, which is the right register for a toolmaker.

**`ground--tint`** — a saturated bed mixed from the vertical's own accent. For
chapters where the sector's colour *is* the identity: the blue of a bottling
hall, the green of an irrigation field, the warmth of a furniture workshop.

`ground--steel` and `ground--tint` remap the **entire** token set — ink, muted
ink, rules, accent, signal, focus ring, and the solid and WhatsApp buttons. Add
the class; do not restate the colours. Restating them is how a band ends up with
an accent that was measured against a near-white page.

Both dark grounds also need the site header in its light state over them. The
chapter layout does that automatically from `art.ground`.

---

## 3 · The seven textures

`data-tex="…"` on any element applies a surface treatment as a `::before`
layer. Each is taken from the sector's own material, not chosen for variety:

| | What it is |
|---|---|
| `dot` | a cavity array seen from above |
| `hatch` | section hatch — cut steel, at the 45° a drawing uses |
| `wave` | a swell — anything that moves fluid |
| `comb` | pitch comb — contacts at a repeated centre distance |
| `grain` | cast grain — surfaces that are not polished |
| `mesh` | structural mesh — a large panel and its ribbing |
| `sheen` | a show surface catching light (**cosmetics only**) |

**A texture must be felt before it is seen.** If a reader can describe the
pattern, it is too strong. Tune with `--tex-opacity`, never by editing
`chapters.css`.

Use one texture per chapter, on at most two large surfaces. A page with four
textures has none.

---

## 4 · The four hero archetypes

Thirteen chapters previously opened with the same composition: eyebrow, big
headline, lead paragraph, chip row, line drawing floating in the right-hand
column. Different text, same page. `art.hero` assigns each chapter one of four:

**`split`** — copy and figure as two columns. The default, and the one that has
to work hardest not to look generic: the statement carries the composition, the
figure is large, and the two are not the same width.

**`stacked`** — the statement runs full width across the top; the figure sits
full-bleed beneath it. Use where the drawing is wide (a bottle line, a hull, a
panel).

**`plate`** — the figure is a framed plate, and the copy sits against it at a
deliberately uneven ratio. Use where the drawing is a document: a drawing sheet,
a section, an engineer's desk.

**`index`** — the figure is a catalogue: a grid of parts, cavities, fittings or
contacts, read as an index rather than as a single object.

---

## 4b · Progressive disclosure

An industry chapter is the second level of the site and is allowed to be deep.
It is not allowed to make every visitor read that depth to find out whether this
company can make their part. Two people arrive on the same URL: a production
engineer who wants the cooling-layout argument, and an owner who wants to know
whether to send a drawing.

So each section carries **one headline, one short statement, and one artefact** —
a drawing, a figure, a number — and the reasoning behind it sits in a
`<TechNote>`:

```astro
<TechNote locale={locale} kind="reasoning">
  …the argument, the procedure, the table, the sources…
</TechNote>
```

`kind` picks a label from `common.disclose`, so it is a real phrase in all nine
languages: `detail`, `reasoning`, `calculation`, `why`.

**What never goes behind a disclosure**

* the section's heading and its lead
* the sentence that says what Metal Form *does* about the problem — a chapter
  that explains a problem beautifully and hides its answer has it backwards
* the responsibility boundary: what Metal Form supplies and what stays with the
  customer, on every chapter that has one
* source attributions
* **any block carrying `data-station-step`.** These drive a scroll-linked
  figure; collapsed, the block never enters the reading window and the drawing
  never advances. `npm run audit` fails on this.

`node scripts/collapse-block.mjs <Chapter>.astro <class> [kind] [--all]` does the
wrapping and balances the tags. `npm run check:density` reports, per chapter,
how many words a reader meets before opening anything.

The target is roughly a third of the words visible by default. It is a
hierarchy, not a quota — and it is measured on words a reader actually meets,
not on page height.

---

## 5 · Rules a chapter must not break

1. **Logical properties only.** `margin-left` does not mirror;
   `margin-inline-start` does. There is no right-to-left override stylesheet in
   this project by design. This includes the physical edges of the `padding` and
   `margin` four-value shorthands — `padding: 1rem 1rem 2rem 0` puts its zero on
   the physical left and does not mirror. Use `padding-block` / `padding-inline`.
2. **No hard-coded English.** Everything a visitor reads comes from the content
   JSON, or it stays English in all nine languages.
3. **`data-nomirror` on every technical SVG.** A drawing reads the same way in
   Tehran as in Yerevan.
4. **SVG definition ids are prefixed per chapter** (`av-`, `med-`, `bev-` …).
   `url(#hatch)` resolves to the first match in the document.
5. **Labels are HTML, not SVG `<text>`,** wherever the string can run long. SVG
   text cannot wrap, and a Russian or Armenian translation runs ~15% longer than
   the English it was laid out against.
6. **A rule that divides two columns needs `--col-pad` on both sides of it.**
   Padding only the trailing edge leaves the next column's first character
   sitting on the line. Reset it to `0` on `:first-child` so the grid still
   starts flush with the gutter.
7. **Two columns stack below 1000px.** Use `.split`, or reimplement it exactly.
   A 46ch paragraph beside a figure needs about 1000px before it stops being a
   column and starts being a gutter.
8. **Anything that scrolls sideways does it inside `.scroller`,** never by
   pushing the page. A scroll container that is also a grid or flex item
   defaults to `min-width: auto` and will happily be wider than its track.
9. **No invented numbers.** Every figure on the site is in `FACTS`
   (`src/config/site.ts`) or in content that has been through the claim register
   (`src/config/claims.ts`). An illustrative percentage is worse than no number.
10. **Verified capability is set to be read.** A tracked-out 11px monospace strip
    reads as build metadata and gets skipped. Use `.badge` / `.badges` inline, or
    `.caps` / `.cap` for a module with a qualification under it.

---

## 6 · Motion

Sparingly, and always for a reason. Four easings in `tokens.css`; `--ease-mech`
is for anything that represents a mechanism — a clamp, a slide, a tool closing.

Scroll-linked steppers are driven by `initSteppers` in `src/scripts/reveal.ts`
and are deliberately **not** IntersectionObserver-based: a band has an edge, and
a reader nudging the wheel near that edge strobes the drawing between two
stages. The replacement uses a tall reading window, hysteresis and a short
dwell. `npm run check:steppers` drives every page in 40px increments and fails
on any reversal.

Under `prefers-reduced-motion`, transitions collapse and scroll-linked sequences
resolve to their end state. Nothing is ever lost, only stilled.

---

## 7 · Checks

```
npm run check          # types
npm run check:content  # claim register + key parity across nine locales
npm run audit          # hard-coded English, physical CSS, duplicate ids, mirroring
npm run check:links    # every internal link and fragment
npm run check:gutters  # every ruled column clears its divider, measured in pixels
npm run check:steppers # no scroll-linked stepper reverses under slow scroll
npm run check:a11y     # axe, including contrast, across representative routes
npm run check:density  # how much a reader meets before opening anything
npm run smoke          # every page in every language in a real browser
```
