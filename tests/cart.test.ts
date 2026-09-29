import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validatePromo, type PromoConfig } from "@/lib/promo";
import {
  calculateLinePrice,
  calculateCartTotals,
  type CartLineWithProduct,
  type ShippingConfig,
} from "@/lib/cart-pricing";

describe("validatePromo", () => {
  const activePromo: PromoConfig = {
    code: "GEREH10",
    percent: 10,
    enabled: true,
  };

  const disabledPromo: PromoConfig = {
    code: "GEREH20",
    percent: 20,
    enabled: false,
  };

  it("rejects empty code", () => {
    const res = validatePromo("", activePromo);
    assert.equal(res.valid, false);
    assert.match(res.error, /کد/);
  });

  it("validates correct active promo case-insensitively", () => {
    const resUpper = validatePromo("GEREH10", activePromo);
    assert.equal(resUpper.valid, true);
    assert.equal(resUpper.code, "GEREH10");
    assert.equal(resUpper.percent, 10);

    const resLower = validatePromo("gereh10", activePromo);
    assert.equal(resLower.valid, true);
    assert.equal(resLower.code, "GEREH10");
    assert.equal(resLower.percent, 10);

    const resSpaces = validatePromo("  GEREH10  ", activePromo);
    assert.equal(resSpaces.valid, true);
  });

  it("rejects invalid code with Persian message", () => {
    const res = validatePromo("WRONGCODE", activePromo);
    assert.equal(res.valid, false);
    assert.match(res.error, /معتبر نیست/);
    assert.match(res.error, /WRONGCODE/);
  });

  it("rejects disabled or expired code with Persian message", () => {
    const res = validatePromo("GEREH20", disabledPromo);
    assert.equal(res.valid, false);
    assert.match(res.error, /منقضی یا غیرفعال/);
  });

  it("rejects when no active promo is configured in settings", () => {
    const res = validatePromo("GEREH10", null);
    assert.equal(res.valid, false);
    assert.match(res.error, /معتبر نیست/);
  });
});

describe("calculateLinePrice and calculateCartTotals", () => {
  const shipping: ShippingConfig = {
    flatToman: 90000,
    freeFromToman: 300000,
  };

  it("calculates line price with size delta", () => {
    assert.equal(calculateLinePrice(250000, 0), 250000);
    assert.equal(calculateLinePrice(250000, 40000), 290000);
    assert.equal(calculateLinePrice(250000, -20000), 230000);
  });

  it("calculates totals for empty cart", () => {
    const totals = calculateCartTotals([], shipping, null);
    assert.equal(totals.subtotalToman, 0);
    assert.equal(totals.discountToman, 0);
    assert.equal(totals.shippingToman, 0);
    assert.equal(totals.totalToman, 0);
    assert.equal(totals.itemCount, 0);
    assert.equal(totals.isFreeShipping, false);
  });

  it("calculates totals below free-shipping threshold with flat shipping", () => {
    const lines: CartLineWithProduct[] = [
      {
        id: 1,
        sizeId: 10,
        colorId: "natural",
        qty: 1,
        unitPriceToman: 180000,
      },
    ];

    const totals = calculateCartTotals(lines, shipping, null);
    assert.equal(totals.subtotalToman, 180000);
    assert.equal(totals.discountToman, 0);
    assert.equal(totals.afterDiscountToman, 180000);
    assert.equal(totals.shippingToman, 90000);
    assert.equal(totals.totalToman, 270000);
    assert.equal(totals.itemCount, 1);
    assert.equal(totals.isFreeShipping, false);
  });

  it("calculates totals at or above free-shipping threshold with free shipping", () => {
    const lines: CartLineWithProduct[] = [
      {
        id: 1,
        sizeId: 10,
        colorId: "natural",
        qty: 2,
        unitPriceToman: 180000,
      },
    ];

    const totals = calculateCartTotals(lines, shipping, null);
    assert.equal(totals.subtotalToman, 360000);
    assert.equal(totals.discountToman, 0);
    assert.equal(totals.afterDiscountToman, 360000);
    assert.equal(totals.shippingToman, 0);
    assert.equal(totals.totalToman, 360000);
    assert.equal(totals.itemCount, 2);
    assert.equal(totals.isFreeShipping, true);
  });

  it("calculates totals with active promo discount", () => {
    const lines: CartLineWithProduct[] = [
      {
        id: 1,
        sizeId: 10,
        colorId: "natural",
        qty: 2,
        unitPriceToman: 200000, // subtotal = 400,000
      },
    ];

    const promo = { code: "GEREH10", percent: 10 };
    const totals = calculateCartTotals(lines, shipping, promo);
    assert.equal(totals.subtotalToman, 400000);
    assert.equal(totals.discountToman, 40000); // 10% of 400,000
    assert.equal(totals.afterDiscountToman, 360000);
    assert.equal(totals.shippingToman, 0); // 360,000 >= 300,000
    assert.equal(totals.totalToman, 360000);
  });

  it("re-evaluates free shipping threshold on afterDiscount amount", () => {
    // subtotal = 320,000 (qualifies before discount, but after 10% discount is 288,000 < 300,000)
    const lines: CartLineWithProduct[] = [
      {
        id: 1,
        sizeId: 10,
        colorId: "natural",
        qty: 1,
        unitPriceToman: 320000,
      },
    ];

    const promo = { code: "GEREH10", percent: 10 };
    const totals = calculateCartTotals(lines, shipping, promo);
    assert.equal(totals.subtotalToman, 320000);
    assert.equal(totals.discountToman, 32000);
    assert.equal(totals.afterDiscountToman, 288000);
    assert.equal(totals.shippingToman, 90000); // 288,000 < 300,000 -> flat shipping applies!
    assert.equal(totals.totalToman, 288000 + 90000);
    assert.equal(totals.isFreeShipping, false);
  });
});

describe("getCartSettings and getCartProducts", () => {
  it("loads cart settings from database", async () => {
    const { getCartSettings, getCartProducts } = await import("@/lib/storefront");
    const settings = getCartSettings();
    assert.equal(typeof settings.shippingFlatToman, "number");
    assert.equal(typeof settings.shippingFreeFromToman, "number");
    assert.ok(settings.shippingFlatToman > 0);
    assert.ok(settings.shippingFreeFromToman > 0);
    assert.ok(settings.promo);
    assert.equal(settings.promo.code, "GEREH10");
    assert.equal(settings.promo.percent, 10);
    assert.equal(settings.promo.enabled, true);

    const products = getCartProducts();
    const productKeys = Object.keys(products);
    assert.ok(productKeys.length > 0);

    const firstProduct = products[Number(productKeys[0])];
    assert.ok(firstProduct.id);
    assert.ok(firstProduct.name);
    assert.ok(firstProduct.slug);
    assert.ok(Array.isArray(firstProduct.sizes));
    assert.ok(Array.isArray(firstProduct.colors));
  });

  it("validates promo action against database settings", async () => {
    const { validatePromoAction } = await import("@/app/cart/actions");
    const validRes = await validatePromoAction("GEREH10");
    assert.equal(validRes.valid, true);
    if (validRes.valid) {
      assert.equal(validRes.code, "GEREH10");
      assert.equal(validRes.percent, 10);
    }

    const invalidRes = await validatePromoAction("INVALID_PROMO");
    assert.equal(invalidRes.valid, false);
    if (!invalidRes.valid) {
      assert.match(invalidRes.error, /معتبر نیست/);
    }
  });
});
