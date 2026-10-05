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
  const startScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const historyRef = useRef<Array<{ x: number; time: number }>>([]);
  const momentumRafRef = useRef<number | null>(null);

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
      if (momentumRafRef.current) {
        cancelAnimationFrame(momentumRafRef.current);
      }
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
    el.style.scrollBehavior = "smooth";
    el.style.scrollSnapType = "";
    const step = 280;
    const amount = direction === "left" ? -step : step;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const finishDrag = useCallback(() => {
    momentumRafRef.current = null;
    const el = railRef.current;
    if (el) {
      el.style.cursor = "";
      el.style.scrollBehavior = "smooth";
      el.style.scrollSnapType = "";
    }
    checkScroll();
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 60);
  }, [checkScroll]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only handle mouse dragging; native touch has smooth hardware momentum
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = railRef.current;
    if (!el) return;

    const wasMomentumRunning = !!momentumRafRef.current;
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }

    isDraggingRef.current = true;
    hasDraggedRef.current = wasMomentumRunning;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = el.scrollLeft;
    historyRef.current = [{ x: e.clientX, time: performance.now() }];

    // Disable snap & smooth scroll while dragging to eliminate stutter
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.style.cursor = "grabbing";

    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const el = railRef.current;
    if (!el) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4) {
      hasDraggedRef.current = true;
    }

    if (!hasDraggedRef.current) return;

    el.scrollLeft = startScrollLeftRef.current - dx;

    const now = performance.now();
    historyRef.current.push({ x: e.clientX, time: now });
    if (historyRef.current.length > 8) {
      historyRef.current = historyRef.current.slice(-8);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const el = railRef.current;
    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }

    if (!hasDraggedRef.current) {
      finishDrag();
      return;
    }

    // Calculate release velocity for momentum glide animation
    const now = performance.now();
    const recent = historyRef.current.filter((p) => now - p.time <= 120);
    let velocity = 0;
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = last.time - first.time;
      if (dt > 10) {
        velocity = (last.x - first.x) / dt; // px per ms
      }
    }

    // If flicked with sufficient velocity, animate glide with friction
    if (Math.abs(velocity) > 0.12 && el) {
      let currentVelocity = velocity;
      let lastTime = performance.now();

      const glide = () => {
        if (!railRef.current) {
          finishDrag();
          return;
        }
        const container = railRef.current;
        const frameTime = performance.now();
        const dt = Math.min(frameTime - lastTime, 32);
        lastTime = frameTime;

        // Friction decay (smooth deceleration)
        const friction = Math.pow(0.92, dt / 16);
        currentVelocity *= friction;

        const prevScroll = container.scrollLeft;
        container.scrollLeft -= currentVelocity * dt;

        // Check if stopped or hit scroll edge
        const atEdge = Math.abs(container.scrollLeft - prevScroll) < 0.1;
        if (Math.abs(currentVelocity) > 0.03 && !atEdge) {
          momentumRafRef.current = requestAnimationFrame(glide);
        } else {
          finishDrag();
        }
      };

      momentumRafRef.current = requestAnimationFrame(glide);
    } else {
      finishDrag();
    }
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
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canScrollRight}
            className="w-7 h-7 rounded-full border border-line flex items-center justify-center text-ink/75 hover:text-ink hover:border-ink hover:bg-[var(--color-surface-alt)] active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              scroll("right");
            }}
            aria-label="اسکرول به راست"
            title="قبلی"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            type="button"
            disabled={!canScrollLeft}
            className="w-7 h-7 rounded-full border border-line flex items-center justify-center text-ink/75 hover:text-ink hover:border-ink hover:bg-[var(--color-surface-alt)] active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              scroll("left");
            }}
            aria-label="اسکرول به چپ"
            title="بعدی"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={railRef}
        className="od-rail select-none cursor-grab"
        id="related"
        style={
          {
            "--od-gap": "20px",
            paddingBlock: "var(--s-4)",
            touchAction: "pan-y",
          } as React.CSSProperties
        }
        aria-label="محصولات مرتبط"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onDragStart={(e) => e.preventDefault()}
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
