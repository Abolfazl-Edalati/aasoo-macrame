import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminCustomerDetail } from "@/lib/admin/customers";
import { AdminCustomerDetailClient } from "@/components/admin/AdminCustomerDetailClient";

export const metadata: Metadata = {
  title: "پرونده مشتری — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    notFound();
  }

  const customer = getAdminCustomerDetail(numId);
  if (!customer) {
    notFound();
  }

  return (
    <main className="wrap py-6">
      <AdminCustomerDetailClient customer={customer} />
    </main>
  );
}
