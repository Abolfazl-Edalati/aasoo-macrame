import React from "react";
import type { Metadata } from "next";
import { getAdminOrdersList } from "@/lib/admin/orders";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";

export const metadata: Metadata = {
  title: "مدیریت سفارش‌ها — پیشخوان کارگاه گِرِه",
  robots: {
    index: false,
    follow: false,
  },
};

type AdminOrdersPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const resolved = await searchParams;
  const statusParam = typeof resolved.status === "string" ? resolved.status : "all";

  const orders = getAdminOrdersList();

  return (
    <main id="main" className="wrap py-8 space-y-6">
      <div className="flex justify-between items-end border-b border-line pb-3">
        <div>
          <h1 className="font-display text-2xl text-ink">سفارش‌ها</h1>
          <p className="text-xs text-ink-2 mt-1">
            فهرست فشرده و مدیریت تمام سفارش‌های فروشگاه، فیلتر براساس وضعیت و جست‌وجوی مشتری.
          </p>
        </div>
      </div>

      <AdminOrdersClient
        initialOrders={orders}
        initialFilter={statusParam}
      />
    </main>
  );
}
