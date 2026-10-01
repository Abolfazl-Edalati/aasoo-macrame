"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AdminProductListItem } from "@/lib/admin/products";
import type { AdminCollectionItem } from "@/lib/admin/taxonomy";
import { formatTomanDigits, toFa } from "@/lib/format";

export type AdminProductsClientProps = {
  initialProducts: AdminProductListItem[];
  collections: AdminCollectionItem[];
};

export function AdminProductsClient({
  initialProducts,
  collections,
}: AdminProductsClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    let result = initialProducts;

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (collectionFilter !== "all") {
      result = result.filter((p) => p.collectionId === collectionFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(q))
      );
    }

    return result;
  }, [initialProducts, statusFilter, collectionFilter, search]);

  const counts = useMemo(() => {
    return {
      all: initialProducts.length,
      published: initialProducts.filter((p) => p.status === "published").length,
      draft: initialProducts.filter((p) => p.status === "draft").length,
    };
  }, [initialProducts]);

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line">
        <div>
          <h1 className="font-display text-2xl text-ink">مدیریت محصولات</h1>
          <p className="text-xs text-ink-3 mt-1">
            مجموعاً {toFa(counts.all)} محصول ({toFa(counts.published)} منتشر شده، {toFa(counts.draft)} پیش‌نویس)
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="btn btn--primary text-sm shrink-0"
        >
          + افزودن محصول جدید
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-line space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جست‌وجوی نام محصول، اسلاگ فارسی…"
              className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`chip text-xs shrink-0 cursor-pointer ${
                statusFilter === "all" ? "is-selected" : ""
              }`}
            >
              همه وضعیت‌ها ({toFa(counts.all)})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("published")}
              className={`chip text-xs shrink-0 cursor-pointer ${
                statusFilter === "published" ? "is-selected" : ""
              }`}
            >
              منتشر شده ({toFa(counts.published)})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("draft")}
              className={`chip text-xs shrink-0 cursor-pointer ${
                statusFilter === "draft" ? "is-selected" : ""
              }`}
            >
              پیش‌نویس ({toFa(counts.draft)})
            </button>
          </div>
        </div>

        {/* Collection Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-line/60 scrollbar-none">
          <span className="text-xs text-ink-3 shrink-0 ml-1">دسته:</span>
          <button
            type="button"
            onClick={() => setCollectionFilter("all")}
            className={`chip text-xs shrink-0 cursor-pointer ${
              collectionFilter === "all" ? "is-selected" : ""
            }`}
          >
            همه دسته‌ها
          </button>
          {collections.map((col) => (
            <button
              key={col.id}
              type="button"
              onClick={() => setCollectionFilter(col.id)}
              className={`chip text-xs shrink-0 cursor-pointer ${
                collectionFilter === col.id ? "is-selected" : ""
              }`}
            >
              {col.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products List */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-12 text-center text-ink-3">
          هیچ محصولی با معیارهای جست‌وجو پیدا نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-surface rounded-xl border border-line p-4 flex flex-col justify-between hover:border-accent/40 transition-colors shadow-xs"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {/* Hero thumbnail */}
                  <div className="w-16 h-16 rounded-lg bg-surface-alt border border-line overflow-hidden shrink-0 relative flex items-center justify-center">
                    {product.heroImage?.path ? (
                      <Image
                        src={product.heroImage.path}
                        alt={product.heroImage.alt || product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs text-ink-3">بدون عکس</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                          product.status === "published"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {product.status === "published" ? "منتشر شده" : "پیش‌نویس"}
                      </span>
                      {product.isNew && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-accent-soft text-accent border border-accent/20 font-medium">
                          جدید
                        </span>
                      )}
                      <span className="text-xs text-ink-3 bg-surface-alt px-1.5 py-0.5 rounded border border-line">
                        {product.collectionName}
                      </span>
                    </div>

                    <h2 className="font-bold text-ink text-base mt-1 truncate">
                      {product.name}
                    </h2>
                    <p className="text-xs text-ink-3 font-mono truncate" dir="ltr">
                      /{product.slug}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-ink-3">قیمت: </span>
                    <strong className="text-ink text-sm">
                      {formatTomanDigits(product.priceToman)} تومان
                    </strong>
                    {product.compareAtToman && (
                      <span className="line-through text-ink-3 text-[11px] mr-1.5">
                        {formatTomanDigits(product.compareAtToman)}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-ink-3">موجودی: </span>
                    <strong
                      className={
                        product.stock === 0
                          ? "text-rose-600 font-bold"
                          : "text-ink"
                      }
                    >
                      {toFa(product.stock)} عدد
                    </strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-line flex items-center justify-between gap-2">
                <Link
                  href={`/product/${product.slug}`}
                  target="_blank"
                  className="text-xs text-accent hover:underline"
                >
                  مشاهده در فروشگاه ↗
                </Link>

                <Link
                  href={`/admin/products/${product.id}`}
                  className="btn btn--outline btn--sm text-xs"
                >
                  ویرایش محصول
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
