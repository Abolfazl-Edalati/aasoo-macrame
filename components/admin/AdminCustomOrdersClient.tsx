"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AdminCustomOrderItem } from "@/lib/admin/custom-orders";
import {
  archiveCustomOrderAction,
  deleteCustomOrderAction,
} from "@/app/admin/custom-orders/actions";
import { toFa } from "@/lib/format";

export type AdminCustomOrdersClientProps = {
  initialInquiries: AdminCustomOrderItem[];
};

export function AdminCustomOrdersClient({
  initialInquiries,
}: AdminCustomOrdersClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "archived" | "all">("active");
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const counts = useMemo(() => {
    return {
      active: initialInquiries.filter((i) => i.archivedAt === null).length,
      archived: initialInquiries.filter((i) => i.archivedAt !== null).length,
      all: initialInquiries.length,
    };
  }, [initialInquiries]);

  const filtered = useMemo(() => {
    let result = initialInquiries;

    if (search.trim()) {
      // Search by phone or name or description searches across all records
      const q = search.trim().toLowerCase();
      return result.filter(
        (i) =>
          i.phone.includes(q) ||
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }

    if (tab === "active") {
      result = result.filter((i) => i.archivedAt === null);
    } else if (tab === "archived") {
      result = result.filter((i) => i.archivedAt !== null);
    }

    return result;
  }, [initialInquiries, tab, search]);

  const handleToggleArchive = async (item: AdminCustomOrderItem) => {
    setLoadingId(item.id);
    try {
      const willArchive = item.archivedAt === null;
      await archiveCustomOrderAction(item.id, willArchive);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (item: AdminCustomOrderItem) => {
    if (
      !confirm(
        `آیا از حذف درخواست بافت «${item.name}» (${item.phone}) اطمینان دارید؟ این عمل غیرقابل بازگشت است.`
      )
    ) {
      return;
    }

    setLoadingId(item.id);
    try {
      await deleteCustomOrderAction(item.id);
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line">
        <div>
          <h1 className="font-display text-2xl text-ink">
            درخواست‌های بافت سفارشی
          </h1>
          <p className="text-xs text-ink-3 mt-1">
            صندوق پیام‌های سفارش اختصاصی — تمام جزئیات خارج از سایت (تماس/چت) هماهنگ می‌شود؛ بدون وضعیت ترتیبی یا رهگیری مشتری.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجوی شماره تماس یا نام…"
            className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => {
            setTab("active");
            setSearch("");
          }}
          className={`chip text-xs cursor-pointer ${
            tab === "active" && !search ? "is-selected" : ""
          }`}
        >
          در انتظار بررسی ({toFa(counts.active)})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("archived");
            setSearch("");
          }}
          className={`chip text-xs cursor-pointer ${
            tab === "archived" && !search ? "is-selected" : ""
          }`}
        >
          بایگانی شده ({toFa(counts.archived)})
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("all");
            setSearch("");
          }}
          className={`chip text-xs cursor-pointer ${
            tab === "all" && !search ? "is-selected" : ""
          }`}
        >
          همه ({toFa(counts.all)})
        </button>
      </div>

      {/* Inquiry Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-12 text-center text-ink-3">
          هیچ درخواستی در این بخش وجود ندارد.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => {
            const dateStr = new Date(item.createdAt * 1000).toLocaleDateString(
              "fa-IR",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }
            );

            const isArchived = item.archivedAt !== null;

            return (
              <div
                key={item.id}
                className={`bg-surface rounded-xl border p-5 space-y-4 shadow-xs transition-colors ${
                  isArchived
                    ? "border-line/70 opacity-80 bg-surface-alt/40"
                    : "border-line"
                }`}
              >
                {/* Header line: Customer info, tags, and date */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-line/60 pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-ink text-base">
                      {item.name}
                    </span>
                    <a
                      href={`tel:${item.phone}`}
                      className="font-mono text-accent text-sm hover:underline"
                      dir="ltr"
                    >
                      {item.phone}
                    </a>

                    {item.collectionName && (
                      <span className="text-xs bg-surface-alt px-2 py-0.5 rounded border border-line text-ink-2">
                        {item.collectionName}
                      </span>
                    )}

                    {item.isBulk && (
                      <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                        سفارش عمده / تیراژ
                      </span>
                    )}

                    {item.wantsSample && (
                      <span className="text-[11px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-medium">
                        درخواست ارسال نمونه
                      </span>
                    )}

                    {isArchived && (
                      <span className="text-[11px] bg-surface-alt text-ink-3 border border-line px-2 py-0.5 rounded-full">
                        بایگانی‌شده
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-ink-3 shrink-0">{dateStr}</span>
                </div>

                {/* Requirements & Description */}
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-ink-2">
                    {item.dimensionsText && (
                      <div>
                        <strong className="text-ink">ابعاد مد نظر: </strong>
                        <span>{item.dimensionsText}</span>
                      </div>
                    )}
                    {item.deadline && (
                      <div>
                        <strong className="text-ink">مهلت تحویل: </strong>
                        <span>{item.deadline}</span>
                      </div>
                    )}
                  </div>

                  {item.colors.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-xs text-ink-3">رنگ‌های انتخابی:</span>
                      {item.colors.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-line bg-bg text-xs text-ink"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.label}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-bg text-ink text-xs leading-relaxed border border-line whitespace-pre-wrap">
                    {item.description}
                  </div>
                </div>

                {/* Footer Actions: Archive or Delete only */}
                <div className="flex justify-between items-center pt-2 border-t border-line/60">
                  <span className="text-[11px] text-ink-3">
                    کد ثبت داخلی: CO-{String(item.id).padStart(5, "0")}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => handleToggleArchive(item)}
                      className="btn btn--outline btn--sm text-xs cursor-pointer"
                    >
                      {isArchived ? "بازگردانی به کارتابل" : "بایگانی درخواست"}
                    </button>

                    <button
                      type="button"
                      disabled={loadingId === item.id}
                      onClick={() => handleDelete(item)}
                      className="btn btn--outline btn--sm text-xs text-rose-700 hover:bg-rose-50 cursor-pointer"
                    >
                      حذف قطعی
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
