## Parent

Part of #10 — build order item 2 ("Storefront read-side").

## What to build

A visitor browses the shop end-to-end: home, catalog with working filters, and a product page — all server-rendered from the seeded DB, with the prototype's motion layer alive and honest reduced-motion behavior.

## Acceptance criteria

- [x] `/`, `/shop`, `/product/[slug]` render from the DB (Persian slugs); Next-16 async `params` / `searchParams` honored (SPEC §1)
- [x] Shop filters live **only** in searchParams (`/shop?collection=wall&...`); the prototype's sessionStorage-filter design is deleted, not ported (SPEC §8)
- [x] Motion layer as client components: scroll reveals, knot animations, marquee, kenburns, bump, skeletons — per DESIGN.md §3
- [x] `prefers-reduced-motion` turns the motion layer fully off; reveal content keeps its end state with no JS (server-rendered markup)
- [x] Page curtain replays between routes via `Link.onNavigate` (v16 can defer navigation ~420ms), behind the reduced-motion guard
- [x] Visual parity pass against the frozen `.design/` pages

## Blocked by

- Foundations: theme shell, schema, seed
