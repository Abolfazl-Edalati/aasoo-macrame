## Parent

Part of #10 — build order item 5 ("Admin"), catalog/content half. Fattest ticket by design (closely-related CRUD); split during implementation if it outgrows one window, rather than paying the coordination cost now.

## What to build

Staff manage everything the shop sells and says: products draft→publish with real image uploads, the shared color palette, collections, customers, the custom-order inquiry inbox, and site settings — all through the panel shell the order-ops ticket established.

## Acceptance criteria

- [ ] `/admin/products` list + editor: draft/publish, price / compare-at / stock on the product, Persian slug (staff-editable), `dimensions` free TEXT, `is_new`, sizes with `delta_toman` (flat — no variant matrix; color never holds stock), image assign + hero ordering via `product_images`
- [ ] Image upload writes `uploads/{ulid}.{ext}` (gitignored, persistent disk, survives deploys); the `/uploads/[...]` route handler serves it; artist/license credits captured on the `images` row
- [ ] `/admin/collections` CRUD (wall, plant, decor, textile, sets)
- [ ] Color management: **reassign-before-delete** UX — deleting an in-use color offers reassignment, never cascades
- [ ] `/admin/customers` list + `/admin/customers/[id]` (profile, order history; no customer deletion in v1)
- [ ] `/admin/custom-orders`: inquiry inbox, **archive or delete only** — `archived_at` is the only lifecycle field; archived rows stay searchable by phone; no statuses, no customer-facing tracking
- [ ] `/admin/settings`: site settings + contact channels on one page, JSON wholesale write (shipping flat + free-from threshold, the one promo code, channel enable/sort)

## Blocked by

- Admin: attention queue, kanban, order ops + Declarations
