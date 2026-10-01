import React from "react";
import type { Metadata } from "next";
import { getAdminProductsList } from "@/lib/admin/products";
import { getAdminCollections } from "@/lib/admin/taxonomy";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";

export const metadata: Metadata = {
  title: "مدیریت محصولات — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const products = getAdminProductsList();
  const collections = getAdminCollections();

  return (
    <main className="wrap py-6">
      <AdminProductsClient initialProducts={products} collections={collections} />
    </main>
  );
}
