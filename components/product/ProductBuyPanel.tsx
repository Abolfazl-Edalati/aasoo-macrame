"use client";

import React, { useState, useEffect, useRef } from "react";
import type { FullProduct } from "@/lib/storefront";
import { toFa, groupNum, formatTomanDigits } from "@/lib/format";
import { addToCart, getCart } from "@/lib/cart";

type ProductBuyPanelProps = {
  product: FullProduct;
};

export function ProductBuyPanel({ product }: ProductBuyPanelProps) {
  const [selectedSizeId, setSelectedSizeId] = useState<number>(
    product.sizes[0]?.id ?? 0
  );
  const [selectedColorId, setSelectedColorId] = useState<string>(
    product.colors[0]?.id ?? ""
  );
  const [qty, setQty] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [addMsg, setAddMsg] = useState("");
  const [showBuyBar, setShowBuyBar] = useState(false);

  const addBtnRef = useRef<HTMLButtonElement>(null);
  const isSold = product.stock === 0;

  // Selected size & price calculation
  const currentSize = product.sizes.find((s) => s.id === selectedSizeId);
  const currentColor = product.colors.find((c) => c.id === selectedColorId);

  const currentPrice = product.priceToman + (currentSize?.deltaToman || 0);
  const hasCompareAt =
    product.compareAtToman && product.compareAtToman > currentPrice;

  // Sticky buy bar observer
  useEffect(() => {
    const btn = addBtnRef.current;
    if (!btn) return;

    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReduced) {
      queueMicrotask(() => setShowBuyBar(true));
      document.body.classList.add("has-buy-bar");
      return () => document.body.classList.remove("has-buy-bar");
    }

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const shouldShow =
              !entry.isIntersecting && entry.boundingClientRect.top < 0;
            setShowBuyBar(shouldShow);
            document.body.classList.toggle("has-buy-bar", shouldShow);
          });
        },
        { threshold: 0 }
      );
      io.observe(btn);
      return () => {
        io.disconnect();
        document.body.classList.remove("has-buy-bar");
      };
    } else {
      queueMicrotask(() => setShowBuyBar(true));
      document.body.classList.add("has-buy-bar");
      return () => document.body.classList.remove("has-buy-bar");
    }
  }, []);

  const handleAdd = () => {
    if (isSold) {
      window.location.href = "/contact#order";
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addToCart(
        {
          id: product.id,
          size: selectedSizeId,
          color: selectedColorId,
          stock: product.stock,
          name: product.name,
        },
        qty
      );

      const cart = getCart();
      const line = cart.find(
        (l) =>
          l.id === product.id &&
          String(l.size) === String(selectedSizeId) &&
          l.color === selectedColorId
      );

      if (line) {
        const sizeLabel = currentSize?.label || "";
        const colorLabel = currentColor?.label || "";
        setAddMsg(
          `«${sizeLabel}${colorLabel ? ` / ${colorLabel}` : ""}» الان ${toFa(
            line.qty
          )} عدد در سبد است`
        );
      }
    }, 420);
  };

  const specs = [
    ["نوع بافت", product.weave],
    ["متریال", product.materials],
    ["ابعاد", product.dimensions],
    ["وزن", product.weightKg ? `${toFa(product.weightKg)} کیلوگرم` : null],
    ["جای بافت", product.madeIn],
    ["دستبافت", product.handmade ? "بله" : "خیر"],
  ].filter(([, val]) => val !== null && val !== undefined && val !== "");

  return (
    <>
      <div
        className="od-stack"
        style={
          {
            "--od-gap": "24px",
            position: "sticky",
            top: "calc(var(--header-h) + 16px)",
          } as React.CSSProperties
        }
      >
        <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
          <div
            className="od-row"
            style={{ "--od-gap": "12px", flexWrap: "wrap" } as React.CSSProperties}
          >
            {isSold ? (
              <span className="badge badge--sold" style={{ position: "static" }}>
                ناموجود
              </span>
            ) : product.isNew ? (
              <span className="badge badge--new" style={{ position: "static" }}>
                جدید
              </span>
            ) : null}

            <span className="rating-row">
              <span
                className="stars"
                role="img"
                aria-label={`امتیاز ${toFa(product.rating)} از ۵`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`icon ${
                      star <= Math.round(product.rating) ? "" : "empty"
                    }`}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z" />
                  </svg>
                ))}
              </span>
              <span>({toFa(product.reviewCount)} نظر)</span>
            </span>
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(var(--fs-500), 5vw, var(--fs-600))",
            }}
          >
            {product.name}
          </h1>

          {product.subtitle ? (
            <p className="lead ink2" style={{ margin: 0 }}>
              {product.subtitle}
            </p>
          ) : null}
        </div>

        <div
          className="od-row"
          style={
            {
              "--od-gap": "16px",
              alignItems: "baseline",
              flexWrap: "wrap",
            } as React.CSSProperties
          }
        >
          <span className="price" style={{ fontSize: "var(--fs-400)" }}>
            <span className="mono-num">{formatTomanDigits(currentPrice)}</span>{" "}
            <small>تومان</small>
          </span>

          {hasCompareAt ? (
            <span className="price-was">
              <span className="mono-num">
                {formatTomanDigits(product.compareAtToman!)}
              </span>{" "}
              <small>تومان</small>
            </span>
          ) : null}

          <span className="od-nowrap">
            {isSold ? (
              <span style={{ color: "var(--error)", fontWeight: 700 }}>
                تمام شده — بافت مجدد از ۱۰ روز دیگر
              </span>
            ) : product.stock <= 3 ? (
              <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                فقط {toFa(product.stock)} عدد باقی مانده
              </span>
            ) : (
              <span style={{ color: "var(--success)", fontWeight: 700 }}>
                موجود
              </span>
            )}
          </span>
        </div>

        {/* Sizes */}
        {product.sizes.length > 0 ? (
          <div className="od-stack" style={{ "--od-gap": "12px" } as React.CSSProperties}>
            <span className="label" style={{ fontWeight: 600 }}>
              اندازه{" "}
              {product.sizes.length > 1 ? (
                <span className="muted text-xs font-normal">
                  (قیمت با اندازه عوض می‌شود)
                </span>
              ) : null}
            </span>
            <div
              className="sizes"
              role="group"
              aria-label="گزینش اندازه"
            >
              {product.sizes.map((s) => {
                const isSelected = s.id === selectedSizeId;
                const d = s.deltaToman || 0;
                return (
                  <button
                    key={s.id}
                    className="chip"
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedSizeId(s.id)}
                  >
                    {s.label}
                    {d !== 0 ? (
                      <small className="muted mono-num">
                        {" "}
                        {d > 0 ? "+" : "−"}
                        {toFa(groupNum(Math.abs(d)))}
                      </small>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Colors */}
        {product.colors.length > 0 ? (
          <div className="od-stack" style={{ "--od-gap": "12px" } as React.CSSProperties}>
            <span className="label" style={{ fontWeight: 600 }}>
              رنگ نخ
            </span>
            <div
              className="od-row flex-wrap gap-2"
              role="group"
              aria-label="گزینش رنگ"
            >
              {product.colors.map((c) => {
                const isSelected = c.id === selectedColorId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedColorId(c.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 font-semibold text-ink shadow-sm"
                        : "border-line bg-surface hover:border-muted text-ink-2"
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Quantity and Add to Cart */}
        <div>
          <div
            className="od-row"
            style={
              {
                "--od-gap": "16px",
                flexWrap: "wrap",
                alignItems: "flex-end",
                paddingTop: "var(--s-2)",
              } as React.CSSProperties
            }
          >
            <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
              <span style={{ fontWeight: 600 }}>تعداد</span>
              <div className="qty" style={{ height: "56px" }}>
                <button
                  type="button"
                  aria-label="کم کردن تعداد"
                  style={{ height: "100%", minWidth: "48px" }}
                  disabled={qty <= 1}
                  onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                >
                  −
                </button>
                <output aria-live="polite">{toFa(qty)}</output>
                <button
                  type="button"
                  aria-label="اضافه کردن تعداد"
                  style={{ height: "100%", minWidth: "48px" }}
                  disabled={isSold || qty >= product.stock}
                  onClick={() =>
                    setQty((prev) => Math.min(isSold ? 1 : product.stock, prev + 1))
                  }
                >
                  +
                </button>
              </div>
            </div>

            <div className="od-fill">
              <button
                ref={addBtnRef}
                className={`btn btn--primary btn--lg btn--block magnetic ${
                  isLoading ? "is-loading" : ""
                }`}
                type="button"
                disabled={isLoading}
                onClick={handleAdd}
              >
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
                  <path d="M12 10v5M9.5 12.5h5" />
                </svg>
                {isSold ? "ثبت درخواست بافت مجدد" : "افزودن به سبد"}
              </button>
            </div>
          </div>
          <span
            className="muted"
            role="status"
            aria-live="polite"
            style={{ minHeight: "1.7em", display: "block", marginTop: "8px" }}
          >
            {isSold
              ? "این کار فعلاً بافته نشده؛ فرم سفارش را پر کنید."
              : addMsg}
          </span>
        </div>

        {/* Accordions */}
        <div className="od-stack acc-strip">
          {product.description ? (
            <details className="acc" open>
              <summary>
                شرح و نحوه‌ی بافت{" "}
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="acc-body">
                <p>{product.description}</p>
              </div>
            </details>
          ) : null}

          {specs.length > 0 ? (
            <details className="acc">
              <summary>
                مشخصات و متریال{" "}
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="acc-body">
                <table
                  className="sum-table"
                  style={{ fontSize: "var(--fs-100)" }}
                >
                  <tbody>
                    {specs.map(([label, val]) => (
                      <tr key={label}>
                        <td>{label}</td>
                        <td>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}

          {product.care ? (
            <details className="acc">
              <summary>
                نگهداری{" "}
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="acc-body">
                <p>{product.care}</p>
              </div>
            </details>
          ) : null}

          {product.story ? (
            <details className="acc">
              <summary>
                داستان این کار{" "}
                <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <div className="acc-body">
                <p>{product.story}</p>
              </div>
            </details>
          ) : null}
        </div>

        {/* Value props */}
        <div
          className="od-row"
          style={
            {
              "--od-gap": "12px",
              flexWrap: "wrap",
              color: "var(--muted)",
              fontSize: "var(--fs-100)",
            } as React.CSSProperties
          }
        >
          <span className="od-row" style={{ "--od-gap": "6px" } as React.CSSProperties}>
            <svg
              className="icon icon--sm"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M3 8h13v8H3zM16 11h3l2 2v3h-5z" />
              <circle cx="7" cy="17" r="1.6" />
              <circle cx="17.5" cy="17" r="1.6" />
            </svg>{" "}
            ارسال از تهران
          </span>
          <span className="od-row" style={{ "--od-gap": "6px" } as React.CSSProperties}>
            <svg
              className="icon icon--sm"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            </svg>{" "}
            ۷ روز ضمانت بازگشت
          </span>
          <span className="od-row" style={{ "--od-gap": "6px" } as React.CSSProperties}>
            <svg
              className="icon icon--sm"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 20s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z" />
            </svg>{" "}
            بافته‌ی دست
          </span>
        </div>
      </div>

      {/* Sticky buy bar */}
      <div
        className={`buy-bar ${showBuyBar ? "is-open" : ""}`}
        aria-hidden={!showBuyBar}
      >
        <div
          className="wrap od-row"
          style={{ "--od-gap": "16px" } as React.CSSProperties}
        >
          <div
            className="od-stack od-fill"
            style={{ "--od-gap": "0" } as React.CSSProperties}
          >
            <b className="od-truncate">{product.name}</b>
            <span className="price">
              <span className="mono-num">{formatTomanDigits(currentPrice)}</span>{" "}
              <small>تومان</small>
            </span>
          </div>
          <button
            className={`btn btn--primary magnetic ${isLoading ? "is-loading" : ""}`}
            type="button"
            disabled={isLoading}
            onClick={handleAdd}
          >
            {isSold ? "درخواست بافت مجدد" : "افزودن به سبد"}
          </button>
          <a className="btn btn--quiet" href="/cart">
            سبد
          </a>
        </div>
      </div>
    </>
  );
}
