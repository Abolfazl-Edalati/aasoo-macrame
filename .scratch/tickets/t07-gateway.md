## Parent

Part of #10 — build order item 4 (gateway path).

## What to build

The second payment path: a customer pays online through ZarinPal and comes back to a verified order — fully testable **today** against the sandbox with any UUID as merchant id, before the Silver-account paperwork finishes.

## Acceptance criteria

- [ ] Payment request: ZarinPal v4 REST `POST /pg/v4/payment/request.json` (`merchant_id` + amount + description + callback_url, **no auth header**); amount in **rial** (Toman × 10 — the only boundary where rial exists)
- [ ] Buyer redirect to `https://payment.zarinpal.com/pg/StartPay/{authority}`; sandbox host swap via `ZARINPAL_BASE_URL`
- [ ] `/checkout/callback`: verifies `Authority` + `Status` server-side **against the DB-stored amount, never the querystring**; `code 100` settles, `101` = already settled (idempotent — double-verify is never treated as failure); redirects to `/order/[code]`; nobody links here manually
- [ ] Verified payment flips `awaiting-payment → paid` through the transition helper (stock decrements there); `ref_id` stored and shown on the order
- [ ] Payment row lifecycle `pending → verified | expired`; authority/amount_rial stored on `payments`; **no IPN reliance** (missed callbacks are reconciled by the ops ticket's 15-min `unVerified.json` poll)
- [ ] Refunds stay off-system in v1 (≤30-min `reverse` window not wired; `cancelled-refunded` only records intent)
- [ ] Sandbox round-trip proven with a throwaway UUID merchant id; production keys later are just an env swap

## Blocked by

- Checkout + card-to-card: order creation, Declaration, /order/[code]
