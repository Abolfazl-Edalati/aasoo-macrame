# ZarinPal (زرین‌پال) integration facts — research for Gereh checkout

Researched 2026-09-26 against primary sources: the official docs app (VuePress bundle of `zarinpal.com/docs`, since `developer.zarinpal.com` no longer resolves), the official `zarinpal` GitHub org (Node + PHP SDKs, knowledge-base repo), npm registry metadata, and `gh` code search across community plugins. Every claim is cited; two claims are explicitly flagged as unverified lore.

## TL;DR

- Current API is **v4 REST web services** at `payment.zarinpal.com/pg/v4/payment/*.json`. Auth is **just the 36-char `merchant_id` in the JSON body** — no API-key header, no signature.
- Flow is request → redirect (`/pg/StartPay/<Authority>`) → browser returns to `callback_url?Authority=…&Status=OK|NOK` → server-side `verify`.
- **Sandbox exists and needs no approval**: swap the host to `sandbox.zarinpal.com`, use any UUID string as merchant_id.
- **IPN is gone** from the current official docs (it existed in the retired v0.6 API). Recovery of missed verifications is done by polling `unVerified.json`.
- Refunds: **≤30 min** = free, instant `reverse` (needs server IP set on terminal). After that: only via the **new GraphQL platform API with an OAuth Bearer token** — not available to a plain merchant_id.
- Amounts: default unit is **RIAL**; `currency:"IRT"` selects Toman. Our data model is Toman → send `currency:"IRT"` or multiply by 10.
- Everything except live production payments can be built **today**, exercisable end-to-end in sandbox.

## 1. API version and endpoints (v4)

All gateway web services are `POST` with `Content-Type: application/json`, base `https://payment.zarinpal.com`:

| Purpose | Path |
|---|---|
| Create payment (request) | `/pg/v4/payment/request.json` |
| Verify (post-redirect) | `/pg/v4/payment/verify.json` |
| Inquiry status (read-only) | `/pg/v4/payment/inquiry.json` |
| Reverse (instant refund) | `/pg/v4/payment/reverse.json` |
| List unverified successes | `/pg/v4/payment/unVerified.json` |
| Fee preview | `/pg/v4/payment/feeCalculation.json` |

Source: request/verify/inquiry/reverse/unVerified/feeCalculation URLs quoted verbatim on every page of `zarinpal.com/docs/paymentGateway/*` (e.g. [connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html), [Inquiry](https://www.zarinpal.com/docs/paymentGateway/otherMethods/Inquiry.html), [reverse](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/reverse.html), [unVerified](https://www.zarinpal.com/docs/paymentGateway/otherMethods/unVerified.html), [feeCalculation](https://www.zarinpal.com/docs/paymentGateway/otherMethods/feeCalculation.html)).

There is a **second, newer platform API** ("next.zarinpal.com"): OAuth 2.0 (register → OTP initialize → verify → access/refresh token, or full PKCE flow) + a **GraphQL** endpoint `https://next.zarinpal.com/api/v4/graphql/` used for transaction lists, settlements, and **refunds**. This is separate from the v4 payment web services and is not needed for taking payments; it is needed only for API refunds after 30 min and panel-style data access. Sources: [apiDocs/connect](https://www.zarinpal.com/docs/apiDocs/connect.html), [apiDocs/auth](https://www.zarinpal.com/docs/apiDocs/auth.html), [apiDocs/guide](https://www.zarinpal.com/docs/apiDocs/guide.html), [apiDocs/query/sessions](https://www.zarinpal.com/docs/apiDocs/query/sessions.html).

## 2. The redirect flow for a server-side Next.js app

1. **Request.** `POST /pg/v4/payment/request.json` body:
   `{ "merchant_id": "<36-char>", "amount": <int>, "description": "<≤500 chars>", "callback_url": "https://gereh…/api/payments/zarinpal/callback", "currency": "IRT"?, "referrer_id"?: "<affiliate code>", "metadata": { "mobile"?, "email"?, "order_id"?, "auto_verify"?, "additional_data"? } }`
   Field table (required: merchant_id, amount, description, callback_url; `currency` IRR/IRT optional; `metadata` holds mobile/email/order_id) and sample response `{data:{code:100, authority:"…", amount, fee}}`: [connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html). `order_id` inside metadata: same page.
2. **Redirect the buyer.** Put the returned `Authority` at the end of `https://payment.zarinpal.com/pg/StartPay/{Authority}` and redirect (docs show a `Location:` header). In Next.js: `redirect(...)` from the route handler that made the request — never expose the authority in client code. Source: "انتقال خریدار به صفحه پرداخت اینترنتی", [connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html).
3. **Callback.** ZarinPal sends the **buyer's browser** back to `callback_url` with querystring `Authority=…&Status=OK|NOK` (example: `http://www.yoursite.ir/?Authority=A0000000000000000000000000000wwOGYpd&Status=OK`). `NOK` = failed or cancelled by buyer; call verify only on `OK`. Source: "بازگشت به وبسایت پذیرنده", [connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html).
4. **Verify.** `POST /pg/v4/payment/verify.json` body `{ "merchant_id", "amount", "authority" }` — **amount must be read from our DB, never from the querystring**. Success first time: `code:100`, returns `ref_id` (show to user), `card_pan` (masked), `card_hash` (SHA-256), `fee`, `fee_type`. Source: [connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html) verify tables.
5. Resume/incomplete: see §5 (`unVerified.json` polling) — there is no push notification (§6).

**Authority lifetime.** Not stated on the current v4 pages. The request API accepts `additional_data.expire_in` (an error code proves it: "PaymentRequest -40 Invalid extra params, expire_in is not valid." on the [error list](https://www.zarinpal.com/docs/paymentGateway/errorList.html)), and in v0.6 it was minutes — but the exact semantics/default on v4 are **unverified**; ZarinPal support should be asked once we have a terminal. What *is* documented: if verification (auto or manual) doesn't happen "در بازهی زمانی مقرر" the money is **auto-returned to the buyer** ([session-validation](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/session-validation.html)).

## 3. Currency: RIAL vs our Toman model

- Default unit of `amount` is **RIAL**; verify docs literally say "amount Integer مبلغ تراکنش به (ریال)" ([connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html)).
- Optional `currency` field on **request** (and feeCalculation): `"IRR"` (rial, default) or `"IRT"` (toman) — docs show `amount:10000` + `currency:"IRT"` charging "۱۰,۰۰۰ تومان" ([currency](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/currency.html)).
- **Gotcha:** on **verify there is no `currency` field** — verify's amount must match the original transaction's amount **in rial** (the `-50` error "amounts values is not the same" fires on any mismatch). Safest for us: store prices in Toman (data model), but send everything to ZarinPal converted to rial (`×10`) and omit `currency`, so request and verify always agree.
- Minimum/maximum: feeCalculation docs say min **1,000 rial** ([feeCalculation](https://www.zarinpal.com/docs/paymentGateway/otherMethods/feeCalculation.html)); the official Node SDK's request page says min **10,000 rial** ([sdk/nodejs/request](https://www.zarinpal.com/docs/sdk/nodejs/method/request.html)) — discrepancy in the docs themselves. Max: error `-41` "Maximum amount is 100,000,000 tomans" ([errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html)). Our product prices (tens of thousands of Toman) clear any of these.

## 4. Sandbox

Yes — [sandBox page](https://www.zarinpal.com/docs/paymentGateway/sandBox.html): change `https://payment.zarinpal.com/…` → `https://sandbox.zarinpal.com/…`. No account or approval needed: "برای قسمت مرچنت آیدی، یک رشته متنی UUID دلخواه وارد نمایید" (any arbitrary UUID string as merchant_id). All sandbox authorities start with the letter **S**. The official Node SDK exposes it as `new ZarinPal({ merchantId, sandbox: true })` ([sdk/nodejs/configuration](https://www.zarinpal.com/docs/sdk/nodejs/configuration.html)).

Consequence for dev: the callback is a **browser redirect**, not a server-to-server call, so `http://localhost:3000/api/payments/zarinpal/callback` works in sandbox development without any public HTTPS domain. (In production, error `-14` enforces callback-domain match against the registered terminal domain — [errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html).)

## 5. Verification, idempotency, recovery

- **Double verify:** code `100` happens **only once** per transaction; every later `verify` of the same authority returns code `101` "Verified — تراکنش وریفای شده است" — explicitly documented as "transaction was successful and already verified" ([connectToGateway](https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html), [errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html)). So a re-run of the callback is safe: treat 100 as new settle, 101 as already-settled (no double-fulfillment), not as failure.
- **Tamper/amount rules:** verify sends `amount`; mismatch with the paid amount → `-50`. Wrong/not-this-merchant → `-53`. Unknown/expired authority → `-54` ("Invalid authority"), `-51` "session is not active paid try" (payment never completed). ([errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html))
- **auto_verify** ([session-validation](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/session-validation.html)): terminal-level panel setting for automatic vs manual verification, plus per-transaction override `metadata.auto_verify` (boolean; **always beats the panel setting**). `true` → ZarinPal verifies at the bank itself and the money is final without our verify call (callback then only *reads* state via `inquiry`). `false` → we must call `verify`, or the transaction expires and the buyer is refunded. For a shop that must record `ref_id` and prevent "buyer closed the tab" losses, keep panel = automatic **or** set `metadata.auto_verify=true` and still call verify in the callback (it returns 101 harmlessly), plus a poll job as backstop.
- **Recovery polling** = the real replacement for IPN: `POST /pg/v4/payment/unVerified.json {merchant_id}` returns successful-but-unverified payments — sample shows up to **the last 100** with authority + amount ([unVerified](https://www.zarinpal.com/docs/paymentGateway/otherMethods/unVerified.html)). A cron (drizzle job) can verify missed orders by authority.
- **`inquiry.json`** `{merchant_id, authority}` returns status `VERIFIED | PAID | IN_BANK | FAILED | REVERSED` — docs shout: "از این متد به هیچ عنوان برای تایید و وریفای کردن تراکنش استفاده نکنید" (never use for verifying; read-only status) ([Inquiry](https://www.zarinpal.com/docs/paymentGateway/otherMethods/Inquiry.html)).

## 6. IPN (instant payment notification)

**No IPN in the current v4 web services.** The live docs (all 130 routes of `zarinpal.com/docs`) contain no IPN/notification endpoint; the old one lived on `developer.zarinpal.com` (v0.6 era), which today **does not resolve** — DNS NXDOMAIN from our network — and its pages are not recoverable from the Wayback Machine (CDX queries blocked/empty from this region; archive.org snapshots missing). Community plugins from ~2021 still ship `ipn.php` handlers (e.g. Moodle `enrol_zarinpal`, [ar4min/Moodle-Zarinpal](https://github.com/ar4min/Moodle-Zarinpal)) — evidence of the retired feature, not the live one. The official knowledge-base repo (`zarinpal/help.ZarinPal.com`) has no IPN article either.

Practical substitute given we control the full flow: verify-on-callback (§2) + `unVerified.json` polling (§5). That is the documented pattern and it works from an Iranian VPS with no public inbound requirement beyond the browser callback. If true server-push matters later, the OAuth+GraphQL platform API can poll `Session` statuses with `filter` (`PAID`, `VERIFIED`, `TRASH`, `ACTIVE`) — a cron against it is the closest modern equivalent ([sessions](https://www.zarinpal.com/docs/apiDocs/query/sessions.html)).

## 7. Refunds / reversals

- **≤30 minutes after a successful payment:** `POST /pg/v4/payment/reverse.json { merchant_id, authority }` — instant, fee-free return of the money to the buyer; check its result with `inquiry`. Requires **the gateway's server IP to be set in the terminal settings**, otherwise error `-62`. Other codes: `-60` bank can't reverse, `-61` not in success status/already reversed, `-63` 30-minute window expired ([reverse](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/reverse.html), [errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html)).
- **After 30 minutes:** not available via merchant_id web services. The official SDKs implement `Refunds.create` (GraphQL mutation `AddRefund`, `session_id` + `amount` + method `PAYA`/`CARD`, reason enum) against `next.zarinpal.com` with a Bearer token — i.e. an OAuth-authorized app (client_id/secret issued by ZarinPal support). Sources: [SDK source `src/resources/Refunds.ts`](https://github.com/zarinpal/ZarinPal-node-SDK), [apiDocs/guide](https://www.zarinpal.com/docs/apiDocs/guide.html), [apiDocs/auth](https://www.zarinpal.com/docs/apiDocs/auth.html) ("باید مشخصات کلاینت خودتان از جمله client_id و client_secret را از پشتیبانی زرینپال دریافت کنید").
- For Gereh's use case (returns/exchanges likely >30 min old), plan the **panel refund or support ticket** path for v1; treat reverse as the same-day mis-sale tool.

## 8. Merchant onboarding (what the go-live checklist really needs)

From the official KB ([webservice README](https://github.com/zarinpal/help.ZarinPal.com/blob/master/docs/webservice/README.md), [user README](https://github.com/zarinpal/help.ZarinPal.com/blob/master/docs/user/README.md)) and error codes:

1. Register at `my.zarinpal.com` with name + mobile (OTP via USSD/SMS/email).
2. Upgrade account to **Silver (نقره‌ای)**: fill profile + address, upload **color scans of Kart-e Melli (national ID card) and identity page of Shenasnameh** — jpg ≤2 MB, not phone-camera photos (foreign nationals: passport scan; legal entities: company letterhead intro letter with شناسه ملی). Opens ticket "افزایش سطح تایید حساب"; staff approval required. Services usable only from Silver up (errors `-16/-17`: below-silver / blue-level restrictions).
3. Create a **wallet** (Silver: 1,500 T per wallet) and attach a bank account — wallet creation asks for **shaba/IBAN + card number** ([home README](https://github.com/zarinpal/help.ZarinPal.com/blob/master/docs/home/README.md)).
4. Create the **terminal (gateway)** in the panel: site name + **exact website URL**, support phone, category, wallet → triggers ticket "درخواست وبسرویس برای وبسایت"; ZarinPal experts **validate the website and its products** before the gateway becomes usable; merchant_id is issued then. Optional: "با محدودیت IP" (restrict gateway to the server IP — required for `reverse` anyway).
5. Domain: the registered terminal domain must match the **callback URL** domain (error `-14`). ZarinPal docs do **not** list Enamad as a prerequisite for their gateway (Enamad trust-seal is required for Iranian namespaces/INIC, not stated by ZarinPal; flag as "verify with support" rather than inventing a requirement). HTTPS: callback URLs in docs examples use http and https freely; sandbox needs none.

Honest go-live checklist for our spec: national ID + deed scans uploaded and Silver approved → wallet with شبا attached → terminal created for the final Gereh domain → website live with real products (they check it) → support ticket for the web-service approval → set server IP on the terminal → swap sandbox flag off. Timeline unknown (staff review); it is the long pole — start the paperwork in parallel with development, not after.

## 9. Node.js specifics

- **Official SDK exists:** npm [`zarinpal-node-sdk`](https://www.npmjs.com/package/zarinpal-node-sdk) v2.2.0 (latest 2025-07-01; deps only axios + tslib; TypeScript). It links from the docs site ([/sdk/nodejs](https://www.zarinpal.com/docs/sdk/nodejs/installation.html)) and from the official GitHub repo [`zarinpal/ZarinPal-node-SDK`](https://github.com/zarinpal/ZarinPal-node-SDK) ("Official npm package"). Caveat: the npm `maintainers` field is a single personal account (`sefidi`), and the SDK docs pages disagree with the SDK code in places (e.g. `new ZarinPal({merchantId|merchant_id|accessToken})`, `payments.create` vs the docs' "request") — it's official but thin.
- **But plain REST via `fetch` is the better fit for Next.js**: six POST-and-JSON endpoints, no auth header, no signatures — see §1/§2. Zero extra dependency, no axios in the server bundle. Wrap in a small `lib/zarinpal.ts`: `request / verify / inquiry / reverse / unVerified / feeCalculation`, each returning `{ok, code, data, errors}`.
- **Auth model:** v4 web services authenticate by **merchant_id only** (it's in every request body); there is no API key/secret. The OAuth Bearer tokens (§1, platform API) are only needed for GraphQL (refunds >30 min, transactions list, settlements). So the "merchant API key" we're waiting on is literally a single 36-char UUID-ish string in env: `ZARINPAL_MERCHANT_ID`.
- **Community alternatives** (older, v0.6-era — not recommended): `zarinpal` npm (placeholder, 0.0.0), various Laravel/Django packages; they encode the dead `developer.zarinpal.com` API including IPN.

## 10. Error codes that touch our spec

Full list: [errorList](https://www.zarinpal.com/docs/paymentGateway/errorList.html). Notable: `-9` validation (missing merchant/callback/description, description >500 chars, amount out of bounds, bad referrer_id), `-10` bad merchant_id/IP, `-11` inactive terminal, `-12` too many attempts (rate limit — relevant for our poll cron back-off), `-13` terminal limit reached (incomplete documents), `-14` callback domain mismatch, `-15` suspended, `-16/-17` approval-level limits, `-19` transactions banned, `-40` invalid `expire_in`, `-41` max 100,000,000 toman; verify `-50…-55`, reverse `-60…-63`; success codes `100` / `101` (already verified).

`referrer_id` is ZarinPal's **affiliate program** field (affiliate code from their panel) — unrelated to HTTP referer; leave empty ([referrer-id](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/referrer-id.html)). Optional `cart_data` object (items/added_costs/deductions, all amounts **rial**) renders the cart on ZarinPal's pay page — nice UX for a shop, worth using ([checkout](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/checkout.html)). Optional `metadata.card_pan` restricts payment to a pre-approved card ([card-pan](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/card-pan.html)); sending `mobile` enables saved-card/OTP convenience ([card-pan "ذخیره کارت در درگاه"](https://www.zarinpal.com/docs/paymentGateway/moreFeatures/card-pan.html)).

## 11. What can be built before the merchant key exists — everything except live money

Build now, exercisable in sandbox (§4) with a made-up UUID merchant_id and a localhost callback:

1. `lib/zarinpal.ts` REST client (all six endpoints, `ZARINPAL_MERCHANT_ID` + `ZARINPAL_SANDBOX=true|false` env; sandbox swaps host only).
2. Checkout route: order → request.json (amount = Toman×10 rial) → store authority+expected amount on the order → `redirect(StartPay/{authority})`.
3. Callback route: read `Authority`/`Status`, look order up by authority (never trust querystring amount), verify on OK, map `100`→settle, `101`→already-settled, errors→"awaiting/reconcile" state.
4. DB: order payment-status machine splits "awaiting manual verification" (card-to-card, ADR-0004) vs gateway states `paid_via_gateway`; store authority, ref_id, masked card, fee.
5. Reconcile cron: `unVerified.json` → verify missed successes; `inquiry.json` read-only for dashboard status.
6. Reverse endpoint used by admin panel for same-day refunds (will fail in sandbox until server-IP semantics are confirmed live — reverse needs IP set).
7. Fee preview at checkout via `feeCalculation.json` (merchant/payer fee types).

Needs the real key/approval only for: production StartPay with the issued merchant_id, `-14`-clean callback domain, real bank-side verification, reverse on production, anything via the OAuth/GraphQL platform API (post-30-min refunds), and confirming undocumented `expire_in`/authority lifetime with support.

## Open questions to ask ZarinPal support (once terminal exists)

1. v4 `Authority`/`additional_data.expire_in` semantics + default validity window (money auto-returns "within the prescribed time" — what time?).
2. Is any server-to-server notification available on v4 at all, or is `unVerified` polling the sanctioned recovery pattern?
3. Enamad/thishba requirements for a *personal* (حقیقی) account selling handmade goods, and whether the site must be live with products before terminal approval (KB says they validate "the website and its products").
4. OAuth `client_id`/`client_secret` issuance for our own app (for GraphQL refunds >30 min).

## Sources

- https://www.zarinpal.com/docs/paymentGateway/connectToGateway.html (request/redirect/callback/verify tables & samples)
- https://www.zarinpal.com/docs/paymentGateway/sandBox.html
- https://www.zarinpal.com/docs/paymentGateway/errorList.html
- https://www.zarinpal.com/docs/paymentGateway/moreFeatures/currency.html · referrer-id.html · checkout.html · card-pan.html · session-validation.html · reverse.html
- https://www.zarinpal.com/docs/paymentGateway/otherMethods/Inquiry.html · unVerified.html · feeCalculation.html
- https://www.zarinpal.com/docs/apiDocs/connect.html · auth.html · guide.html · query/sessions.html (platform OAuth + GraphQL)
- https://www.zarinpal.com/docs/sdk/nodejs/installation.html · configuration.html · method/request.html · method/verify.html
- https://github.com/zarinpal/ZarinPal-node-SDK (src/Zarinpal.ts, src/resources/Payments.ts, src/resources/Refunds.ts — official SDK source)
- https://registry.npmjs.org/zarinpal-node-sdk (v2.2.0, axios+tslib)
- https://github.com/zarinpal/help.ZarinPal.com (docs/webservice, docs/user, docs/home KB — onboarding & membership levels)
- https://github.com/ar4min/Moodle-Zarinpal (ipn.php — retired IPN, community evidence)
