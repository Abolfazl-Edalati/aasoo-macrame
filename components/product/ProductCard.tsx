import React from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import type { ProductWithHeroImage } from "@/lib/storefront";
import { toFa, formatTomanDigits } from "@/lib/format";

type ProductCardProps = {
  product: ProductWithHeroImage;
  index: number;
};

export function ProductCard({ product, index }: ProductCardProps) {
  const isSold = product.stock === 0;
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

  const ratio =
    hero.width && hero.height
      ? (hero.width / hero.height).toFixed(4)
      : "1.0000";

  return (
    <TransitionLink
      href={`/product/${encodeURIComponent(product.slug)}`}
      className={`tile od-tile reveal ${isSold ? "is-sold" : ""}`}
      style={{ "--i": index % 9 } as React.CSSProperties}
      data-card={product.id}
    >
      {isSold ? (
        <span className="badge badge--sold">ناموجود</span>
      ) : offPercent > 0 ? (
        <span className="badge badge--sale">٪{toFa(offPercent)}−</span>
      ) : product.isNew ? (
        <span className="badge badge--new">جدید</span>
      ) : null}

      <span className="tile-media">
        <img
          className="od-media"
          style={{ "--od-ratio": ratio } as React.CSSProperties}
          src={hero.path}
          width={hero.width ?? 1200}
          height={hero.height ?? 1200}
          alt={hero.alt || product.name}
          loading="lazy"
        />
      </span>

      <span className="tile-body">
        <span className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
          <span className="tile-name">{product.name}</span>
          {product.subtitle ? (
            <span className="tile-sub od-clamp-2">{product.subtitle}</span>
          ) : null}
        </span>

        <span className="tile-price">
          <span className="od-stack" style={{ "--od-gap": "0" } as React.CSSProperties}>
            <span className="od-row od-nowrap">
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
              <span className="muted text-[13px]">({toFa(product.reviewCount)})</span>
            </span>
          </span>

          <span
            className="od-stack"
            style={{ "--od-gap": "0", textAlign: "end" } as React.CSSProperties}
          >
            {product.compareAtToman && product.compareAtToman > product.priceToman ? (
              <span className="price-was">
                <span className="mono-num">{formatTomanDigits(product.compareAtToman)}</span>{" "}
                <small>تومان</small>
              </span>
            ) : null}
            <span className="price">
              <span className="mono-num">{formatTomanDigits(product.priceToman)}</span>{" "}
              <small>تومان</small>
            </span>
          </span>
        </span>
      </span>
    </TransitionLink>
  );
}
