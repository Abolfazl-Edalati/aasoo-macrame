## Parent

Part of #10 — build order item 2 (SEO surface) and item 6 ("Sweep").

## What to build

The site is discoverable, the money reconciles while nobody watches, and the app runs on the VPS: sitemap and robots built from DB slugs, metadata on every storefront route, a 15-minute cron that finds missed gateway callbacks and cancels dead orders, and the pm2 + backup deploy shape.

## Acceptance criteria

- [ ] `/sitemap.xml` + `/robots.txt` metadata routes built from DB slugs; only **published** products listed; `generateSitemaps`' `id` is `Promise<string>` — await before `Number()` (SPEC §1)
- [ ] `generateMetadata` on every storefront route: Persian titles («نام» — گِرِه pattern), one **static** sitewide OG image (no per-product OG generation in v1)
- [ ] `noindex` on `/admin/*` and `/checkout/*`
- [ ] `scripts/cron.ts` run every 15 min from the system crontab: gateway recovery via `unVerified.json` (+ `inquiry.json`), 24h auto-cancel of unpaid gateway orders **only when the dead-check confirms unpaid**, 24h auto-cancel of card orders **never declared** (declared ones wait for staff); idempotent (codes 100/101 make double-verify safe)
- [ ] Late-money path proven: `cancelled → paid` reopen on a verified late payment (staff ship-or-refund)
- [ ] Deployment files per SPEC §9: pm2 config (+ `pnpm build && pnpm start`, `pm2 startup` note), nightly `sqlite3 .backup` with 7-day retention + off-box copy including `uploads/`, logrotate (or journald limits), env inventory (`ZARINPAL_MERCHANT_ID`, `ZARINPAL_BASE_URL`, `KAVENEGAR_API_KEY`, `SMS_SEND`, `SEED_ADMIN_*`, `DATABASE_PATH`, `NEXT_PUBLIC_BASE_URL`)
- [ ] Image-license credits from `images` rows render as footer attribution

## Blocked by

- Storefront commerce pages + motion layer
- Content pages from DB: about, contact + inquiry, design-system
- ZarinPal gateway path: request, redirect, idempotent verify
