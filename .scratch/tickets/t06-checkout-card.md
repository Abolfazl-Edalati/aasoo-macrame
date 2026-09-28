## Parent

Part of #10 — build order item 4 (checkout half; card-to-card path).

## What to build

A cart becomes a real Order: phone-OTP → name+address → payment method as client-side steps on one route, the order row exists **before** any payment, and the card-to-card path runs end-to-end — customer declares, staff approve or reject, `/order/[code]` shows live status. The ZarinPal gateway path builds on this next.

## Acceptance criteria

- [ ] `/checkout` one route, client-side steps (phone-OTP → name+address → payment); **no per-step URLs** (SPEC §2)
- [ ] Order row created pre-redirect: `code` = 6-char random confusable-free (no O/0/I/1, DB CHECK, **not id-derived**), address snapshot columns, subtotal/shipping/discount/total_toman + `promo_code`/`promo_percent` snapshots, status `awaiting-payment`; `order_lines` freeze name/size_label/color_label/unit_price_toman with soft FK `product_id ON DELETE SET NULL`
- [ ] Stock decrements **only** on `paid`; customer self-cancel only while unpaid; no partial cancels
- [ ] Card-to-card payment row: path `card`, lifecycle `undeclared → declared → approved | rejected(reason)`
- [ ] Declaration on `/order/[code]`: source-card last-4 + optional bank trace; rejection returns to `declared` on re-declaration; **every** attempt kept in `declarations` (incl. rejected)
- [ ] `/order/[code]` — the Order code's URL, login-gated to the owner, **not nested under `/account`**; shows lines, total, the shared Persian status labels, tracking code once shipped, and the reject reason on card-to-card
- [ ] Order state machine per SPEC §5 enforced in one transition helper, including staff override-approve capability (its UI lands with the admin ticket) and late-money `cancelled → paid` reopen
- [ ] 72h staleness is **computed** from `declared_at`, never stored; stale flag invisible to the customer
- [ ] Money stays integer Toman internally; rial only at a gateway boundary (none in this ticket)

## Blocked by

- Cart: localStorage lines, qty steppers, promo box
- Auth: SMS-OTP customers, staff login, sessions + proxy guards
