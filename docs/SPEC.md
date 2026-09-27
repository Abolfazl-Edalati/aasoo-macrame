# Gereh (گِرِه) — build spec

The destination artifact of the [wayfinder map](https://github.com/Abolfazl-Edalati/aasoo-macrame/issues/1): every decision needed to build the shop, synthesized from the closed tickets. Each section names its source ticket; on any conflict, the ticket's resolution comment wins over this digest.

**Read first** (they are already decided — do not re-litigate): `CONTEXT.md` (glossary), `DESIGN.md` (look), `docs/adr/0001..0005` (architecture decisions).

**Shape**: Persian-only, RTL, mobile-aware online macramé shop. DB-managed catalog with a staff admin panel. SMS-OTP customer accounts. Two payment paths (ZarinPal gateway + card-to-card). Custom orders arranged over chat, never on-site. Runs as a **persistent Node process on a VPS in Iran** — serverless-only assumptions are forbidden (ADR-0003).

---

## 1. Stack

| | |
|---|---|
| Framework | Next.js **16.3.6** (App Router, Turbopack default), React 19.2, pnpm |
| Styling | **Tailwind v4**; design tokens move to `@theme` — no product CSS ships (ADR-0001) |
| Data | **SQLite via Drizzle**, file on the VPS; TEXT + CHECK constraints, no native enums (ADR-0003) |
| Money | **Integer Toman** everywhere internal; rial (`Toman × 10`) only at the gateway boundary |
| Auth | SMS OTP (Kavenegar primary, FarazSMS fallback) + DB sessions |
| Payments | ZarinPal v4 REST + card-to-card (ADR-0004; no COD) |

### Next-16 mechanics the build must honor (verified against in-repo docs, route map #9)

- `params` / `searchParams` are **Promises** — `await props.searchParams` in pages; run `next typegen` for typed helpers.
- `middleware.ts` is deprecated → **`proxy.ts`** (nodejs runtime only, no edge). Session-based route guards live there.
- Every parallel-route `@slot` needs an explicit `default.js` or the build fails (v16). Relevant only if the admin drawer is ever added.
- `generateSitemaps`' `id` is `Promise<string>` — await before `Number()`.
- `next lint` removed — the repo already uses the ESLint CLI with flat config.
- v16 no longer overrides CSS `scroll-behavior` during SPA transitions; add `data-scroll-behavior="smooth"` to `<html>` if the prototype's scroll feel should survive.
- **`cacheComponents` stays OFF in v1.** Its `<Activity>` state preservation (docs `guides/preserving-ui-state`, the multi-step-wizard case) is the upgrade path for `/checkout` step retention, but its semantics (mandatory `generateStaticParams` output, `connection()` discipline) are not worth the risk for a 12-product catalog. Revisit post-launch.

## 2. Routes (#9)

Latin structural paths; Persian only inside slugs. No legacy `.html` redirects (nothing is live; the seed rewrites all internal links).

### Storefront

| Route | Notes |
|---|---|
| `/` | Home (`index.html` port) |
| `/shop` | Catalog. **Filters live only in searchParams** (`/shop?collection=wall&...`) — the sessionStorage-filters design in `shop.html` is deleted, not ported |
| `/product/[slug]` | **Persian slug** (`products.slug`) |
| `/cart` | Lines, qty steppers, promo box |
| `/checkout` | One route, client-side steps: phone-OTP → name+address → payment (#4's invisible signup). No per-step URLs |
| `/checkout/callback` | Gateway return only: verifies `Authority` server-side (idempotent — double-verify returns 101, never a failure), redirects to `/order/[code]`. Nobody links here manually |
| `/order/[code]` | The Order code's URL — not nested under the account. Login-gated to the owner; card-to-card **Declaration** happens here |
| `/contact` | Contact channels + custom-order form inline at `#order`, ungated |
| `/about` | Story, `#knots`, `#faq`, `#journal` — articles render as sections from the DB; **no `/journal` routes in v1** |
| `/login` | Customer OTP, `?next=` return param |
| `/account`, `/account/addresses` | Profile, order history, address book (≤5) |
| `/design-system` | Live token/component doc, kept reachable |
| `/sitemap.xml`, `/robots.txt` | Metadata routes built from DB slugs |
| `/uploads/[...]` | Route handler serving gitignored `uploads/{ulid}.{ext}` (survives deploys) |

### Admin (#6 prototype B, #9 tree)

| Route | Notes |
|---|---|
| `/admin/login` | Staff username+password — separate from `/login`; `/admin/*` guard redirects here |
| `/admin` | Home: «محتاج توجه» attention queue (declared/pending payments, 72h-stale) + paid→in-progress→shipped kanban |
| `/admin/orders`, `/admin/orders/[id]` | **Full-page detail in v1**; the drawer from the prototype is deferred (intercepting routes stay purely additive later) |
| `/admin/products`, `/admin/products/[id]` | Draft/publish, image upload, color reassign-before-delete UX |
| `/admin/collections`, `/admin/customers`, `/admin/customers/[id]` | |
| `/admin/custom-orders` | Inquiry inbox; archive/delete only |
| `/admin/settings` | Site settings + contact channels, one page |

No sidebar anywhere: chip-nav top bar, everything rail-like anchored right (RTL).

### SEO surface (#9)

`generateMetadata` on every storefront route — Persian titles (pattern `«نام» — گِرِه`), one **static** sitewide OG image (no per-product OG generation in v1), `noindex` on `/admin/*` and `/checkout/*`. Keyword-level copy and dynamic OG are post-launch.

## 3. Data model (#5, amended by #9)

All SQLite/Drizzle; TEXT + CHECK mirrored as TS unions. Tables:

- **Catalog**: `collections` (wall, plant, decor, textile, **sets**) · `colors` (shared palette — 7 after the ink+charcoal merge) · **`products`** (`slug` unique Persian — seed-generated, staff-editable [#9 amendment]; price_toman, compare_at_toman, stock on the product, status `draft|published`, `dimensions` free TEXT, `is_new`, rating/review_count **decorative** — no reviews in v1) · `product_colors` · `product_sizes` (label + delta_toman, flat — no variant matrix; color never holds stock) · `images` (path, alt, **artist/license credits**) · `product_images` (sorted, first = hero).
- **Orders**: `orders` (customer FK, status per §5, **address snapshot columns**, subtotal/shipping/discount/total_toman, `promo_code` + `promo_percent` snapshots, tracking code, **`code` = 6-char random confusable-free** — no O/0/I/1, DB-checked, **not id-derived**) · `order_lines` (soft FK `product_id` ON DELETE SET NULL + frozen name/size_label/color_label/unit_price_toman/qty) · `payments` (1↔1 order: `path gateway|card`, status per §5, authority/amount_rial/ref_id or last4/trace_code/reject_reason/staff_note/declared_at/approved_at — **stale is computed from declared_at, never stored**) · `declarations` (full history incl. rejected attempts).
- **Custom orders**: `custom_order_submissions` (name, phone, email?, nullable `collection_id`, `is_bulk`, `deadline` CHECK, dimensions_text, description, wants_sample, ip, **`archived_at` — the only lifecycle field**) · `submission_colors`.
- **People/auth**: `customers` (phone unique `^09\d{9}$`, name nullable, no deletion in v1) · `staff_users` (username, argon2id hash, display_name — **no role column**) · `customer_addresses` (label, recipient_name, text min-12, postal_code?; cap 5 in app code, no default) · `otp_codes` (phone **TEXT not FK** — the code precedes the Customer row; code_sha256, attempts, expires_at, consumed_at, ip; **all throttle counters derive by counting recent rows** — no counter tables) · `sessions` (token_sha256, subject_type `customer|staff`, subject_id, 30-day absolute expiry; one table, one cookie, one active identity per browser; **no cart table** — the localStorage cart stands).
- **Content**: `articles` (bodies moved out of `about.html`'s script) · `faq_items` · `settings` (JSON key→value, admin writes wholesale; **shipping = flat national + free-from threshold, two numbers, no province list**; **promo = one active code max**: `{code, percent, enabled}`) · `contact_channels` (type `phone|whatsapp|telegram|instagram`, label, value, enabled, sort).

**Migrations**: versioned `drizzle-kit generate` + `migrate` on deploy — never `db:push` against a live shop.

**Seed**: `scripts/seed.ts`, idempotent (skips when products exist): maps `.design/assets/data.js` → tables **with every fix applied in code** (§8), pulls article bodies + FAQ out of `about.html`, copies the 13 images + `credits.json` → `images`, creates the first staff user from `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`.

## 4. Auth (#4)

- Phone canonical `09xxxxxxxxx` (mobile-only). Input normalization: Persian/Arabic digits → Latin; strip separators; fold `+98`/`0098`/leading-9 into `09…`; validate `^09\d{9}$`, Persian inline error on landlines. Display `09xxxxxxxxx` everywhere.
- **Implicit signup — there is no sign-up flow**: OTP on a fresh number creates the Customer. No account deletion in v1.
- OTP: 6 digits, TTL **2 min**, max **5 attempts**, single-use, one active code per phone, stored **SHA-256 hashed**. Server-side throttles (the countdown is UX only): 60s resend · 5/h + 10/day per phone · 20/h per IP; hour-breach → 1h cooldown, day-breach → 24h. Named constants in one config module. **The code is never returned in an API response.**
- Providers behind one `SmsOtpProvider` interface: **Kavenegar `verify/lookup`** primary (template `gereh-otp`: `گِرِه | کد تأیید شما: %token`; auto prefix failover + voice-call fallback; paid plan required — see §9), **FarazSMS pattern API** cheap fallback (`90008361` shared line, no deposit). 
- Dev mode: `SMS_SEND=false` (default until the plan is bought) runs the full flow and logs the code server-side only; **boot guard refuses to start with `SMS_SEND=false` + `NODE_ENV=production`**.
- Sessions: opaque 256-bit token, hashed at rest; cookie `httpOnly` + `SameSite=Lax` + path `/` (`Secure` once TLS exists); **30-day absolute, no sliding**; logout deletes the row. Staff login replaces the customer identity on that browser (owner ruling). CSRF: SameSite + Next server-action origin check; no state-changing GETs. JWT rejected (single app; instant revocation preferred — reasoning rides ADR-0003).
- Staff: username + **argon2id** password (not phone — no SMS credit burned on daily logins; not email — no inbox, ADR-0005); 10 failures / 15 min per username+IP; seeded first row. 2FA and invited-staff roles stay out of v1.
- Persian error copy: settled verbatim in the #4 resolution ("کد وارد شده صحیح است؟…" block) — lift from the ticket, do not paraphrase.

## 5. Orders & payments (#3, #8, #4)

Two records, never one status soup. **`Order.status`**:

```
awaiting-payment ──(money confirmed)──▶ paid ──▶ in-progress ──▶ shipped ──▶ delivered
      ├─▶ cancelled            (unpaid end)
      └─▶ cancelled-refunded   (staff-only, before shipped; refund itself off-system)
```

- Order row created **before** the gateway redirect / before card-to-card instructions show. Stock decrements **only on `paid`**. Post-paid transitions are staff-marked; `shipped` carries optional tracking code.
- Customer self-cancel **only while unpaid**; no partial cancels; after `shipped` it's an exchange conversation, not a cancel. No `refunding` middle state.
- Clocks (constants, not schema): recovery cron **every 15 min**; gateway auto-cancel **24h** only when the dead-check confirms unpaid; card-to-card auto-cancel **24h if never declared** (declared orders wait for staff); late money **reopens `cancelled → paid`** — staff ship-or-refund.
- **Gateway payment** (`pending → verified | expired`): ZarinPal **v4 REST** — `POST /pg/v4/payment/request.json` (body `merchant_id` + amount + description + callback_url; **no auth header**) → redirect buyer to `https://payment.zarinpal.com/pg/StartPay/{authority}` → browser returns to `/checkout/callback?Authority&Status` → verify **against the DB-stored amount, never the querystring**. `code 100` once; `101` = already settled (idempotent); store `ref_id`, show it on the order. **IPN is retired** — missed callbacks are reconciled by the 15-min `unVerified.json` poll (+ `inquiry.json`). Refunds: `reverse` free ≤30 min; after that OAuth+GraphQL only → v1 does refunds by hand off-system (the `cancelled-refunded` move records intent). Sandbox: host `sandbox.zarinpal.com`, any UUID as merchant_id — **the whole integration is buildable today, before keys**.
- **Card-to-card** (`undeclared → declared → approved | rejected(reason)`): customer declares last-4 of source card (+ optional bank trace); staff check the bank and approve/reject; rejection returns to `declared` on re-declaration — all attempts in `declarations`. **Stale flag at 72h** after declaration (staff prompt, invisible to customer). **Staff override-approve** with note on any unpaid order.
- Customer sees the same Persian status labels both sides + total, lines, tracking once shipped, and the **reject reason** on card-to-card. Internal-only: stale flag, staff notes, declared/undeclared nuance.

## 6. Custom orders & contact (#3, ADR-0002 amended, ADR-0005)

The form (name, phone, requirements) files a row into `/admin/custom-orders`; that is its whole life — **no statuses, no customer-facing tracking, no on-site payment**. Contact channels render beside the form; direct contacts (phone/DM) create no record. Staff disposition: **archive** (stays searchable by phone) or **delete**. Anti-spam: honeypot field (never stored) + per-phone cooldown ~3/hour derived from rows; no captcha in v1. The admin panel is the only inbox — nothing notifies by email/SMS.

**Email: dropped.** The prototype's `hello@gereh.shop` has no channel type and no inbox (ADR-0005) — it appears nowhere in the built site.

## 7. Admin panel (#6, #9)

Prototype B "Queue" (branch `prototype/admin-panel` @ 548b6b8, route `/proto-admin`): chip-nav top bar over the seven areas; home = attention queue + kanban; dense cards in lists; side drawer rejected for v1 in favor of full pages. Reuse `.design` primitives where they carry; new authoring only for admin atoms (queue, kanban, status/stale pills).

## 8. `.design` → app conversion

Port, don't copy: the prototype stays under `.design/` as the frozen visual reference; the app reimplements it in Tailwind v4 (`@theme` tokens, local fonts via `next/font/local`, Lalezar + Vazirmatn — zero external font requests). Motion layer (§3 of DESIGN.md) ports as client components: reveals/knots/marquee/kenburns/bump/skeleton per DESIGN.md; **the page curtain replays via `Link.onNavigate`** (v16 lets it defer navigation ~420ms) with the reduced-motion guard; scroll-reveal classes keep their end-state-under-no-JS behavior via server-rendered markup.

Structural flaws the seed + spec fix (map Notes list, item by item):

| Flaw | Fix |
|---|---|
| category/collection mismatches | single `collection_id` axis; `rostam-hanger` → plant, `set-khat` → **sets** (new collection) |
| inconsistent color lists (shop 5 / contact 7 / data 8) | shared `colors` palette: 8 − ink/charcoal merge = **7** |
| DESIGN.md says 13 products, data has 12 | **12** is truth; DESIGN.md amended (§6) |
| article bodies in a page script | → `articles` table at seed |
| hand-written contact info in `contact.html` | → `settings` + `contact_channels` |
| simulated checkout | → §5 real flows; `GEREH10` / flat-90k-shipping become `settings` values, not code |
| sessionStorage shop filters | die — searchParams (#9) |
| sessionStorage receipt | dies — `/order/[code]` (#9); **cart localStorage `gereh.cart.v1` stays** |

## 9. Deployment — Iranian VPS (ADR-0003; assumptions section)

Target: one persistent Node process behind nginx/Caddy on a cheap VPS (not yet bought — build-time, §10).

- **Process**: `pnpm build && pnpm start` under **pm2** (`pm2 startup` for boot); app port + `NEXT_PUBLIC_BASE_URL` env.
- **DB**: one SQLite file; journal mode WAL. **Backup: nightly `sqlite3 .backup` + 7-day retention + off-box copy (rsync/scp)** — losing `gereh.db` loses the shop.
- **Cron**: system crontab, every 15 min, runs `scripts/cron.ts` → gateway recovery verify (`unVerified.json`), 24h auto-cancel sweeps. Idempotent by design (codes 100/101 make double-verify safe).
- **Uploads**: `uploads/` gitignored, on persistent disk, served by the route handler; included in the backup sweep.
- **Logs**: pm2-logrotate (or journald limits).
- Secrets via env on the box: `ZARINPAL_MERCHANT_ID`, `ZARINPAL_BASE_URL` (sandbox/production swap), `KAVENEGAR_API_KEY`, `SMS_SEND`, `SEED_ADMIN_*`, `DATABASE_PATH`.

## 10. Left for build time (the go-live checklist)

1. Buy VPS + domain; TLS; set `Secure` cookie behavior.
2. Kavenegar **پیشرفته plan** (600K Toman/yr) + submit `gereh-otp` template for approval; flip `SMS_SEND=true`. (FarazSMS first if the plan stalls.)
3. ZarinPal **Silver account** (ID scans) + terminal approval **tied to the final domain** — paperwork starts in parallel with dev, not after it. Terminal approval is the long pole.
4. Real product photos swapped into `uploads/` + credits in the `images` rows; final brand name (swaps the OTP template text; گِرِه is a placeholder).
5. **Ask ZarinPal support** (from #8, parked): v4 authority lifetime / `expire_in`; any server-push notification at all; enamad/shaba requirements for a حقیقی account selling handmade goods; OAuth client for >30-min refunds.
6. Seed run; staff login; sandbox→production payment round-trip test; then the 13 images' licenses' attribution renders on the footer (credits from `images` rows).

---

_Glossary terms this effort added: **Order code**, **Declaration**, **Product slug** (see `CONTEXT.md`). Decisions this doc made at assembly: email dropped (§6); `cacheComponents` off (§1); pm2+system-cron+nightly-backup picks (§9)._
