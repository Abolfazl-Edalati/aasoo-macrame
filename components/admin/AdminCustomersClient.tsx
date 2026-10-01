"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { AdminCustomerListItem } from "@/lib/admin/customers";
import { formatTomanDigits, toFa } from "@/lib/format";

export type AdminCustomersClientProps = {
  initialCustomers: AdminCustomerListItem[];
};

export function AdminCustomersClient({
  initialCustomers,
}: AdminCustomersClientProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return initialCustomers;
    const q = search.trim().toLowerCase();
    return initialCustomers.filter(
      (c) =>
        c.phone.includes(q) ||
        (c.name && c.name.toLowerCase().includes(q))
    );
  }, [initialCustomers, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line">
        <div>
          <h1 className="font-display text-2xl text-ink">مشتریان</h1>
          <p className="text-xs text-ink-3 mt-1">
            مجموعاً {toFa(initialCustomers.length)} مشتری ثبت‌نام‌شده با تأیید شماره موبایل (بدون امکان حذف در نسخه v1).
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جست‌وجوی شماره موبایل یا نام مشتری…"
            className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm placeholder:text-ink-3 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Customer List */}
      {filtered.length === 0 ? (
        <div className="bg-surface rounded-xl border border-line p-12 text-center text-ink-3">
          هیچ مشتری با مشخصات وارد شده یافت نشد.
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-surface-alt border-b border-line text-ink-2 font-medium">
                <tr>
                  <th className="p-3.5">مشتری</th>
                  <th className="p-3.5">شماره موبایل</th>
                  <th className="p-3.5">تعداد سفارش‌ها</th>
                  <th className="p-3.5">مجموع خرید</th>
                  <th className="p-3.5">تاریخ عضویت</th>
                  <th className="p-3.5 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {filtered.map((customer) => {
                  const joinedDate = new Date(
                    customer.createdAt * 1000
                  ).toLocaleDateString("fa-IR", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-bg/50 transition-colors"
                    >
                      <td className="p-3.5 font-bold text-ink text-sm">
                        {customer.name || "کاربر بدون نام"}
                      </td>
                      <td className="p-3.5 font-mono text-ink-2" dir="ltr">
                        {customer.phone}
                      </td>
                      <td className="p-3.5 text-ink">
                        {toFa(customer.ordersCount)} سفارش
                      </td>
                      <td className="p-3.5 font-medium text-ink">
                        {customer.totalSpentToman > 0 ? (
                          <span>
                            {formatTomanDigits(customer.totalSpentToman)} تومان
                          </span>
                        ) : (
                          <span className="text-ink-3">بدون خرید موفق</span>
                        )}
                      </td>
                      <td className="p-3.5 text-ink-3">{joinedDate}</td>
                      <td className="p-3.5 text-left">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="btn btn--outline btn--sm text-xs"
                        >
                          مشاهده پرونده
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
