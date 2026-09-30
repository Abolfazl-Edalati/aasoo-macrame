import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminOrderDetail } from "@/lib/admin/orders";
import { AdminOrderDetailClient } from "@/components/admin/AdminOrderDetailClient";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: AdminOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const detail = getAdminOrderDetail(id);

  if (!detail) {
    return {
      title: "سفارش یافت نشد — پیشخوان کارگاه",
    };
  }

  return {
    title: `سفارش ${detail.order.code} — پیشخوان کارگاه گِرِه`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;
  const detail = getAdminOrderDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <main id="main" className="wrap py-8">
      <AdminOrderDetailClient detail={detail} />
    </main>
  );
}
