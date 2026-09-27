# Gereh (گِرِه) — Earth Boutique · Design System

Version 1.1.0 · Token source of truth: the Tailwind v4 `@theme` in `app/globals.css`
This file documents the design system. The `.design/` prototype (its `styles.css`, `data.js`,
`app.js`) is the **frozen visual reference**; the shipped app is a Next.js 16 port where these
tokens move into `@theme` (ADR-0001). On a visual conflict, the prototype wins; on an
implementation question, `docs/SPEC.md` wins.

An online macramé shop: Persian RTL, a complete purchase flow. Authored as seven static HTML
pages; **shipped as a Next.js App Router site** (routes in `docs/SPEC.md` §2).

```
Home → Shop (filters via URL / sort) → Product (size / color / qty)
                                              ↓
              Cart → Checkout (phone → details → payment) → Order code
                                              ↓
                       Contact / custom order (over chat, no on-site payment)
```

---

## 1. Guiding principles

### 1.1 Paper, not cream

The primary background is a warm neutral paper (`#F4F3F0`) — not a solid beige or cream.
Cream, clay, and olive sage act as **accents, not a sea**. A uniform beige/cream ground is
the visual signature of machine-generated design and makes long reading harder.

Dark mode is not a separate token set on `:root`; the same token names change meaning when
`[data-inverse]` is applied to an inverted element — used for the hero and inverted
editorial sections.

### 1.2 Where color works

The interactive accent comes from exactly one place: clay (`--accent`) — primary button,
links, focus ring, stars, sale badge. Sage (`--accent-2`) is the secondary structural hue:
"new" badges, SVG knots, secondary markers.

No cool grays exist in this system. Every neutral — borders, muted text, shadows — is warm.

### 1.3 Motion must have agency

Every animation does one of three jobs: **state change** (toast, focus, cart bump),
**hierarchy** (cards entering on scroll), or **brand signature** (SVG knots that "tie"
themselves on scroll — this is a knotting workshop). No animation is pure decoration.

---

## 2. Tokens

### 2.1 Palette

| Token           | Light     | Dark `[data-inverse]` | Role                      |
| --------------- | --------- | --------------------- | ------------------------- |
| `--bg`          | `#F4F3F0` | `#191512`             | page ground               |
| `--surface`     | `#FBFAF8` | `#221D19`             | cards, header             |
| `--surface-alt` | `#EAE8E2` | `#2C2621`             | subtle ground, soft hover |
| `--ink`         | `#1B1714` | `#F1EDE6`             | primary text              |
| `--ink-2`       | `#4A423B` | `#CFC6BA`             | secondary text            |
| `--muted`       | `#6F665D` | `#A79C8E`             | labels, captions          |
| `--accent`      | `#A65A38` | `#D98C62`             | clay — interactive        |
| `--accent-ink`  | `#FBFAF8` | `#1B1714`             | text on clay              |
| `--accent-2`    | `#6E7B5E` | `#96A683`             | sage — structural         |
| `--line`        | `#DAD5CC` | `#3A332C`             | borders                   |
| `--success`     | `#4F7146` | `#8FB07E`             | success                   |
| `--error`       | `#9E3B2E` | `#E0705C`             | error                     |
| `--focus`       | `#A65A38` | `#D98C62`             | focus ring                |

Soft fills: `--accent-soft` `rgba(166,90,56,.10)` · `--accent-2-soft` `rgba(110,123,94,.12)`
· `--success-soft` `rgba(79,113,70,.12)` · `--error-soft` `rgba(158,59,46,.10)`.

Contrast: every primary text/ground pair ≥ 4.5:1; large text, icons, and essential
graphics ≥ 3:1. Dark mode was computed **independently** — the dark palette can never be
inferred from the light one.

### 2.2 Typography

Two families, both local in `.design/assets/fonts/` (18 woff2 files, zero external requests):

- **Lalezar** (`--font-display`) — headings, product names, brand. Weight 400 only.
  Never for body copy.
- **Vazirmatn** (`--font-text`) — everything else, weights 300/400/500/600/700.
  Each weight ships as three local subsets: arabic, latin, latin-ext (`unicode-range`).

| Token      | Size  | Use                           |
| ---------- | ----- | ----------------------------- |
| `--fs-100` | 16px  | body text floor — never below |
| `--fs-200` | 18px  | prices, large buttons         |
| `--fs-300` | 20px  | product name                  |
| `--fs-400` | 24px  | section subtitle              |
| `--fs-500` | 32px  | section title                 |
| `--fs-600` | 44px  | hero title (mobile)           |
| `--fs-700` | 60px  | hero title (desktop)          |
| `--fs-800` | 96px  | decorative numerals           |
| `--fs-900` | 128px | display-scale, rare           |

`--lh-body` 1.7 · `--lh-tight` 1.25 · `--measure` 70ch.
Prices set `font-variant-numeric: tabular-nums` (class `.mono-num`) so digits align.

### 2.3 Spacing — unit 8

`--s-1` 4 · `--s-2` 8 · `--s-3` 12 · `--s-4` 16 · `--s-5` 24 · `--s-6` 32 ·
`--s-7` 48 · `--s-8` 64 · `--s-9` 96 · `--s-10` 128 · `--s-11` 160

Arbitrary values are banned. `.section { padding-block: var(--s-9) }` · `.wrap` caps at
`--wrap` = 1200px · `.wrap--wide` caps at `--wide` = 1440px.

### 2.4 Radius and shadow

`--r-0` 0 · `--r-xs` 2 · `--r-sm` 6 · `--r-md` 12 · `--r-lg` 24 · `--r-full` 999.
Oversized radii are forbidden — they read as template work.

Shadows are warm only: `rgba(27,23,20,*)`, max opacity 0.18.
`--sh-1` 0.06 · `--sh-2` 0.10 · `--sh-3` 0.14 · `--sh-4` 0.18. No cold gray shadows.

### 2.5 Motion

| Token            | Value                      | Use                       |
| ---------------- | -------------------------- | ------------------------- |
| `--t-micro`      | 180ms                      | hover, focus, chip        |
| `--t-micro-slow` | 300ms                      | drawer, toast             |
| `--t-macro`      | 400ms                      | card entrance             |
| `--t-page`       | 420ms                      | page-transition curtain   |
| `--stagger`      | 40ms                       | list-item entrance offset |
| `--ease-enter`   | `cubic-bezier(.16,1,.3,1)` | entrances (ease-out)      |
| `--ease-exit`    | `cubic-bezier(.4,0,1,1)`   | exits (ease-in, faster)   |

Iron rule: **transform and opacity only**. Never animate `width`, `height`, `top`, `left`.

---

## 3. Motion layer

### 3.1 Scroll reveals

Three classes activated by `G.observeReveals()` in `.design/assets/app.js` via
`IntersectionObserver`:

- `.reveal` — rises from `translateY(26px)`
- `.reveal-x` — slides from `translateX(var(--rx, -36px))` — for imagery
- `.reveal-scale` — grows from `scale(.92)`

Stagger comes from `style="--i:N"` on each item; the JS loop uses `i % 9` so long lists
reset instead of queueing forever.

### 3.2 Living knots (brand signature)

SVG paths start invisible: `stroke-dasharray` and `stroke-dashoffset` both equal the path
length. On entering the viewport the element gets `is-visible` and `@keyframes tie` drives
the offset to zero — the rope **ties itself**. The length is computed at runtime by
`G.drawKnots()` via `getTotalLength()`; never hand-write that number.

### 3.3 Scene effects

- **Page curtain** `.page-curtain` — on `a[data-nav]` clicks a full overlay rises from
  below (`transform-origin: bottom`) and navigation happens after 420ms. Fully
  class-driven: CSS runs the animation, JS only inserts and navigates.
- **marquee** — `marquee` / `marquee-rtl` depending on direction; content is duplicated so
  `translateX(-50%)` loops seamlessly.
- **parallax** — `.parallax[data-speed]` (default 0.06) on a `requestAnimationFrame`
  scroll loop.
- **kenburns** — hero image breathes `scale(1.001)` → `1.075` over 14s.
- **magnetic** — `.magnetic` buttons tilt toward the pointer (factors 0.18 / 0.28).
- **bump** — `.cart-count` pops at `scale(1.35)` when an item is added.
- **skeleton** — `.skeleton` with `@keyframes sweep` for any wait over 300ms.

### 3.4 `prefers-reduced-motion`

Fully off, not "gentler":

```css
html {
  scroll-behavior: auto;
}
.reveal,
.reveal-x,
.reveal-scale {
  opacity: 1 !important;
  transform: none !important;
}
.knot .rope {
  stroke-dasharray: none !important;
  stroke-dashoffset: 0 !important;
}
.marquee-track,
.kenburns,
.cart-count.bump,
.toast,
.skeleton::after {
  animation: none !important;
}
.page-curtain {
  display: none !important;
}
*,
*::before,
*::after {
  transition-duration: 1ms !important;
}
```

JS mirrors the decision via `matchMedia("(prefers-reduced-motion: reduce)")` in
`initCurtain` and `initMotion`, and uses `scrollIntoView("auto")`. Net effect: a reduced-
motion user gets a complete, fully working, motionless site.

---

## 4. Layout engine

> **Amended per ADR-0001 (docs/SPEC.md §8):** the shipped app ports this system to
> **Tailwind v4** — the layout primitives below become Tailwind utilities/compositions and
> the `od-layout` layer ships in no file. What survives the port unchanged is the *contract*:
> structure utilities separate from product styling, the same class set's capabilities, and
> the same traps restated in Tailwind terms. The description below documents the prototype.

### 4.1 `@layer od-layout` — first in the file *(prototype only)*

The `OD-LAYOUT-PRIMITIVES v1` block: pure structure (display, flex/grid, overflow,
wrapping, ratio). It is placed first so product CSS outside the layer always wins.
In the prototype the block is frozen verbatim; in the port, its **behavior** is frozen —
no component may restyle what a primitive does.

Classes: `.od-stack` `.od-row` `.od-row-top` `.od-cluster` `.od-grid` `.od-fill`
`.od-fixed` `.od-stat` `.od-field` `.od-cell` `.od-tile` `.od-media` (+`.od-media-cover`)
`.od-truncate` `.od-clamp-2/3` `.od-lines-2` `.od-nowrap` `.od-keep` `.od-screen`
`.od-scroll` `.od-rail` `.od-spacer` `.od-touch`.

Two practical traps:

1. `--od-cols` must be a **plain integer** — it feeds `repeat()`; any non-numeric value
   breaks the entire grid.
2. Never set it **inline** on an element — inline styles beat media queries and kill the
   responsive collapse. Change column counts per breakpoint with the project's own grid
   classes below.

### 4.2 Product classes

Grids: `.grid-products` (3 → 2 at 1024px → 1 at 560px) · `.grid-2` (2 → 1 at 768px) ·
`.grid-3` (3 → 2 at 1024px → 1 at 640px) — all overridden inside media queries, the
correct route.
Compositions: `.split` (1.1fr .9fr → one column at 900px) · `.split-side`
(`minmax(0,1fr) 380px` → one column at 900px) · `.stat-strip` (4 → 2 at 900px).
Helpers: `.eyebrow` · `.sample-tag` · `.muted` · `.ink2` · `.center` · `.stack-2`.

Breakpoints: 375 / 560 / 640 / 768 / 900 / 1024 / 1440. Mobile never scrolls horizontally
and never disables zoom. Touch targets ≥ 44×44 (`.od-touch`), with ≥ 8px between adjacent
targets.

---

## 5. Components

- **Buttons** `.btn` — min height 48px, radius `--r-sm`. Variants: `.btn--primary` (clay)
  · `.btn--dark` (ink) · `.btn--outline` · `.btn--quiet` · `.btn--sm` (40px) ·
  `.btn--lg` (56px) · `.btn--block` · `.btn--icon`. Exactly **one** solid primary button
  per view.
- **Product tile** `.tile` (an `<a>` that sets its own `color` and
  `text-decoration: none`) + `.tile-media` (the photo's real ratio via `--od-ratio`,
  `overflow: clip`) + `.tile-body`. Subtitle clamped with `.od-clamp-2`. Price `.price`
  (nowrap, tabular numerals) and `.price-was` (struck through). Badges: `.badge--sale` ·
  `.badge--new` · `.badge--sold`. Stars `.stars` — never color alone, always paired with
  text or a mark.
- **Filters / forms** `.filter-bar` `.filter-group` `.chip` (only state: `is-active`)
  `.field` `.search` `.switch` (≥ 44px) `.summary-box` (form-error summary linking to each
  field). Every input has a **permanently visible** label — a placeholder is never the
  label. Validation fires on blur, not per keystroke.
- **Cart / checkout** `.line` (grid `96px 1fr auto` → `80px 1fr` at 560px) `.qty` stepper
  `.line-actions` `.link-danger` `.sum-table` `.steps` (numbered) `.empty-state`
  `.success-panel` + `.success-ring` + `.order-code`.
- **Overlays** `.scrim` (fixed, `rgba(27,23,20,.5)`) · `.drawer` (explicit enter / exit /
  return) · `.toast-region` + `.toast` (`role="status"`, `aria-live="polite"`) ·
  `.buy-bar` (sticky; content padding reserves its height). No modal or drawer ever
  carries primary-flow navigation; all have a visible way to close.
- **Icons** one family: line SVG, 24px, `stroke-width: 1.5` (`--icon-stroke`),
  `stroke: currentColor`; sizes `.icon--sm` 18px and `.icon--lg` 32px. Filled and outlined
  never mix at one hierarchy level; emoji are never functional icons.
- **States** every functional control has: default · hover (only under
  `@media (hover: hover)`) · focus-visible · `is-active`/selected · loading (`.skeleton`,
  `.is-loading`) · empty · success · error · disabled. Hover never lightens or grays text.

---

## 6. Images

**Measure, then size.** Each file's intrinsic dimensions were probed from disk and
recorded in `.design/assets/img/measured.json`; that exact ratio is set as `--od-ratio` on the
container, so nothing is ever cropped or stretched:

| File                          | w × h     | Ratio (w/h) |
| ----------------------------- | --------- | ----------- |
| `hanging-plants-porch.jpg`    | 1920×1307 | 1.468       |
| `macrame-hanger-set.jpg`      | 1920×1371 | 1.400       |
| `macrame-collar-detail-a.jpg` | 1920×2560 | 0.750       |
| `macrame-collar-detail-b.jpg` | 1920×1440 | 1.333       |
| `macrame-basic-knots.jpg`     | 1920×1440 | 1.333       |
| `macrame-materials.jpg`       | 1920×1440 | 1.333       |
| `macrame-goa-large.jpg`       | 1920×3417 | 0.562       |
| `macrame-textile-panel.jpg`   | 1920×2560 | 0.750       |
| `macrame-knots-diagram-a.jpg` | 1920×1440 | 1.333       |
| `macrame-knots-diagram-b.jpg` | 1920×1440 | 1.333       |
| `macrame-sisal-large.jpg`     | 1109×2278 | 0.487       |
| `macrame-owls.jpg`            | 741×536   | 1.382       |
| `woven-wall-hanging-met.jpg`  | 1920×2605 | 0.737       |

Every image carries `loading="lazy"` plus `width`/`height` attributes (no layout shift).
`.od-media` does the sizing — **never write a CSS `height` on the `<img>` itself**. A
uniform crop is allowed only by setting `--od-ratio` **and** `.od-media-cover` together,
and only for deliberately croppable slots (tile thumbs, decorative fills) — never for
full-frame content.

All photos are real, openly licensed, and localized into the project — no hotlinks.
A few products share one image (13 files, 12 products — the DESIGN text once claimed 13;
the data is truth); the sharing is labeled in the
data, not hidden. To go live: drop your own photos in under the same filenames and record
your own license in `credits.json`.

Licenses (source: `.design/assets/img/credits.json`):

| File                          | Author           | License       |
| ----------------------------- | ---------------- | ------------- |
| `macrame-hanger-set.jpg`      | —                | CC BY-SA      |
| `macrame-knots-diagram-a.jpg` | —                | CC BY-SA      |
| `macrame-knots-diagram-b.jpg` | —                | CC BY-SA      |
| `macrame-collar-detail-a.jpg` | Hy Hill          | CC BY 4.0     |
| `macrame-collar-detail-b.jpg` | Hy Hill          | CC BY 4.0     |
| `hanging-plants-porch.jpg`    | David E. Lucas   | Public domain |
| `macrame-basic-knots.jpg`     | Stilfehler       | CC BY-SA 4.0  |
| `macrame-materials.jpg`       | Stilfehler       | CC BY-SA 4.0  |
| `macrame-sisal-large.jpg`     | Mojmir Churavy   | CC BY-SA 4.0  |
| `macrame-owls.jpg`            | Monika86g        | Public domain |
| `macrame-goa-large.jpg`       | Fredericknoronha | CC BY-SA 4.0  |
| `macrame-textile-panel.jpg`   | Unknown author   | CC BY 4.0     |
| `woven-wall-hanging-met.jpg`  | —                | CC0           |

---

## 7. RTL and text

The product itself stays Persian: `dir="rtl"` with `lang="fa"`. All spacing is logical
(`margin-inline-start`, `padding-block`); there is no physical `left`/`right` in the CSS.

Two rules:

1. **One piece of information per block-level line.** Two sibling `<span>`s never carry
   two values — even inside a `<button>`. A number and its unit (price + تومان, date +
   weekday) stay together in `.od-nowrap`.
2. **Authored copy ≠ data copy.** Authored text (headings, chip labels, button labels) is
   written to a length budget and never truncated or ellipsized — a slogan with an
   ellipsis is not a design. Data text (product names, descriptions, reviews) may clamp
   with `.od-clamp-2/3` in cards and shows in full on detail screens; anything truncated
   must stay reachable with one tap.

Persian digits (۰–۹) and the `٬` thousands separator flow through `G.fa()` / `G.group()`
in `.design/assets/app.js`; the currency unit is تومان.

---

## 8. Accessibility

- **Never color alone.** Every status pairs color with text/icon/shape — badges carry a
  word, errors carry color + message + mark.
- **Focus.** A visible `focus-visible` ring in `--focus` (clay); `.skip-link` is the first
  tabbable element on every page.
- **Accessible names** on all meaningful controls; rating stars use `role="img"` with
  `aria-label="امتیاز … از ۵"`.
- **`aria-live="polite"`** (`role="status"`) for toasts.
- **Motion** per §3.4 — the site is complete and static under reduced motion.
- System font scaling does not break the layout.

---

## 9. File architecture

> **Amended per ADR-0001/0003 (docs/SPEC.md §1, §8):** the prototype tree below is kept
> read-only as the frozen visual reference. The app lives in `app/` (App Router) plus
> `components/` and `lib/`; tokens ship in `app/globals.css`'s `@theme`; fonts load via
> `next/font/local`; catalog content comes from the database, not `data.js`; uploads land
> in gitignored `uploads/`. The `.design` tree is never imported by the app.

```
index.html  shop.html  product.html  cart.html      ← prototype (frozen reference)
about.html  contact.html  design-system.html
DESIGN.md            ← this file
docs/SPEC.md         ← the build spec
.design/assets/
  styles.css         ← prototype tokens + components + motion
  data.js            ← window.GEREH_DATA → becomes scripts/seed.ts
  app.js             ← window.GEREH (cart, filters, reveals, knots, toast, curtain)
  img/               ← 13 photos + measured.json + credits.json
  fonts/             ← 18 woff2 files + fonts.json
```

Three structural rules, ported:

1. **Centralized tokens.** Every color/size/spacing/radius/shadow/duration lives only in
   `.design/assets/styles.css` §2. Pages carry no hard-coded values — only classes and `--od-*`
   variables. A hard-coded value in a page is a bug.
2. **Server-rendered markup, additive client JS** (the prototype's "static HTML, additive
   JS", ported). Content and layout survive with JS disabled (reveals just sit in their end
   state); client components only add behavior. The prototype's `gereh:ready` boot
   dispatcher has no equivalent in the app — React owns mounting, and the motion primitives
   (`initChrome`, `observeReveals`, `drawKnots`, `initMotion`, the curtain) become
   components/hooks.
3. **One motion rulebook.** §3 stays the contract for both trees; `prefers-reduced-motion`
   remains fully off, not gentler.

---

## 10. Data and persistence

> **Amended per ADR-0003/0004 (docs/SPEC.md §3, §5):** the prototype's split between
> `data.js` content and browser storage is inverted in the app — **the database is the
> single source of truth** (products, taxonomy, images, orders, customers, settings,
> contact channels; staff manage it from `/admin`). `data.js` becomes `scripts/seed.ts`.
> Payment is **real**: ZarinPal gateway + card-to-card, no cash-on-delivery. Everything
> below describes the prototype.

Content lives in `.design/assets/data.js`, not in HTML — edit products there.

**Sample-data disclosure:** the brand «گِرِه» (Gereh) is a placeholder, not a confirmed
user brand; prices, stock, dimensions, and colors are samples, editable in the same file;
payment is simulated in the prototype only.

| Key | Prototype | App |
| -------------------------------------- | ---------- | ------------------------ |
| `localStorage:gereh.cart.v1` | persistent cart | **stays** — cart is localStorage only, no cart table (SPEC §3) |
| `sessionStorage:gereh.shop.filters.v1` | session filter state | **dies** — filters live in `/shop` searchParams (SPEC §2) |
| `sessionStorage:gereh.scroll.<page>` | per-page scroll restore | **dies** — App Router owns scroll; `scroll-behavior` note in SPEC §1 |
| `sessionStorage:gereh.cart.receipt` | last-order receipt | **dies** — replaced by `/order/[code]` (SPEC §2, §5) |

Cart lines merge by `{id,size,color,qty}` and clamp to `p.stock`. Promo code `GEREH10`
= 10% and shipping flat 90,000 تومان (free over 300,000) are **seed values in `settings`**,
not constants — one active promo max, flat national shipping (SPEC §3).

---

## 11. Banned (anti-cliché)

These have no place in this system — unless the user explicitly asks:

- a solid warm beige / cream / peach page ground
- purple-gradient washes, or gradients on every background layer
- Inter / Roboto / Arial as a display typeface
- the rounded card with a colored left-border accent as a callout
- an icon beside every heading; multiple solid buttons for one action in a view
- hover states that turn text gray or lighter
- hand-drawn SVG people or scenes as decoration
- invented metrics ("10× faster") or filler copy — placeholders must be labeled
- designer/presenter controls in the shipped product (viewport selectors, demo panels)
- glass effects, neon glows, oversized radii, decorative card stacking

---

## 12. Change map

| You want to change              | Go to                                                                                     |
| ------------------------------- | ----------------------------------------------------------------------------------------- |
| brand color / palette           | `.design/assets/styles.css` §2 — `--accent`, `--accent-2`, and the `[data-inverse]` block |
| display or text face            | `:root` → `--font-display` / `--font-text` + `.design/assets/fonts/`                      |
| spacing rhythm / type scale     | `--s-*`, `--fs-*` (change the token, never the page)                                      |
| motion intensity                | `--t-*`, `--stagger`, and section 3                                                       |
| product prices / stock / images | `.design/assets/data.js` (then `measured.json` for new ratios)                            |
| brand name, phone, address      | `.design/assets/data.js` → `site`                                                         |
| a new component                 | `.design/assets/styles.css`, after the token layer — outside `@layer od-layout`           |
| live token documentation        | `design-system.html`                                                                      |

Every token change should be reflected in this document too — docs and CSS must not drift apart.

> **In the app** (docs/SPEC.md): token changes go to `app/globals.css`'s `@theme`; product
> prices / stock / images and brand/site copy are **database rows managed from `/admin`**
> (seeded by `scripts/seed.ts`), not `data.js` edits.
