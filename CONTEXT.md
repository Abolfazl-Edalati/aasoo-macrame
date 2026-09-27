# گِرِه (Gereh) — macramé shop

A Persian-only, RTL online macramé shop: handwoven pieces sold from a staff-managed catalog, plus made-to-order pieces arranged over chat. Single context; the storefront, the admin panel and the order records are one model.

«گِرِه» is a placeholder brand, not a confirmed one.

## Language

### Selling

**Product**:
One sellable piece in the catalog — a wall hanging, plant hanger, accessory or textile panel.
_Avoid_: item, goods, SKU

**Product slug**:
A product's Persian public URL name. Staff-editable, unique, seed-generated. A name shown to customers, unlike the Order code, which is a quoted reference.
_Avoid_: permalink, id-in-url

**Line**:
A chosen product plus one size and one colour, with a quantity. Cart contents are lines, not products.
_Avoid_: variant row, cart item

**Cart**:
The set of lines a customer is about to order. Empty carts are a normal state, not an error.

**Order**:
A committed purchase of lines by one customer, with an order code and a payment.
_Avoid_: purchase, transaction, booking

**Order code**:
The short human-typed reference shown on an order and quoted in off-site conversations. Random, confusable-free, and never derived from the internal id. A shared reference, not a secret — viewing an order still requires login.
_Avoid_: tracking number, order id, transaction id

**Custom Order**:
A request for a piece to be made — a new design or a repeat of an existing one. The site only captures it (name, phone, requirements) and files it for staff; its whole life (measurement, colour, price, timing) is arranged off-site through the contact channels, and it never takes payment on the site. In v1 it carries no status and no customer-facing tracking — a message in the admin inbox, not a workflow.
_Avoid_: inquiry, request, quote, custom-order tracking

**Card-to-card** (کارت به کارت):
Payment by manual bank transfer. The customer states the last four digits of the card they transferred from; a staff member checks the transaction and marks the order paid.
_Avoid_: manual payment, offline payment, cash on delivery

**Declaration**:
The customer's claim that a card-to-card transfer has been made — the last four digits of the source card, with the bank trace code when they have one. A rejected declaration may be made again; a payment without one is simply undeclared.
_Avoid_: proof, receipt, confirmation

**Gateway payment**:
Payment taken online through the Iranian gateway (زرین‌پال for now). The only automated payment path.
_Avoid_: online payment, card payment

### People

**Customer**:
A person with a phone-verified account. Only customers can order; browsing is open to anyone.
_Avoid_: user, client, buyer, member

**Guest**:
A visitor with no account. May browse; may not order.
_Avoid_: anonymous user, unregistered

**Staff**:
An operator of the admin panel — the shop owner and whoever they invite. Staff manage the catalog, orders, custom orders, customers and contact channels.
_Avoid_: admin (as a person), superuser

**Admin panel** (پنل ادمین):
The staff-facing part of the site. The only inbox: nothing is notified by email or SMS; staff read it there.

**Address book**:
The saved delivery addresses belonging to one customer. Checkout picks from it.
_Avoid_: shipping address (as a stored object)

**Contact channels**:
The shop's reachable lines — phone, WhatsApp, Telegram, Instagram — editable by staff and shown wherever a customer or prospective customer needs to talk.
_Avoid_: social links, contact info

### Ground

**Paper**:
The warm neutral page ground (`#F4F3F0`). Not cream, not beige-as-sea; clay and sage are accents.

**Inverse**:
A section rendered dark by inverting the same token names (`[data-inverse]`), used for the hero and editorial bands. Not a theme toggle.

**Living knot**:
The brand signature: an SVG rope path that ties itself as it enters the viewport.

**Seed**:
The `.design/assets/data.js` content, loaded into the database as starting rows so the shop has a catalog before real photos and prices arrive.
_Avoid_: fixture, demo data

**Source of truth**:
The database, for catalog, orders, customers and contact channels. Authored copy and tokens live in code; product facts do not.
