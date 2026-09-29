export type CartLineWithProduct = {
  id: number;
  sizeId: number | string;
  colorId: string;
  qty: number;
  unitPriceToman: number;
};

export type ShippingConfig = {
  flatToman: number;
  freeFromToman: number;
};

export type ActivePromoDiscount = {
  code: string;
  percent: number;
};

export type CartTotals = {
  subtotalToman: number;
  discountToman: number;
  afterDiscountToman: number;
  shippingToman: number;
  totalToman: number;
  itemCount: number;
  isFreeShipping: boolean;
};

/**
 * Line price = base product price + size delta
 */
export function calculateLinePrice(basePriceToman: number, sizeDeltaToman = 0): number {
  return Math.max(0, basePriceToman + sizeDeltaToman);
}

/**
 * Calculates cart totals according to SPEC §8 / prototype cart.html:
 * - Subtotal = sum(unitPriceToman * qty)
 * - Discount = round(subtotal * percent / 100) if active promo
 * - AfterDiscount = subtotal - discount
 * - Shipping = 0 if subtotal == 0, else 0 if afterDiscount >= freeFromToman, else flatToman
 * - Grand Total = afterDiscount + shipping
 */
export function calculateCartTotals(
  lines: CartLineWithProduct[],
  shipping: ShippingConfig,
  promo: ActivePromoDiscount | null = null
): CartTotals {
  const itemCount = lines.reduce((acc, line) => acc + (line.qty || 0), 0);
  const subtotalToman = lines.reduce(
    (acc, line) => acc + (line.unitPriceToman || 0) * (line.qty || 0),
    0
  );

  const discountToman =
    promo && promo.percent > 0
      ? Math.round((subtotalToman * promo.percent) / 100)
      : 0;

  const afterDiscountToman = Math.max(0, subtotalToman - discountToman);

  const shippingToman =
    subtotalToman === 0
      ? 0
      : afterDiscountToman >= shipping.freeFromToman
      ? 0
      : shipping.flatToman;

  const isFreeShipping = subtotalToman > 0 && shippingToman === 0;
  const totalToman = afterDiscountToman + shippingToman;

  return {
    subtotalToman,
    discountToman,
    afterDiscountToman,
    shippingToman,
    totalToman,
    itemCount,
    isFreeShipping,
  };
}
