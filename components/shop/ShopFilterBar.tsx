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

  useEffect(() => {
    queueMicrotask(() => setSearchInput(activeQ));
  }, [activeQ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== activeQ) {
        updateFilters({ q: searchInput });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput, activeQ, updateFilters]);

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

          <div className="field" style={{ minWidth: "180px" } as React.CSSProperties}>
            <label htmlFor="sort" className="muted">
              مرتب‌سازی
            </label>
            <select
              id="sort"
              value={activeSort}
              onChange={(e) =>
                updateFilters({
                  sort: e.target.value as "new" | "cheap" | "exp" | "rate",
                })
              }
            >
              <option value="new">جدیدترین</option>
              <option value="cheap">ارزان‌ترین</option>
              <option value="exp">گران‌ترین</option>
              <option value="rate">بیشترین امتیاز</option>
            </select>
          </div>

          {hasAnyFilter ? (
            <button
              className="link-danger"
              id="reset"
              type="button"
              style={{ alignSelf: "flex-end" }}
              onClick={resetFilters}
            >
              پاک کردن فیلترها
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
                "--od-gap": "16px",
                alignItems: "flex-start",
              } as React.CSSProperties
            }
          >
            {/* Category Cluster */}
            <div className="filter-group">
              <span>دسته</span>
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
              <span>حداکثر قیمت (تومان)</span>
              <div className="od-row">
                <input
                  type="range"
                  id="f-price"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={activeMaxPrice}
                  style={{ width: "220px" }}
                  aria-label="حداکثر قیمت"
                  aria-describedby="price-out"
                  onChange={(e) =>
                    updateFilters({ maxPrice: Number(e.target.value) })
                  }
                />
                <output id="price-out" className="mono-num od-nowrap">
                  تا {toFa(groupNum(activeMaxPrice))} تومان
                </output>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="filter-group">
              <span>رنگ نخ</span>
              <div
                className="od-row"
                id="f-color"
                role="group"
                aria-label="فیلتر رنگ"
                style={{ flexWrap: "wrap" }}
              >
                {colors.map((c) => {
                  const isSelected = activeColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className="swatch"
                      style={{ "--c": c.hex } as React.CSSProperties}
                      title={c.label}
                      aria-label={`رنگ ${c.label}`}
                      aria-pressed={isSelected}
                      onClick={() =>
                        updateFilters({
                          color: isSelected ? undefined : c.id,
                        })
                      }
                    />
                  );
                })}
              </div>
            </div>

            {/* Stock Switch */}
            <div className="filter-group">
              <span>موجودی</span>
              <label className="switch">
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
