import React from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { ProductWithHeroImage } from "@/lib/storefront";
import { toFa, formatTomanDigits } from "@/lib/format";

type ProductCardProps = {
  product: ProductWithHeroImage;
  index: number;
  className?: string;
  ratio?: string;
};

export function ProductCard({
  product,
  index,
  className = "",
  ratio = "4 / 5",
}: ProductCardProps) {
  const isSold = product.stock === 0;
  const isLowStock = !isSold && product.stock > 0 && product.stock <= 3;
  const offPercent =
    product.compareAtToman && product.compareAtToman > product.priceToman
      ? Math.round((1 - product.priceToman / product.compareAtToman) * 100)
      : 0;

  const hero = product.heroImage ?? {
    path: "/images/macrame-goa-large.jpg",
    alt: product.name,
    width: 800,
    height: 800,
  };

  const secondary = product.secondaryImage;

  return (
    <TransitionLink
      href={`/product/${encodeURIComponent(product.slug)}`}
      className={`tile group reveal ${isSold ? "is-sold" : ""} ${className}`}
      style={{ "--i": index % 9 } as React.CSSProperties}
      data-card={product.id}
      aria-label={`${product.name}، ${product.collectionName || ""}، ${formatTomanDigits(product.priceToman)} تومان`}
    >
      {/* Media container with uniform aspect ratio */}
      <span
        className="tile-media"
        style={{ "--tile-ratio": ratio } as React.CSSProperties}
      >
        {/* Status & Promotional Badges */}
        {isSold ? (
          <span className="badge badge--sold">ناموجود</span>
        ) : offPercent > 0 ? (
          <span className="badge badge--sale">٪{toFa(offPercent)} تخفیف</span>
        ) : product.isNew ? (
          <span className="badge badge--new">جدید</span>
        ) : null}

        {isLowStock ? (
          <span className="badge badge--low-stock">
            تنها {toFa(product.stock)} عدد باقی‌مانده
          </span>
        ) : null}

        {/* Primary Hero Image */}
        <img
          className="od-media od-media-cover tile-img-primary"
          src={hero.path}
          width={hero.width ?? 1200}
          height={hero.height ?? 1200}
          alt={hero.alt || product.name}
          loading="lazy"
        />

        {/* Secondary Detail Image on Hover */}
        {secondary ? (
          <img
            className="od-media od-media-cover tile-img-secondary"
            src={secondary.path}
            width={secondary.width ?? 1200}
            height={secondary.height ?? 1200}
            alt={secondary.alt || product.name}
            loading="lazy"
            aria-hidden="true"
          />
        ) : null}

        {/* Floating Action Affordance */}
        <span className="tile-action-btn" aria-hidden="true">
          <span>{isSold ? "مشاهده جزئیات" : "مشاهده و خرید"}</span>
          <svg
            className="w-4 h-4"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10 12l-4-4 4-4" />
          </svg>
        </span>
      </span>

      {/* Body Content */}
      <span className="tile-body">
        {/* Eyebrow & Stock indicator */}
        <span className="tile-meta-row">
          <span className="tile-category">
            {product.collectionName || "دست‌بافت"}
          </span>
          {isSold ? (
            <span className="tile-stock-status is-out">اتمام موجودی</span>
          ) : (
            <span className="tile-stock-status">
              <span className="stock-dot" />
              آماده ارسال
            </span>
          )}
        </span>

        {/* Name & Subtitle */}
        <span className="tile-heading-group">
          <span className="tile-name">{product.name}</span>
          {product.subtitle ? (
            <span className="tile-sub od-clamp-2">{product.subtitle}</span>
          ) : null}
        </span>

        {/* Color Swatches */}
        {product.colors && product.colors.length > 0 ? (
          <span className="tile-swatches" aria-label="رنگ‌های موجود">
            {product.colors.slice(0, 4).map((c) => (
              <span
                key={c.id}
                className="swatch-dot"
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
            {product.colors.length > 4 ? (
              <span className="swatch-more">
                +{toFa(product.colors.length - 4)}
              </span>
            ) : null}
          </span>
        ) : null}

        {/* Footer: Rating & Price */}
        <span className="tile-footer">
          <span
            className="tile-rating"
            role="img"
            aria-label={`امتیاز ${toFa(product.rating || 5)} از ۵`}
          >
            <svg className="icon-star" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z" />
            </svg>
            <span className="rating-val mono-num">
              {toFa(product.rating || 5)}
            </span>
            {product.reviewCount > 0 ? (
              <span className="rating-count">({toFa(product.reviewCount)})</span>
            ) : null}
          </span>

          <span className="tile-price-block">
            {product.compareAtToman && product.compareAtToman > product.priceToman ? (
              <span className="price-was">
                <span className="mono-num">
                  {formatTomanDigits(product.compareAtToman)}
                </span>
              </span>
            ) : null}
            <span className="price">
              <span className="mono-num">
                {formatTomanDigits(product.priceToman)}
              </span>{" "}
              <small>تومان</small>
            </span>
          </span>
        </span>
      </span>
    </TransitionLink>
  );
}
