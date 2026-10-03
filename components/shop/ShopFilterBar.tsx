"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { ShopFilterParams } from "@/lib/storefront";
import { toFa, groupNum } from "@/lib/format";

type ShopFilterBarProps = {
  collections: { id: string; name: string }[];
  colors: { id: string; label: string; hex: string }[];
  activeFilters: ShopFilterParams;
  totalPublished: number;
  filteredCount: number;
};

export function ShopFilterBar({
  collections,
  colors,
  activeFilters,
  totalPublished,
  filteredCount,
}: ShopFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const updateFilters = useCallback(
    (updates: Partial<ShopFilterParams>) => {
      const merged = { ...activeFilters, ...updates };
      const params = new URLSearchParams();

      if (merged.collection && merged.collection !== "all") {
        params.set("collection", merged.collection);
      }
      const colorVal = Array.isArray(merged.color)
        ? merged.color[0]
        : merged.color;
      if (colorVal) {
        params.set("color", colorVal);
      }
      if (merged.maxPrice && merged.maxPrice < 5000000) {
        params.set("maxPrice", String(merged.maxPrice));
      }
      if (merged.minPrice && merged.minPrice > 0) {
        params.set("minPrice", String(merged.minPrice));
      }
      if (merged.inStock) {
        params.set("stock", "true");
      }
      if (merged.sort && merged.sort !== "new") {
        params.set("sort", merged.sort);
      }
      if (merged.q && merged.q.trim()) {
        params.set("q", merged.q.trim());
      }

      startTransition(() => {
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      });
    },
    [activeFilters, pathname, router]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const activeCollection = activeFilters.collection || "all";
  const activeColor = Array.isArray(activeFilters.color)
    ? activeFilters.color[0] || ""
    : activeFilters.color || "";
  const activeMaxPrice = activeFilters.maxPrice ?? 5000000;
  const activeSort = activeFilters.sort || "new";
  const activeStock = !!activeFilters.inStock;
  const activeQ = activeFilters.q || "";

  const [searchInput, setSearchInput] = useState(activeQ);
  const [localPrice, setLocalPrice] = useState(activeMaxPrice);

  useEffect(() => {
    queueMicrotask(() => setSearchInput(activeQ));
  }, [activeQ]);

  useEffect(() => {
    setLocalPrice(activeMaxPrice);
  }, [activeMaxPrice]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== activeQ) {
        updateFilters({ q: searchInput });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput, activeQ, updateFilters]);

  const commitPriceChange = useCallback(
    (val: number) => {
      if (val !== activeMaxPrice) {
        updateFilters({ maxPrice: val });
      }
    },
    [activeMaxPrice, updateFilters]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localPrice !== activeMaxPrice) {
        updateFilters({ maxPrice: localPrice });
      }
    }, 400);
    return () => clearTimeout(handler);
  }, [localPrice, activeMaxPrice, updateFilters]);

  const pricePct = Math.min(
    100,
    Math.max(0, Math.round(((localPrice - 500000) / 4500000) * 100))
  );

  const selectedColorItem = colors.find((c) => c.id === activeColor);

  const hasAnyFilter =
    activeCollection !== "all" ||
    activeColor !== "" ||
    activeMaxPrice < 5000000 ||
    activeStock ||
    activeSort !== "new" ||
    activeQ !== "";

  // Active filter tags for quick removal
  const tags: { id: string; label: string; onRemove: () => void }[] = [];

  if (activeCollection !== "all") {
    const colName =
      collections.find((c) => c.id === activeCollection)?.name || activeCollection;
    tags.push({
      id: "col",
      label: `دسته: ${colName}`,
      onRemove: () => updateFilters({ collection: "all" }),
    });
  }

  if (activeColor) {
    const colorLabel =
      colors.find((c) => c.id === activeColor)?.label || activeColor;
    tags.push({
      id: "color",
      label: `رنگ: ${colorLabel}`,
      onRemove: () => updateFilters({ color: undefined }),
    });
  }

  if (activeMaxPrice < 5000000) {
    tags.push({
      id: "price",
      label: `حداکثر: ${toFa(groupNum(activeMaxPrice))} تومان`,
      onRemove: () => updateFilters({ maxPrice: 5000000 }),
    });
  }

  if (activeStock) {
    tags.push({
      id: "stock",
      label: "فقط موجود",
      onRemove: () => updateFilters({ inStock: false }),
    });
  }

  if (activeQ) {
    tags.push({
      id: "q",
      label: `جست‌وجو: «${activeQ}»`,
      onRemove: () => updateFilters({ q: "" }),
    });
  }

  return (
    <div className="wrap">
      <div className="od-stack" style={{ "--od-gap": "0" } as React.CSSProperties}>
        {/* Top search & sort bar */}
        <div className="filter-bar" role="region" aria-label="ابزارهای فیلتر">
          <div
            className="search"
            style={{ flex: 1, minWidth: "240px" } as React.CSSProperties}
          >
            <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            <input
              id="q"
              type="search"
              placeholder="جست‌وجو: تابلو، گل‌آویز، نخ کنفی…"
              aria-label="جست‌وجو در محصولات"
              autoComplete="off"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="filter-sort">
            <label htmlFor="sort" className="filter-sort__label">
              <svg
                className="w-4 h-4 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 6h18M6 12h12M9 18h6" strokeLinecap="round" />
              </svg>
              <span>مرتب‌سازی:</span>
            </label>
            <div className="filter-sort__select-wrap">
              <select
                id="sort"
                value={activeSort}
                onChange={(e) =>
                  updateFilters({
                    sort: e.target.value as "new" | "cheap" | "exp" | "rate",
                  })
                }
                aria-label="مرتب‌سازی محصولات"
              >
                <option value="new">جدیدترین</option>
                <option value="cheap">ارزان‌ترین</option>
                <option value="exp">گران‌ترین</option>
                <option value="rate">بیشترین امتیاز</option>
              </select>
              <svg
                className="filter-sort__chevron"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M4 6l4 4 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {hasAnyFilter ? (
            <button
              className="filter-reset-btn"
              id="reset"
              type="button"
              onClick={resetFilters}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
              </svg>
              <span>پاک کردن فیلترها</span>
            </button>
          ) : null}
        </div>

        {/* Filter controls row */}
        <div
          className="od-stack"
          style={
            {
              "--od-gap": "16px",
              paddingBlock: "var(--s-5)",
            } as React.CSSProperties
          }
        >
          <div
            className="od-row"
            style={
              {
                flexWrap: "wrap",
                "--od-gap": "24px",
                alignItems: "flex-start",
              } as React.CSSProperties
            }
          >
            {/* Category Cluster */}
            <div className="filter-group">
              <span className="filter-group-title">دسته</span>
              <div
                className="od-cluster"
                id="f-cat"
                role="group"
                aria-label="فیلتر دسته"
              >
                <button
                  type="button"
                  className="chip"
                  aria-pressed={activeCollection === "all"}
                  onClick={() => updateFilters({ collection: "all" })}
                >
                  همه
                </button>
                {collections.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chip"
                    aria-pressed={activeCollection === c.id}
                    onClick={() => updateFilters({ collection: c.id })}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Price Range */}
            <div className="filter-group">
              <span className="filter-group-title">حداکثر قیمت</span>
              <div className="od-row filter-price-box">
                <div className="price-slider-wrap">
                  <input
                    type="range"
                    id="f-price"
                    className="price-slider"
                    min="500000"
                    max="5000000"
                    step="100000"
                    value={localPrice}
                    style={{ "--pct": `${pricePct}%` } as React.CSSProperties}
                    aria-label="حداکثر قیمت"
                    aria-describedby="price-out"
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setLocalPrice(val);
                    }}
                    onPointerUp={() => commitPriceChange(localPrice)}
                    onKeyUp={() => commitPriceChange(localPrice)}
                  />
                </div>
                <output id="price-out" className="filter-price-badge mono-num od-nowrap">
                  تا {toFa(groupNum(localPrice))} تومان
                </output>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="filter-group">
              <span className="filter-group-title">
                رنگ نخ
              </span>
              <div
                className="od-row flex-wrap gap-2"
                id="f-color"
                role="group"
                aria-label="فیلتر رنگ"
              >
                {colors.map((c) => {
                  const isSelected = activeColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        updateFilters({
                          color: isSelected ? undefined : c.id,
                        })
                      }
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

            {/* Stock Switch */}
            <div className="filter-group">
              <span className="filter-group-title">موجودی</span>
              <label className="switch" style={{ minHeight: "38px" }}>
                <input
                  type="checkbox"
                  id="f-stock"
                  checked={activeStock}
                  onChange={(e) => updateFilters({ inStock: e.target.checked })}
                />
                <span>فقط کالای موجود</span>
              </label>
            </div>
          </div>

          {/* Result Count and Active Tags */}
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                borderTop: "1px solid var(--line)",
                paddingTop: "var(--s-4)",
                opacity: isPending ? 0.6 : 1,
                transition: "opacity 150ms ease",
              } as React.CSSProperties
            }
          >
            <span className="muted" id="count" role="status" aria-live="polite">
              نمایش {toFa(filteredCount)} قطعه از {toFa(totalPublished)} قطعه
            </span>
            <div className="od-cluster" id="f-tags">
              {tags.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="chip text-xs"
                  onClick={t.onRemove}
                  title="حذف فیلتر"
                >
                  {t.label} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
