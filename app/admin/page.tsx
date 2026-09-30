import React from "react";
import type { Metadata } from "next";
import { getAdminAttentionQueue, getAdminKanbanOrders } from "@/lib/admin/orders";
import { AttentionQueue } from "@/components/admin/AttentionQueue";
import { KanbanBoard } from "@/components/admin/KanbanBoard";

export const metadata: Metadata = {
  title: "پیشخوان کارگاه — گِرِه",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminHomePage() {
  const attentionQueue = getAdminAttentionQueue();
  const kanban = getAdminKanbanOrders();

  return (
    <main id="main" className="wrap py-8 space-y-10">
      {/* SECTION 1: Attention Queue */}
      <section className="space-y-4">
        <div className="flex justify-between items-end border-b border-line pb-3">
          <div>
            <h1 className="font-display text-2xl text-ink">محتاج توجه</h1>
            <p className="text-xs text-ink-2 mt-1">
              اعلام‌های کارت‌به‌کارت نیازمند بررسی، هشدارهای ۷۲ ساعت گذشته، و پرداخت‌های درگاه در انتظار.
            </p>
          </div>
          <span className="text-xs text-ink-3">
            {attentionQueue.length > 0
              ? `${attentionQueue.length} مورد در صف بررسی`
              : "صف بررسی خالی است"}
          </span>
        </div>

        <AttentionQueue items={attentionQueue} />
      </section>

      {/* SECTION 2: Kanban Board (Fulfillment) */}
      <section className="space-y-4">
        <div className="border-b border-line pb-3">
          <h2 className="font-display text-2xl text-ink">جریان بافت</h2>
          <p className="text-xs text-ink-2 mt-1">
            پیگیری سفارش‌های تأییدشده در مراحل تولید و ارسال (پرداخت‌شده → در حال بافت → ارسال‌شده).
          </p>
        </div>

        <KanbanBoard board={kanban} />
      </section>
    </main>
  );
}
