import React from "react";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/server";
import { getAdminAttentionQueue } from "@/lib/admin/orders";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: "پیشخوان مدیریت — گِرِه",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await getCurrentUser();

  if (currentUser?.type !== "staff") {
    return <>{children}</>;
  }

  const attentionItems = getAdminAttentionQueue();

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col" dir="rtl">
      <AdminNav
        staffDisplayName={currentUser.staff.displayName}
        attentionCount={attentionItems.length}
      />
      <div className="flex-1 pb-16">{children}</div>
    </div>
  );
}
