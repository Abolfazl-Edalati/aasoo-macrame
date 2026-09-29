## Parent

Part of #10 — build order item 3 ("Auth").

## What to build

A customer signs in with just a phone number — OTP on a fresh number silently creates the Customer (implicit signup; there is no sign-up flow) — and a staff member signs in with username + password. Sessions gate routes from `proxy.ts`; the whole flow runs keyless in dev mode.

## Acceptance criteria

- [ ] Phone canonicalization: Persian/Arabic digits → Latin, separators stripped, `+98` / `0098` / leading-9 folded into `09...`, validated `^09\d{9}$`, Persian inline error on landlines (SPEC §4)
- [ ] `SmsOtpProvider`: one interface, Kavenegar `verify/lookup` primary (`gereh-otp` template, auto prefix failover + voice-call fallback), FarazSMS pattern API cheap fallback
- [ ] OTP rules: 6 digits, 2-min TTL, max 5 attempts, single-use, one active code per phone, stored SHA-256-hashed; server-side throttles 60s resend / 5-per-hour + 10-per-day per phone / 20-per-hour per IP, hour-breach → 1h cooldown, day-breach → 24h; named constants in one config module; **the code is never returned in an API response**
- [ ] Dev mode `SMS_SEND=false` (default) runs the full flow and logs the code server-side only; **boot guard refuses to start with `SMS_SEND=false` + `NODE_ENV=production`**
- [ ] `/login?next=` return param; opaque 256-bit session token hashed at rest, `sessions` table with `subject_type customer|staff`, 30-day **absolute** expiry (no sliding), one cookie (`httpOnly`, `SameSite=Lax`, path `/`, `Secure` once TLS exists), one active identity per browser; logout deletes the row; no JWT
- [ ] Session-based route guards in **`proxy.ts`** — not `middleware.ts` (deprecated; nodejs runtime only — SPEC §1)
- [ ] Staff `/admin/login`: username + argon2id password, 10 failures / 15 min per username+IP, seeded first staff row; staff login replaces the customer identity on that browser
- [ ] `/account` profile + order history; `/account/addresses` address book capped at 5 in app code, no default address
- [ ] CSRF posture: SameSite + Next server-action origin check, no state-changing GETs
- [ ] Persian error copy lifted **verbatim** from the #4 resolution comment — do not paraphrase

## Blocked by

- Foundations: theme shell, schema, seed
