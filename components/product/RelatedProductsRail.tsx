"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import type { ProductWithHeroImage } from "@/lib/storefront";

export function RelatedProductsRail({
  products,
}: {
  products: ProductWithHeroImage[];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);
    setCanScrollRight(absScroll > 2 || scrollLeft > 2);
    setCanScrollLeft(absScroll < maxScroll - 2 || scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const step = 280;
    const amount = direction === "left" ? -step : step;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX;
    scrollLeftRef.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = railRef.current;
    if (!el) return;
    const walk = e.pageX - startXRef.current;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    const el = railRef.current;
    if (el) {
      el.style.cursor = "grab";
      el.style.removeProperty("user-select");
    }
    setTimeout(() => {
      isDraggingRef.current = false;
      hasDraggedRef.current = false;
    }, 50);
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 style={{ fontSize: "var(--fs-400)", margin: 0 }}>هم‌ست با این کار</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-btn border border-line rounded-full w-9 h-9 flex items-center justify-center hover:border-ink hover:text-ink transition-colors cursor-pointer"
            onClick={() => scroll("right")}
            aria-label="اسکرول به راست"
            title="قبلی"
          >
            <svg
              className="icon w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn border border-line rounded-full w-9 h-9 flex items-center justify-center hover:border-ink hover:text-ink transition-colors cursor-pointer"
            onClick={() => scroll("left")}
            aria-label="اسکرول به چپ"
            title="بعدی"
          >
            <svg
              className="icon w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="od-rail select-none cursor-grab active:cursor-grabbing"
        id="related"
        style={
          {
            "--od-gap": "20px",
            paddingBlock: "var(--s-4)",
          } as React.CSSProperties
        }
        aria-label="محصولات مرتبط"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onClickCapture={handleClickCapture}
      >
        {products.map((rel, i) => (
          <div
            key={rel.id}
            style={{ width: "min(74vw, 260px)", flexShrink: 0 }}
          >
            <ProductCard product={rel} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
