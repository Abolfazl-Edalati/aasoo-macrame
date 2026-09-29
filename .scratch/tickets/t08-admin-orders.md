## Parent

Part of #10 — build order item 5 ("Admin"), order-operations half. Builds on card-to-card orders alone — deliberately does **not** wait for the gateway ticket; gateway-pending rows just land thinner until then.

## What to build

Staff run the shop from the panel: the home queue surfaces what needs attention, the kanban tracks fulfillment, and order detail is where Declarations get approved or rejected and post-paid transitions get marked. The admin panel is the only inbox (ADR-0005).

## Acceptance criteria

- [ ] Gated by the existing staff-session guard on `/admin/*`
- [ ] `/admin` home: «محتاج توجه» attention queue — declared payments awaiting review, 72h-stale declarations (computed from `declared_at`), unpaid gateway-pending orders — plus the paid → in-progress → shipped kanban (SPEC §7, prototype B "Queue")
- [ ] `/admin/orders` dense list; `/admin/orders/[id]` **full-page detail** — the prototype's side drawer is deferred, intercepting routes stay purely additive later
- [ ] Declaration review: approve / reject with reason (reason visible to the customer); **staff override-approve** any unpaid order, with note
- [ ] Post-paid staff transitions: in-progress, shipped (+ optional tracking code, shown to the customer), `cancelled-refunded` records intent only (refund itself off-system; staff-only, before shipped)
- [ ] Chip-nav top bar over the areas, everything rail-like anchored right (RTL), **no sidebar anywhere**; new admin atoms (queue, kanban, status/stale pills) reuse `.design` primitives where they carry
- [ ] Nothing notifies by email/SMS — the panel is the whole signal path

## Blocked by

- Auth: SMS-OTP customers, staff login, sessions + proxy guards
- Checkout + card-to-card: order creation, Declaration, /order/[code]
