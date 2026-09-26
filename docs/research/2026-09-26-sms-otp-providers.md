# SMS OTP providers — research findings (2026-09-26)

Research for issue #2: which Iranian SMS API can a Next.js app on an Iranian VPS realistically use for login OTPs. All facts below are from each provider's own site/docs (primary sources), fetched 2026-09-26. Prices in Toman unless noted; Rial figures are the site's own (÷10 = Toman).

## TL;DR

| Provider | OTP API | Entry cost (annual service/panel) | Per SMS | Auth | Notes |
|---|---|---|---|---|---|
| Kavenegar | `POST /v1/{KEY}/verify/lookup.json` | prepaid plans only: پیشرفته 600K Toman/yr, فوق‌پیشرفته 1.2M/yr (OTP is **not** on free/standard tier) | not published (credit-based; example response showed `cost` field) | API key in URL path | Dedicated OTP product; auto line rotation + voice-call fallback; docs Persian |
| FarazSMS | `POST https://api.iranpayamak.com/ws/v1/sms/pattern` | panel 179K Toman/yr (promo; regular 390K) | 145–218 Toman by tier | `Api-Key` header | Docs explicitly say "for OTP use pattern send — instant, never queued"; shared service line 90008361 free, no deposit; Node SDK |
| sms.ir | `POST https://api.sms.ir/v1/send/verify` | panel from 299K Toman/yr | 125–260 Toman | `X-API-KEY` header | Clean REST Verify module; official docs at doc.sms.ir |
| Melipayamak | `POST https://rest.payamak-panel.com/api/SendSMS/SendOtp` + pattern methods | panel 89K–1.49M Toman/yr | 161–247 Toman | username/password or ApiKey, IP allowlist enforced | SendOtp = fixed text "کد تایید شما Code:…"; pattern needs staff approval |
| PayamResan | `GET api.sms-webservice.com/api/V3/SendTokenSingle` | panel-priced (site gates curl behind anti-bot) | n/a | ApiKey in query string | Oldest brand (1300s-era veteran); pattern/token API; weakest modern DX |
| ~~payamso.com~~ | — | — | — | — | **Domain does not exist** (NXDOMAIN on 8.8.8.8, 2026-09-26) |
| ~~300sms.ir / .com / sms300.ir~~ | — | — | — | — | **Do not exist.** Ticket name probably conflates the 3000xxxx line prefix |

**Recommendation: Kavenegar primary, FarazSMS fallback** (reasoning at bottom).

---

## 1. Kavenegar (kavenegar.com)

Source: https://kavenegar.com/rest.html , /pricing.html , /sms/verification , /سوالات_متداول.html

- **OTP API:** `verify/lookup` — `https://api.kavenegar.com/v1/{API-KEY}/verify/lookup.json?receptor=09xxx&token=852596&template=myverification` (GET or POST; JSON/XML). You register a template (الگو) once via panel or `verify/addtemplate.json`; tokens `%token`…`%token20` substituted at send. Template CRUD API exists (`templatelist`, `gettemplate`, `clonetemplate`, `updatetemplate`, `deletetemplate`) with `approvalStatus: PendingReview|Approved|Rejected`.
- **Sender:** you do NOT send from a dedicated number for OTP — Lookup picks the best prefix (1000/2000/3000/5000/9000) automatically, fails over between prefixes <1 min, and can fall back to **voice call (TTS)** to mobiles and even landlines. OTP template declares `sourceType` (0=website, 1=app), `sendMethod`, `fallbackMethod`, optional primary/secondary line.
- **OTP gating (important):** FAQ: "برای ارسال کد اعتبار سنجی OTP کدام سرویس مناسب است؟ قطعا سرویس پیشرفته و فوق پیشرفته، چون سرویس OTP کاوه نگار فقط در آن‌ها فعال است" — Lookup works only on paid plans: **پیشرفته 600,000 Toman/yr** or **فوق‌پیشرفته 1,200,000 Toman/yr** (VIP by negotiation). Standard tier is free but excludes OTP service.
- **Cost per SMS:** not published as a flat rate on the pricing page; account is credit-based (`cost` field per message in responses; historical example 120 Rials = 12 Toman in 2012 docs — current OTP unit price via panel after signup). Filtered/undelivered messages refunded to credit automatically.
- **Activation:** signup at console.kavenegar.com → **5,000 Toman free credit** (50,000 Rials) to test send/receive; no line purchase needed for Lookup testing with shared lines. Dedicated lines (1000xxxx etc.) are a one-time purchase from ~650K Toman (14-digit 1000) up to 585M (7-digit 1000); 2000-prefix renews 70%/yr — **not needed for OTP via Lookup**.
- **Template approval:** templates go through PendingReview→Approved (Kavenegar's own review, no enamad gate documented for OTP templates; `sourceUrl`/`sourceName` fields expected — a real site URL is required in the template record).
- **Limits:** ≤200 messages per API call; ≤500 ids per status call; per-request only — multi-thread allowed; dates unixtime.
- **Integration from Node:** plain HTTPS, API key in path (keep server-side); error = HTTP status + `return.status`/`return.message` JSON (401 account inactive, 403 bad key, 400 params, 402 failed, 405 wrong verb, 409 retry, 413 text too long, 414 too many records). Persian + English docs, official SDKs incl. Node; GitHub github.com/kavenegar. IP-restriction only for report methods (`Select*`) — good fit for a VPS. Status page: status.kavenegar.com. Persian docs; no sandbox magic number — the ticket's "10008xxx" guess matches example line numbers in docs (10004346 sender example, 10008284 in a query example), not a test-injection number; use free credit + your own test handset.
- **Deliverability:** claims <1 min guarantee + ~70% of Iranian SIMs block advertising SMS but OTP bypasses blocking via خدماتی (service) lines. Claims 98% delivery historically.

## 2. FarazSMS (farazsms.com / iranpayamak.com)

Source: https://farazsms.com/price/ , https://docs.farazsms.com/llms.txt , https://docs.farazsms.com/service/post-ws-v1-sms-pattern

- **OTP API:** `POST https://api.iranpayamak.com/ws/v1/sms/pattern` with header `Api-Key` (case-sensitive, NOT in query), JSON body `{code, recipient, attributes, line_number, number_format:"english"}`; recipient `^09\d{9}$`. Docs: "For one-time passwords (OTP / رمز یکبارمصرف): use pattern send — it is instant and never queued" (pattern send = no queue, ~<5s; **non-pattern** sends all go through human approval unless whitelisted). HTTP 201 `Pattern message sent successfully`; every response `{status, data, message}`; 429 over throttle, business errors HTTP 400 with reason in `message`.
- **Rate limit:** **60 requests/min all routes** — fine for OTP; app should still throttle resend 1/min per number client-side (none of the providers do per-recipient OTP cooldown for you).
- **Sender:** shared خدماتی line **90008361** (and 5000125475) auto-activated after panel purchase, **بدون سفته (no deposit)** — recognized consistent short number. Dedicated 9000 service line needs enamad/kasb license/legal entity and ~2 months to activate — skip it; shared line delivers to blacklist-blocked SIMs (اطلاع‌رسانی/خدماتی content only; ads need سیم‌کارت line).
- **Panel pricing (annual):** basic 179K Toman (promo; regular 390K), then 289K/590K/1.5M tiers; per-SMS **خدماتی tariff by tier: 218 / 193 / 169 / 145 Toman** (+10% VAT where noted). Free trial send from panel; cheapest per-SMS from high tiers.
- **Node:** `npm install farazsms` official; OpenAPI 3 + Postman + full llms.txt machine-readable docs at docs.farazsms.com (Persian + English toggle) — best DX of all surveyed.
- **Template approval:** pattern (UID `code`) must be created + approved in panel beforehand; ⚠️ gotcha from docs: if a variable value exceeds the length declared in the panel, the send is **silently rerouted to human approval queue** (response still `success`) — declare generous variable lengths. Delivery truth via `GET /ws/v1/send_request/{id}/items`.
- **Payment:** card gateway (ملت trust badge on site), domestic top-up; no foreign card.

## 3. sms.ir

Source: https://sms.ir/rest-api/ , https://sms.ir/pricing/ , https://sms.ir/feature/پیامک-otp/

- **OTP API:** `POST https://api.sms.ir/v1/send/verify`, header `x-api-key`, JSON `{mobile, templateId, parameters:[{name:'CODE', value:'000000'}]}` — templateId from "برنامه‌نویسان > ارسال سریع" panel (built-in default OTP template exists; unlimited custom templates). No queue; official OTP module page: instant, no queue wait. Bulk endpoint `POST /v1/send/bulk` exists for non-OTP.
- **Pricing:** panels at 299K / 999K / 1.999M Toman tiers listed; per-SMS **"از 125 تا 260 تومان"** depending on tier/line; note: statutory **government levy of 40 Rials (4 Toman)/SMS** collected by operators on top ("سهم دولت", per budget law) — applies to all providers.
- **Sender/lines:** OTP/خدماتی sending requires خط خدماتی; exclusive lines priced from ~100K up to 300M Toman (10-digit 1000/2000/3000 prefixes; dedicated 9000 needs legal docs/enamad — same pattern as FarazSMS). For OTP the shared service line suffices.
- **Node:** REST + official SDKs (their .NET/JS samples shown on docs page); full API reference at doc.sms.ir (Cloudflare-fronted — unreachable from my vantage point but linked from sms.ir); IP-allowlist of sms.ir gateway IPs documented for firewall config (good for Iranian VPS).
- **Approval:** OTP templates reviewed internally; site URL expected; no enamad requirement stated for OTP module activation on a small shop (marketing lines need documents, service content generally doesn't).

## 4. Melipayamak (melipayamak.com)

Source: https://www.melipayamak.com/api/sendotp/ , /api/add-pattern/ , /price/ , /blog/posts/sms-with-pattern-mode/

- **OTP API (dedicated):** REST `POST https://rest.payamak-panel.com/api/SendSMS/SendOtp` (form-urlencoded: username/password or ApiKey, `from`, `to`, `code`) — **fixed text only**: "کد تایید شما / Code: 123456" (code injected; no custom wording). Also legacy SOAP `api.payamak-panel.com/post/Send.asmx/SendOtp`. Errors are negative numbers: -2 no credit, -3 daily send cap, -5 invalid sender, -9 general lines can't send via web service, -12 incomplete account docs, -15 unsubscribe keyword rule, -111 invalid IP, -110 password must be ApiKey, -108 IP blocked after failed attempts.
- **OTP API (modern, recommended path):** "وب سرویس خدماتی (پترن)" — pattern/خط خدماتی اشتراکی methods (`add-pattern`, `get-patterns`, send-by-pattern); reaches blacklisted SIMs; pattern must be **staff-approved** ("منتظر بررسی از سوی کارشناسان"), site URL mandatory inside pattern text, send blocked until status=Approved; pattern UID returned on approval. REST console (کنسول ملی پیامک) is their token-auth REST layer.
- **Pricing:** panels **89K / 189K / 359K / 649K Toman/yr** (+1.49M promo/2.19M حرفه‌ای with a selectable 1000 line), free credit 10K–150K Toman by tier; per-SMS from خط 998: **247 / 225 / 204 / 182 / 161 Toman** by tier (Persian SMS = 70 chars).
- **Node:** official `melipayamak` npm package (username/password constructor, `sms().send()` / otp / pattern helpers), docs in Persian with 14-language samples.
- **Sender:** SendOtp sends from YOUR line (`from` required, shared 5000xxxx service lines included with panel) — sender visible but not brandable; dedicated lines from 50K–90K Toman (998 range) per pricing page.
- **Activation:** panel purchase instant (<1 min claim); business docs needed only for dedicated 9000/خدماتی-اختصاصی lines. Top-up: internal transfer gateway (شبا mentioned on site) + card.

## 5. PayamResan (payam-resan.com) — the actual "payam" panel

- Ticket's "payam SMS (payamso sms panel)" resolves to **payam-resan.com** (api.sms-webservice.com). `payamso.com` and `payamso sms` do not exist (NXDOMAIN).
- **API:** `SendTokenSingle` pattern/token method (`/api/V3/SendTokenSingle?ApiKey=&TemplateKey=&Destination=9121111111&p1=125&p2=45&p3=name`) + `Send` (≤99 recipients per call); docs at doc.sms-webservice.com; samples in curl/C#/OkHttp/Python; WooCommerce/Digits OTP plugins.
- **Cons:** ApiKey in query string (leaks into logs), HTTP endpoint shown alongside HTTPS, WordPress-era site with bot-wall (403 for plain curl), no public rate/plan table — weakest developer experience of the group. Not recommended as primary/fallback; fine as proof that a 6th option exists.

## 6. "300SMS" and "MobPayam"

- `300sms.ir`, `300sms.com`, `sms300.ir`, `mobpayam.com`, `mobpayamak.com` → **NXDOMAIN / dead** (checked via Google DNS 8.8.8.8 on 2026-09-26). The name is likely a confusion with the **3000xxxx line prefix** that Kavenegar/FarazSMS/sms.ir all sell. No mainstream OTP provider by these names exists today; mainstream set is the five above (+ niche ones like Ideall/Sms780/Magfa acting as resellers).

## 7. Cross-provider facts a dev needs

- **Enamad/samandehi:** none of the surveyed providers require enamad for OTP (خدماتی) sending **over a shared service line** — the gate is: OTP/verification content is service traffic, not ads. Enamad/kasb-license/legal-entity docs only needed for dedicated 9000/2000 "خدماتی اختصاصی" lines or converting a line ads→service. A small macramé shop without enamad can send login OTPs on shared lines everywhere.
- **Blacklist:** ~70% of Iranian SIMs block ads (Kavenegar FAQ figure). OTP via lookup/pattern/verify bypasses this on all five providers because it rides خدماتی lines — this is exactly why the dedicated OTP/pattern API (not `send`/bulk) must be used.
- **Per-number OTP resend limits:** none publish a hard "1 resend/min per receptor" server rule — only global request throttles (Faraz 60 req/min). Implement resend cooldown + max attempts per number in the app.
- **Payment:** all accept domestic methods (shaparak card gateway, card-to-card, شبا; Kavenegar issues فاکتور رسمی on request; Melipayamak has a deposits API for agents). **No provider needs a foreign credit card** — confirmed from signup/pricing flows described on their sites. Prices +10% VAT possible.
- **Delivery refunds:** filtered/undelivered credit refunds: Kavenegar yes; Faraz yes for blacklist; Meli yes.
- **Sender ID (OTP):** none give a custom alphanumeric sender-ID on Iranian domestic lines (that's an international feature) — OTP arrives from the line prefix (1000xxxx / 90008361 / 5000xxxx) or your dedicated number. Users will see a number, not "GEREH". Consistent sender matters for trust — Kavenegar rotates prefixes (their design, with fallback), Faraz 90008361 is stable and memorable.
- **Character budget:** Persian = 70 chars/SMS (UTF-16, 2 bytes/char; all providers confirm); an OTP like "کد تأیید: 123456 — گره" fits one part easily.

## 8. Conclusion

**Primary: Kavenegar.** It is Iran's de-facto OTP API: purpose-built `verify/lookup` with template CRUD API, no-queue highest-priority delivery guarantee (<1 min), automatic failover across prefixes and to voice-call TTS (works even for landlines and unreachable numbers), international coverage if Gereh ever ships abroad, long track record (customer logos on pricing page: Mofid brokerage, Ayoo, FonePe, Iran Medical Council), public status page, no foreign-card payment, 5K Toman free dev credit, and Persian docs with a Node-friendly plain-JSON REST (key in path, clean error codes). Its real costs for this project: 600K Toman/yr پیشرفته plan + per-SMS credit (~200 Toman/SMS order of magnitude at Iranian market rates; exact OTP unit price shows in panel after signup). For an auth-critical feature, the reliability engineering (fallback chain) is what you're buying.

**Fallback: FarazSMS.** If the annual OTP-plan gate or Kavenegar unit pricing hurts, FarazSMS is the pragmatic swap: cheapest honest entry (panel 179K/yr promo + 145–218 Toman/SMS), shared خدماتی line 90008361 activated instantly with **no deposit and no enamad**, pattern API that its own docs are explicitly written for OTP ("instant, never queued"), stable recognizable sender, 60 req/min headroom, and the best integration surface of the entire survey (`Api-Key` header, OpenAPI spec, llms.txt, npm `farazsms`). Keep `POST /ws/v1/sms/pattern` behind the same internal `SmsOtpProvider` interface so Kavenegar ⇄ FarazSMS is config-level.

**Watch-outs (either):** approve the OTP template early (human review both), declare generous variable lengths on Faraz (over-length silently queues), implement resend throttling in-app, and keep API keys server-only (Faraz header / Kavenegar path — never client).
