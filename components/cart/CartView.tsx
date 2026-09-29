"use client";

import React, { useState, useEffect, useSyncExternalStore, useTransition } from "react";
import Image from "next/image";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { CartProductInfo, CartSettings } from "@/lib/storefront";
import {
  getCart,
  subscribeCart,
  updateLineQty,
  removeFromCart,
  showToast,
  type CartLine,
} from "@/lib/cart";
import {
  calculateLinePrice,
  calculateCartTotals,
  type CartLineWithProduct,
  type ActivePromoDiscount,
} from "@/lib/cart-pricing";
import { toFa, groupNum, formatTomanDigits } from "@/lib/format";
import { validatePromoAction } from "@/app/cart/actions";

const PROMO_STORAGE_KEY = "gereh.promo.v1";

type CartViewProps = {
  products: Record<number, CartProductInfo>;
  settings: CartSettings;
};

// External store subscription for cart lines
function useCartLines(): CartLine[] {
  return useSyncExternalStore(
    subscribeCart,
    () => {
      return getCart();
    },
    () => []
  );
}

export function CartView({ products, settings }: CartViewProps) {
  const cart = useCartLines();
  const [mounted, setMounted] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [appliedPromo, setAppliedPromo] = useState<ActivePromoDiscount | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Restore applied promo from session storage if present
    try {
      const stored = sessionStorage.getItem(PROMO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code && parsed.percent) {
          queueMicrotask(() => {
            setAppliedPromo(parsed);
            setPromoInput(parsed.code);
            setPromoMsg({
              text: `کد اعمال شد — ٪${toFa(parsed.percent)} تخفیف.`,
              isError: false,
            });
          });
        }
      }
    } catch {}
    queueMicrotask(() => setMounted(true));
  }, []);

  // Match cart lines to product details
  const resolvedLines = cart.map((line) => {
    const p = products[line.id];
    if (!p) return null;

    const size = p.sizes.find(
      (s) => s.id === line.size || String(s.id) === String(line.size)
    );
    const color = p.colors.find((c) => c.id === line.color);
    const unitPrice = calculateLinePrice(p.priceToman, size?.deltaToman || 0);

    return {
      line,
      product: p,
      size,
      color,
      unitPrice,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Totals input
  const pricingLines: CartLineWithProduct[] = resolvedLines.map((item) => ({
    id: item.line.id,
    sizeId: item.line.size,
    colorId: item.line.color,
    qty: item.line.qty,
    unitPriceToman: item.unitPrice,
  }));

  const totals = calculateCartTotals(
    pricingLines,
    {
      flatToman: settings.shippingFlatToman,
      freeFromToman: settings.shippingFreeFromToman,
    },
    appliedPromo
  );

  const handleApplyPromo = () => {
    const raw = promoInput.trim();
    if (!raw) {
      setPromoMsg({ text: "اول کد را وارد کنید.", isError: true });
      return;
    }

    startTransition(async () => {
      const res = await validatePromoAction(raw);
      if (res.valid) {
        const promo: ActivePromoDiscount = { code: res.code, percent: res.percent };
        setAppliedPromo(promo);
        setPromoMsg({
          text: `کد اعمال شد — ٪${toFa(res.percent)} تخفیف.`,
          isError: false,
        });
        showToast("کد تخفیف اعمال شد", "check");
        try {
          sessionStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
        } catch {}
      } else {
        setAppliedPromo(null);
        setPromoMsg({ text: res.error, isError: true });
        try {
          sessionStorage.removeItem(PROMO_STORAGE_KEY);
        } catch {}
      }
    });
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoMsg(null);
    try {
      sessionStorage.removeItem(PROMO_STORAGE_KEY);
    } catch {}
    showToast("کد تخفیف حذف شد", "info");
  };

  const handleIncrement = (line: CartLine, maxStock: number) => {
    updateLineQty(line.id, line.size, line.color, line.qty + 1, maxStock);
  };

  const handleDecrement = (line: CartLine) => {
    updateLineQty(line.id, line.size, line.color, line.qty - 1);
  };

  const handleRemoveLine = (line: CartLine, productName: string) => {
    removeFromCart(line.id, line.size, line.color);
    showToast(`«${productName}» از سبد حذف شد`, "info");
  };

  // Prevent hydration flash before reading client localStorage
  if (!mounted) {
    return (
      <div className="wrap" style={{ paddingBlock: "var(--spacing-10)" }}>
        <div className="empty-state">
          <p className="muted">در حال بارگذاری سبد...</p>
        </div>
      </div>
    );
  }

  const isEmpty = resolvedLines.length === 0;

  return (
    <div className="wrap" style={{ paddingBottom: "var(--spacing-10)" }}>
      {/* Header and Step Indicators */}
      <section className="section--t section" style={{ paddingBlock: "var(--spacing-7) var(--spacing-5)" }}>
        <div>
          <span className="eyebrow">تسویه‌ی حساب</span>
          <h1 style={{ fontSize: "clamp(var(--text-500), 6vw, var(--text-700))", marginBottom: "var(--spacing-5)" }}>
            سبد خرید
          </h1>
          <ol className="steps" id="steps" style={{ listStyle: "none", padding: 0, margin: 0, flexWrap: "wrap" }}>
            <li className="is-active" data-step="cart">سبد</li>
            <li data-step="info">مشخصات و پرداخت</li>
            <li data-step="done">تأیید</li>
          </ol>
        </div>
      </section>

      {isEmpty ? (
        <div id="cart-empty" className="empty-state">
          <svg className="knot-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path d="M16 24h16" stroke="currentColor" strokeWidth="2.2" />
          </svg>
          <h3>سبد شما خالی است</h3>
          <p>
            هنوز قطعه‌ای انتخاب نکرده‌اید. از فروشگاه شروع کنید — یا اگر اندازه‌ی دیوار خاص مدنظرتان است، سفارش اختصاصی ثبت کنید.
          </p>
          <div className="od-row" style={{ gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <TransitionLink className="btn btn--primary" href="/shop">
              رفتن به فروشگاه
            </TransitionLink>
            <TransitionLink className="btn btn--outline" href="/contact#order">
              سفارش اختصاصی
            </TransitionLink>
          </div>
        </div>
      ) : (
        <div className="split-side">
          {/* Cart Item Lines */}
          <div id="cart-list" aria-label="اقلام سبد خرید">
            {resolvedLines.map(({ line, product, size, color, unitPrice }) => {
              const lineKey = `${line.id}|${line.size}|${line.color}`;
              const sizeLabel = size?.label || "—";
              const colorLabel = color?.label || "—";
              const lineTotal = unitPrice * line.qty;

              return (
                <div className="line" key={lineKey} data-id={lineKey}>
                  <TransitionLink href={`/product/${product.slug}`}>
                    {product.heroImage ? (
                      <Image
                        className="od-media od-media-cover"
                        style={{ aspectRatio: "1" }}
                        src={product.heroImage.path}
                        width={product.heroImage.width || 160}
                        height={product.heroImage.height || 160}
                        alt={product.heroImage.alt || product.name}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          background: "var(--color-surface-alt)",
                          borderRadius: "var(--radius-md)",
                        }}
                      />
                    )}
                  </TransitionLink>

                  <div className="od-stack" style={{ gap: "6px" }}>
                    <h4>
                      <TransitionLink className="underline" href={`/product/${product.slug}`}>
                        {product.name}
                      </TransitionLink>
                    </h4>
                    <span className="variant">
                      اندازه: {sizeLabel} · رنگ: {colorLabel}
                    </span>
                    <span className="muted" style={{ fontSize: "var(--text-100)" }}>
                      واحدی {formatTomanDigits(unitPrice)} تومان
                    </span>

                    <div className="qty" style={{ marginTop: "6px" }}>
                      <button
                        type="button"
                        onClick={() => handleDecrement(line)}
                        aria-label={`کم کردن ${product.name}`}
                      >
                        −
                      </button>
                      <output aria-label="تعداد">{toFa(line.qty)}</output>
                      <button
                        type="button"
                        onClick={() => handleIncrement(line, product.stock)}
                        disabled={line.qty >= product.stock}
                        aria-label={`اضافه کردن ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="line-actions">
                    <span className="price">{formatTomanDigits(lineTotal)} تومان</span>
                    <button
                      type="button"
                      className="link-danger"
                      onClick={() => handleRemoveLine(line, product.name)}
                    >
                      حذف از سبد
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side Summary & Promo Panel */}
          <div id="cart-foot" className="od-stack" style={{ gap: "var(--spacing-6)" }}>
            {/* Promo Box */}
            <div className="card" style={{ padding: "var(--spacing-5)" }}>
              <div className="od-stack" style={{ gap: "var(--spacing-3)" }}>
                <label htmlFor="promo" style={{ fontWeight: 600 }}>
                  کد تخفیف <span className="muted" style={{ fontWeight: 400 }}>(اختیاری)</span>
                </label>
                <div className="od-row" style={{ gap: "12px", flexWrap: "wrap" }}>
                  <div className="search od-fill" style={{ maxWidth: "320px" }}>
                    <input
                      id="promo"
                      type="text"
                      autoComplete="off"
                      placeholder="مثلاً GEREH10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      aria-describedby="promo-msg"
                      disabled={isPending || appliedPromo !== null}
                    />
                  </div>
                  {appliedPromo ? (
                    <button
                      className="btn btn--quiet"
                      type="button"
                      onClick={handleRemovePromo}
                    >
                      حذف کد
                    </button>
                  ) : (
                    <button
                      className="btn btn--quiet"
                      id="apply-promo"
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={isPending}
                    >
                      {isPending ? "در حال بررسی..." : "اعمال کد"}
                    </button>
                  )}
                </div>

                {promoMsg && (
                  <span
                    id="promo-msg"
                    role="status"
                    aria-live="polite"
                    style={{
                      minHeight: "1.7em",
                      fontSize: "var(--text-100)",
                      color: promoMsg.isError ? "var(--color-error)" : "var(--color-success)",
                      fontWeight: 600,
                    }}
                  >
                    {promoMsg.text}
                  </span>
                )}

                <p className="muted" style={{ fontSize: "var(--text-100)", margin: 0 }}>
                  کد نمونه: <b className="mono-num" dir="ltr">GEREH10</b> — ده‌درصد تخفیف.
                </p>
              </div>
            </div>

            {/* Order Summary Aside */}
            <aside className="card" style={{ padding: "var(--spacing-6)" }} aria-label="خلاصه‌ی سفارش">
              <table className="sum-table" id="sum-c">
                <tbody>
                  <tr>
                    <td>جمع کالاها ({toFa(totals.itemCount)} عدد)</td>
                    <td>{formatTomanDigits(totals.subtotalToman)} تومان</td>
                  </tr>

                  {appliedPromo && totals.discountToman > 0 && (
                    <tr>
                      <td style={{ color: "var(--color-success)" }}>
                        تخفیف {appliedPromo.code} (٪{toFa(appliedPromo.percent)})
                      </td>
                      <td style={{ color: "var(--color-success)" }}>
                        −{formatTomanDigits(totals.discountToman)} تومان
                      </td>
                    </tr>
                  )}

                  <tr className={totals.isFreeShipping ? "free" : ""}>
                    <td>ارسال</td>
                    <td>
                      {totals.shippingToman === 0
                        ? totals.subtotalToman > 0
                          ? "رایگان"
                          : "—"
                        : `${formatTomanDigits(totals.shippingToman)} تومان`}
                    </td>
                  </tr>

                  {totals.subtotalToman > 0 && totals.shippingToman > 0 && (
                    <tr>
                      <td colSpan={2} style={{ fontSize: "13px" }} className="muted">
                        سفارش بالای {toFa(groupNum(settings.shippingFreeFromToman))} تومان، ارسال رایگان
                      </td>
                    </tr>
                  )}

                  <tr className="total">
                    <td>قابل پرداخت</td>
                    <td>{formatTomanDigits(totals.totalToman)} تومان</td>
                  </tr>
                </tbody>
              </table>

              <TransitionLink
                className="btn btn--primary btn--block btn--lg magnetic"
                id="to-info"
                href="/checkout"
                style={{ marginTop: "var(--spacing-5)" }}
              >
                ادامه — مشخصات و پرداخت
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true" style={{ marginInlineStart: "6px" }}>
                  <path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </TransitionLink>

              <TransitionLink
                className="btn btn--block"
                style={{ marginTop: "var(--spacing-3)", color: "var(--color-muted)" }}
                href="/shop"
              >
                ادامه‌ی خرید
              </TransitionLink>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
