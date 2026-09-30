import React from "react";
import Link from "next/link";
import type { AttentionQueueItem } from "@/lib/admin/orders";
import { formatTomanDigits, toFa } from "@/lib/format";

export type AttentionQueueProps = {
  items: AttentionQueueItem[];
};

export function AttentionQueue({ items }: AttentionQueueProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center bg-surface border border-line rounded-lg text-ink-3 text-sm">
        خالی! در حال حاضر موردی در صف بررسی یا محتاج توجه نیست.
      </div>
    );
  }

  return (
    <div className="pt-queue">
      {items.map((item) => {
        const dateStr = new Date(item.createdAt * 1000).toLocaleDateString(
          "fa-IR",
          {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        );

        return (
          <Link
            key={item.id}
            href={`/admin/orders/${item.id}`}
            className="block text-inherit no-underline"
          >
            <article className={`card hover:border-accent transition-colors ${item.isStale ? "is-flag" : ""}`}>
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-ink">
                    سفارش {item.code}
                  </span>
                  <span className="text-xs text-ink-3">· {dateStr}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.isStale && (
                    <span className="st st--stale">
                      ⚠️ بیش از ۷۲ ساعت گذشته
                    </span>
                  )}
                  {item.paymentPath === "card" ? (
                    <span className="st st--warn">اعلام کارت‌به‌کارت</span>
                  ) : (
                    <span className="st st--warn">درگاه در جریان</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xs text-ink-2 gap-2 pt-1 border-t border-line/60">
                <div>
                  <span className="font-medium text-ink">{item.recipientName}</span>
                  {" · "}
                  <span className="font-mono">{item.customerPhone}</span>
                  {item.paymentPath === "card" && item.last4 && (
                    <>
                      {" · "}
                      <span>کارت: <strong className="font-mono">•••• {item.last4}</strong></span>
                      {item.traceCode && (
                        <span> (پیگیری: <strong className="font-mono">{item.traceCode}</strong>)</span>
                      )}
                    </>
                  )}
                </div>

                <div className="od-nowrap font-medium text-ink">
                  {formatTomanDigits(item.totalToman)} تومان
                </div>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
