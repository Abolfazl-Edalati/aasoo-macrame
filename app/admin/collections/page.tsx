import React from "react";
import type { Metadata } from "next";
import { getAdminCollections, getAdminColors } from "@/lib/admin/taxonomy";
import { AdminTaxonomyClient } from "@/components/admin/AdminTaxonomyClient";

export const metadata: Metadata = {
  title: "دسته‌بندی و رنگ‌ها — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminCollectionsPage() {
  const collections = getAdminCollections();
  const colors = getAdminColors();

  return (
    <main className="wrap py-6">
      <AdminTaxonomyClient
        initialCollections={collections}
        initialColors={colors}
      />
    </main>
  );
}
