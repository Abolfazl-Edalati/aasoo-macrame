import React from "react";
import type { Metadata } from "next";
import { getAdminSettings } from "@/lib/admin/settings";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export const metadata: Metadata = {
  title: "تنظیمات کارگاه — پیشخوان کارگاه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminSettingsPage() {
  const settingsData = getAdminSettings();

  return (
    <main className="wrap py-6">
      <AdminSettingsClient initialSettings={settingsData} />
    </main>
  );
}
