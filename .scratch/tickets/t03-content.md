## Parent

Part of #10 — build order item 2 (content pages).

## What to build

The story pages and the inquiry channel: `/about` reads its articles and FAQ from the DB, `/contact` shows the admin-managed contact channels and takes custom-order inquiries straight into the system, and `/design-system` documents the live tokens.

## Acceptance criteria

- [ ] `/about` renders story, `#knots`, `#faq`, `#journal` — article and FAQ bodies from the `articles` / `faq_items` tables; **no `/journal` routes in v1**
- [ ] `/contact`: channels from `contact_channels` render beside the custom-order form, inline at `#order`, ungated (SPEC §6)
- [ ] The inquiry form files a `custom_order_submissions` row (name, phone, requirements + the optional fields of SPEC §3); anti-spam = honeypot never stored + ~3/hour per-phone cooldown counted from recent rows; no captcha
- [ ] No email address appears anywhere on the built site (ADR-0005, SPEC §6)
- [ ] `/design-system` live token/component doc page, kept reachable

## Blocked by

- Foundations: theme shell, schema, seed
