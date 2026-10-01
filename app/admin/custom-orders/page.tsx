import React from "react";
import type { Metadata } from "next";
import { getAdminCustomOrdersList } from "@/lib/admin/custom-orders";
import { AdminCustomOrdersClient } from "@/components/admin/AdminCustomOrdersClient";

export const metadata: Metadata = {
  title: "درخواست‌های بافت سفارشی — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCustomOrdersPage() {
  const inquiries = getAdminCustomOrdersList({ includeArchived: true });

  return (
    <main className="wrap py-6">
      <AdminCustomOrdersClient initialInquiries={inquiries} />
    </main>
  );
}
