"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { staffLogoutAction } from "@/app/admin/login/actions";
import { toFa } from "@/lib/format";

export type AdminNavProps = {
  staffDisplayName?: string;
  attentionCount?: number;
};

const NAV_ITEMS = [
  { href: "/admin", label: "خانه", exact: true, showCount: true },
  { href: "/admin/orders", label: "سفارش‌ها", exact: false },
  { href: "/admin/custom-orders", label: "درخواست‌های بافت", exact: false },
  { href: "/admin/products", label: "محصولات", exact: false },
  { href: "/admin/collections", label: "دسته و رنگ", exact: false, matchAlso: ["/admin/taxonomy"] },
  { href: "/admin/customers", label: "مشتری‌ها", exact: false },
  { href: "/admin/settings", label: "تنظیمات", exact: false },
];

export function AdminNav({
  staffDisplayName = "مدیر کارگاه",
  attentionCount = 0,
}: AdminNavProps) {
  const pathname = usePathname();

  // If on login page, do not render admin navigation
  if (pathname === "/admin/login") {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-line shadow-xs">
      <div className="wrap py-3 space-y-3">
        {/* Top brand & staff identity bar */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-display text-xl text-ink hover:text-accent transition-colors"
            >
              گِرِه · پیشخوان کارگاه
            </Link>
            <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-surface-alt border border-line text-ink-3">
              پنل مدیریت
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-ink-2 hidden sm:inline">
              همکار: <strong className="text-ink">{staffDisplayName}</strong>
            </span>
            <form action={staffLogoutAction}>
              <button
                type="submit"
                className="btn btn--outline btn--sm text-xs cursor-pointer hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
              >
                خروج
              </button>
            </form>
          </div>
        </div>

        {/* Chip navigation over the seven areas */}
        <nav
          aria-label="بخش‌های پیشخوان"
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {NAV_ITEMS.map((item) => {
            const isMatchAlso = item.matchAlso?.some(
              (m) => pathname === m || pathname.startsWith(`${m}/`)
            );
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                Boolean(isMatchAlso);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`chip shrink-0 ${isActive ? "is-selected" : ""}`}
                aria-pressed={isActive}
              >
                <span>{item.label}</span>
                {item.showCount && attentionCount > 0 && (
                  <span
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-accent text-white text-[11px] font-bold"
                    title={`${toFa(attentionCount)} مورد نیازمند توجه`}
                  >
                    {toFa(attentionCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
