import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminProductDetail } from "@/lib/admin/products";
import { getAdminCollections, getAdminColors } from "@/lib/admin/taxonomy";
import { getAdminImagesList } from "@/lib/admin/uploads";
import { AdminProductEditorClient } from "@/components/admin/AdminProductEditorClient";

export const metadata: Metadata = {
  title: "ویرایش محصول — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);

  if (isNaN(numId)) {
    notFound();
  }

  const product = getAdminProductDetail(numId);
  if (!product) {
    notFound();
  }

  const collections = getAdminCollections();
  const colors = getAdminColors();
  const availableImages = getAdminImagesList();

  return (
    <main className="wrap py-6">
      <AdminProductEditorClient
        product={product}
        collections={collections}
        colors={colors}
        availableImages={availableImages}
      />
    </main>
  );
}
