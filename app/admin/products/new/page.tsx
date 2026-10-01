import React from "react";
import type { Metadata } from "next";
import { getAdminCollections, getAdminColors } from "@/lib/admin/taxonomy";
import { getAdminImagesList } from "@/lib/admin/uploads";
import { AdminProductEditorClient } from "@/components/admin/AdminProductEditorClient";

export const metadata: Metadata = {
  title: "افزودن محصول جدید — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function NewProductPage() {
  const collections = getAdminCollections();
  const colors = getAdminColors();
  const availableImages = getAdminImagesList();

  return (
    <main className="wrap py-6">
      <AdminProductEditorClient
        collections={collections}
        colors={colors}
        availableImages={availableImages}
      />
    </main>
  );
}
