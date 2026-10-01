import React from "react";
import type { Metadata } from "next";
import { getAdminCustomersList } from "@/lib/admin/customers";
import { AdminCustomersClient } from "@/components/admin/AdminCustomersClient";

export const metadata: Metadata = {
  title: "مشتریان — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCustomersPage() {
  const customers = getAdminCustomersList();

  return (
    <main className="wrap py-6">
      <AdminCustomersClient initialCustomers={customers} />
    </main>
  );
}
