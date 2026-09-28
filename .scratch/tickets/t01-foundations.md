## Parent

Part of #10 — build order item 1 ("Foundations").

## What to build

`pnpm dev` serves the RTL Persian shell styled entirely from ported design tokens, and one idempotent command brings a fresh SQLite DB to life with the full schema and the whole prototype catalog (with every `.design` data flaw fixed in code). This is the prefactor ticket: schema + seed live here so every later ticket is a narrow slice.

## Acceptance criteria

- [ ] Tailwind v4 `@theme` token port from `.design/assets/styles.css` §2 — color / type / space / motion values; no hand-authored product CSS ships (ADR-0001)
- [ ] Lalezar + Vazirmatn self-hosted via `next/font/local` — zero external font requests
- [ ] RTL root layout (`lang="fa"`, `dir="rtl"`), smooth-scroll opt-in, header/footer shell ported from the prototype
- [ ] Complete Drizzle schema per SPEC §3 — catalog, orders, custom orders, people/auth, content; TEXT + CHECK mirrored as TS unions; SQLite file in WAL mode (ADR-0003)
- [ ] Migration generated with `drizzle-kit generate` (never `db:push` against a live shop)
- [ ] `scripts/seed.ts`, idempotent (skips when products exist): maps `.design/assets/data.js` with every SPEC §8 fix applied in code — single collection axis, new `sets` collection (`rostam-hanger` → plant, `set-khat` → sets), 7-color shared palette after the ink+charcoal merge, 12 products, article + FAQ bodies pulled out of `about.html` into tables, contact info into settings + contact_channels, GEREH10 and flat shipping become settings values not code
- [ ] Seed copies the 13 images + `credits.json` into `images`, and creates the first staff user from `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`
- [ ] Money columns are integer Toman everywhere internal (SPEC §1)

## Blocked by

None (can start immediately).
