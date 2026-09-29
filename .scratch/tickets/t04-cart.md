## Parent

Part of #10 — build order item 4 (cart half).

## What to build

A visitor assembles an order: adds sizes and colors from product pages, reviews and edits the cart, and a single active promo code changes the total. No cart table — localStorage is the contract.

## Acceptance criteria

- [ ] Cart persists in localStorage under `gereh.cart.v1` (SPEC §8: this survives the port; the sessionStorage receipt does not)
- [ ] Add-to-cart from product views with size/color choice; qty steppers and line removal on `/cart`
- [ ] Totals in Toman: subtotal, flat national shipping + free-from threshold read from settings, promo discount
- [ ] Promo box validates against the **one** active code in settings (`{code, percent, enabled}`); disabled/expired code gives a Persian inline error
- [ ] Checkout entry point appears once the cart is non-empty (its target may 404 until the checkout ticket lands)

## Blocked by

- Storefront commerce pages + motion layer
