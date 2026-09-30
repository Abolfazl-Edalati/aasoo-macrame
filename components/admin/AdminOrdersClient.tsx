"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { AdminOrderListItem } from "@/lib/admin/orders";
import { formatTomanDigits, toFa } from "@/lib/format";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/StatusBadge";

export type AdminOrdersClientProps = {
  initialOrders: AdminOrderListItem[];
  initialFilter?: string;
};

export function AdminOrdersClient({
  initialOrders,
  initialFilter = "all",
}: AdminOrdersClientProps) {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const counts = useMemo(() => {
    const attention = initialOrders.filter(
      (o) =>
        o.status === "awaiting-payment" &&
        (o.paymentStatus === "declared" ||
          (o.paymentPath === "gateway" && o.paymentStatus === "pending"))
    ).length;

    const open = initialOrders.filter(
      (o) => !["delivered", "cancelled", "cancelled-refunded"].includes(o.status)
    ).length;

    return {
      all: initialOrders.length,
      attention,
      open,
    };
  }, [initialOrders]);

  const filteredOrders = useMemo(() => {
    let result = initialOrders;

    if (filter === "attention") {
      result = result.filter(
        (o) =>
          o.status === "awaiting-payment" &&
          (o.paymentStatus === "declared" ||
            (o.paymentPath === "gateway" && o.paymentStatus === "pending"))
      );
    } else if (filter === "open") {
      result = result.filter(
        (o) => !["delivered", "cancelled", "cancelled-refunded"].includes(o.status)
      );
    } else if (filter !== "all") {
      result = result.filter((o) => o.status === filter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.recipientName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      );
    }

    return result;
  }, [initialOrders, filter, search]);

  const chips = [
    { key: "attention", label: "محتاج توجه", count: counts.attention },
    { key: "open", label: "سفارش‌های باز", count: counts.open },
    { key: "paid", label: "پرداخت‌شده" },
    { key: "in-progress", label: "در حال بافت" },
    { key: "shipped", label: "ارسال‌شده" },
    { key: "all", label: "همه سفارش‌ها", count: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* Search, Filter chips, and view mode toggle */}
      <div className="pt-filters">
        <div className="flex-1 min-w-[240px]">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجوی کد سفارش، نام گیرنده، شماره تماس…"
            className="w-full h-11 px-4 rounded-lg border border-line bg-surface text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {chips.map((c) => {
            const isSelected = filter === c.key;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => setFilter(c.key)}
                className={`chip shrink-0 ${isSelected ? "is-selected" : ""}`}
                aria-pressed={isSelected}
              >
                <span>{c.label}</span>
                {c.count !== undefined && (
                  <span className="chip__count">{toFa(c.count)}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-lg border border-line shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-surface shadow-xs text-ink font-bold"
                : "text-ink-3 hover:text-ink"
            }`}
          >
            کارت‌ها
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              viewMode === "table"
                ? "bg-surface shadow-xs text-ink font-bold"
                : "text-ink-3 hover:text-ink"
            }`}
          >
            جدول فشرده
          </button>
        </div>
      </div>

      {/* Results header */}
      <div className="flex justify-between items-center text-xs text-ink-3">
        <span>
          نمایش {toFa(filteredOrders.length)} سفارش
          {search && ` برای جست‌وجوی «${search}»`}
        </span>
      </div>

      {/* Render list as Table or Cards */}
      {filteredOrders.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-line rounded-lg text-ink-3 text-sm">
          هیچ سفارشی مطابق با فیلتر یا جست‌وجوی انتخابی یافت نشد.
        </div>
      ) : viewMode === "table" ? (
        <div className="overflow-x-auto border border-line rounded-lg bg-surface">
          <table className="pt w-full">
            <thead>
              <tr>
                <th>کد</th>
                <th>گیرنده و تماس</th>
                <th>اقلام</th>
                <th>مسیر پرداخت</th>
                <th>وضعیت سفارش و پرداخت</th>
                <th>مبلغ کل</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const dateStr = new Date(o.createdAt * 1000).toLocaleDateString(
                  "fa-IR",
                  {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                );

                const lineNames = o.lines
                  .map((l) => `${l.name} (${toFa(l.qty)})`)
                  .join(" + ");

                return (
                  <tr
                    key={o.id}
                    className="hover:bg-surface-alt/70 transition-colors cursor-pointer"
                  >
                    <td>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono font-bold text-accent hover:underline"
                      >
                        {o.code}
                      </Link>
                    </td>
                    <td>
                      <div className="font-medium text-ink">{o.recipientName}</div>
                      <div className="font-mono text-xs text-ink-3">
                        {o.customerPhone}
                      </div>
                    </td>
                    <td className="max-w-[240px] truncate" title={lineNames}>
                      {lineNames || `${toFa(o.linesCount)} قلم`}
                    </td>
                    <td>
                      {o.paymentPath === "card" ? "کارت‌به‌کارت" : "درگاه زرین‌پال"}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <OrderStatusBadge status={o.status} />
                        <PaymentStatusBadge status={o.paymentStatus} />
                        {o.isStale && (
                          <span className="st st--stale">⚠️ ۷۲h</span>
                        )}
                      </div>
                    </td>
                    <td className="font-mono font-bold text-ink od-nowrap">
                      {formatTomanDigits(o.totalToman)} تومان
                    </td>
                    <td className="text-xs text-ink-3 od-nowrap">{dateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="pt-queue">
          {filteredOrders.map((o) => {
            const dateStr = new Date(o.createdAt * 1000).toLocaleDateString(
              "fa-IR",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            const isFlagged =
              o.status === "awaiting-payment" &&
              (o.paymentStatus === "declared" ||
                (o.paymentPath === "gateway" && o.paymentStatus === "pending"));

            const lineDetails = o.lines
              .map((l) => {
                const spec = [l.sizeLabel, l.colorLabel]
                  .filter(Boolean)
                  .join(" · ");
                return `${l.name}${spec ? ` (${spec})` : ""} ×${toFa(l.qty)}`;
              })
              .join(" — ");

            return (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="block text-inherit no-underline"
              >
                <article
                  className={`card hover:border-accent transition-colors ${
                    isFlagged ? "is-flag" : ""
                  }`}
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <b className="font-mono text-base text-ink">{o.code}</b>
                      <span className="text-xs text-ink-3">· {dateStr}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                      {o.isStale && (
                        <span className="st st--stale">⚠️ بیش از ۷۲ ساعت</span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-ink-2">
                    <span className="font-medium text-ink">{o.recipientName}</span>
                    {" · "}
                    <span className="font-mono">{o.customerPhone}</span>
                  </div>

                  <div className="text-xs text-ink-2 line-clamp-2 leading-relaxed">
                    {lineDetails || `${toFa(o.linesCount)} قلم کالا`}
                  </div>

                  <div className="flex justify-between items-center text-xs text-ink-3 pt-2 border-t border-line/60">
                    <span>
                      {o.paymentPath === "card"
                        ? "کارت‌به‌کارت"
                        : "درگاه بانکی زرین‌پال"}
                    </span>
                    <b className="font-mono text-sm text-ink od-nowrap">
                      {formatTomanDigits(o.totalToman)} تومان
                    </b>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
