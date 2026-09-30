import React from "react";
import Link from "next/link";
import type { KanbanBoardData } from "@/lib/admin/orders";
import { formatTomanDigits, toFa } from "@/lib/format";

export type KanbanBoardProps = {
  board: KanbanBoardData;
};

export function KanbanBoard({ board }: KanbanBoardProps) {
  const columns = [
    {
      key: "paid",
      title: "پرداخت‌شده",
      subtitle: "آماده برای شروع بافت",
      items: board.paid,
      statusClass: "st--ok",
    },
    {
      key: "inProgress",
      title: "در حال بافت",
      subtitle: "در کارگاه",
      items: board.inProgress,
      statusClass: "st--warn",
    },
    {
      key: "shipped",
      title: "ارسال‌شده",
      subtitle: "تحویل پست",
      items: board.shipped,
      statusClass: "st",
    },
  ];

  return (
    <div className="pt-board">
      {columns.map((col) => (
        <section key={col.key} className="min-h-[380px] flex flex-col">
          <div className="flex justify-between items-center pb-2 border-b border-line mb-3">
            <div>
              <h3 className="text-base font-bold text-ink flex items-center gap-2">
                <span>{col.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-line text-ink-2 font-mono">
                  {toFa(col.items.length)}
                </span>
              </h3>
              <span className="text-[11px] text-ink-3">{col.subtitle}</span>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            {col.items.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="block text-inherit no-underline"
              >
                <div className="pt-tile hover:border-accent">
                  <div className="flex justify-between items-start gap-2">
                    <b className="font-mono text-sm text-ink">{order.code}</b>
                    <span className="od-nowrap text-xs text-ink-2 font-medium">
                      {formatTomanDigits(order.totalToman)} تومان
                    </span>
                  </div>

                  <span className="text-xs text-ink-2 font-medium">
                    {order.recipientName}
                  </span>

                  <div className="text-[12px] text-ink-3 line-clamp-2 leading-relaxed">
                    {order.lines.map((l) => `${l.name} (${toFa(l.qty)})`).join(" + ")}
                  </div>

                  {order.trackingCode && (
                    <div className="mt-1 pt-1 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-3">
                      <span>کد رهگیری:</span>
                      <span className="font-mono text-ink font-semibold">
                        {order.trackingCode}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}

            {col.items.length === 0 && (
              <div className="p-6 text-center text-xs text-ink-3 bg-surface/50 border border-dashed border-line rounded-lg">
                سفارشی در این وضعیت نیست
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
