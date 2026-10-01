"use client";

import React from "react";
import Link from "next/link";
import type { AdminCustomerDetail } from "@/lib/admin/customers";
import { formatTomanDigits, toFa } from "@/lib/format";
import { OrderStatusBadge } from "@/components/admin/StatusBadge";

export type AdminCustomerDetailClientProps = {
  customer: AdminCustomerDetail;
};

export function AdminCustomerDetailClient({
  customer,
}: AdminCustomerDetailClientProps) {
  const joinedDate = new Date(customer.createdAt * 1000).toLocaleDateString(
    "fa-IR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="text-xs text-ink-3 hover:text-ink transition-colors"
          >
            ← بازگشت به لیست مشتریان
          </Link>
          <span className="text-line">|</span>
          <h1 className="font-display text-xl text-ink">
            پرونده مشتری: {customer.name || customer.phone}
          </h1>
        </div>

        <span className="text-xs bg-surface-alt border border-line px-2.5 py-1 rounded-full text-ink-3 font-mono" dir="ltr">
          {customer.phone}
        </span>
      </div>

      {/* Profile Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border border-line p-5 space-y-1">
          <span className="text-xs text-ink-3">نام و نام خانوادگی</span>
          <p className="font-bold text-ink text-base">
            {customer.name || "ثبت‌نشده (کاربر جدید)"}
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-line p-5 space-y-1">
          <span className="text-xs text-ink-3">تعداد سفارش‌ها</span>
          <p className="font-bold text-ink text-base">
            {toFa(customer.ordersCount)} سفارش
          </p>
        </div>

        <div className="bg-surface rounded-xl border border-line p-5 space-y-1">
          <span className="text-xs text-ink-3">مجموع پرداخت‌های موفق</span>
          <p className="font-bold text-accent text-base">
            {formatTomanDigits(customer.totalSpentToman)} تومان
          </p>
        </div>
      </div>

      {/* Address Book */}
      <div className="bg-surface rounded-xl border border-line p-5 space-y-3">
        <h2 className="font-bold text-ink text-base border-b border-line pb-2">
          دفترچه آدرس‌های ثبت‌شده ({toFa(customer.addresses.length)})
        </h2>

        {customer.addresses.length === 0 ? (
          <p className="text-xs text-ink-3 py-3 text-center">
            هنوز آدرسی توسط این مشتری ثبت نشده است.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customer.addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-bg p-3.5 rounded-lg border border-line space-y-1.5 text-xs"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">{addr.label}</span>
                  <span className="text-ink-3">تحویل‌گیرنده: {addr.recipientName}</span>
                </div>
                <p className="text-ink leading-relaxed">{addr.text}</p>
                {addr.postalCode && (
                  <p className="text-ink-3 font-mono" dir="ltr">
                    کد پستی: {addr.postalCode}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="bg-surface rounded-xl border border-line overflow-hidden shadow-xs">
        <div className="p-4 border-b border-line bg-surface-alt flex justify-between items-center">
          <h2 className="font-bold text-ink text-base">
            تاریخچه سفارش‌های ثبت‌شده ({toFa(customer.orders.length)})
          </h2>
          <span className="text-xs text-ink-3">عضویت از: {joinedDate}</span>
        </div>

        {customer.orders.length === 0 ? (
          <div className="p-8 text-center text-xs text-ink-3">
            این مشتری هنوز سفارشی ثبت نکرده است.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line text-ink-2 font-medium bg-bg/50">
                <tr>
                  <th className="p-3">کد سفارش</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">گیرنده</th>
                  <th className="p-3">اقلام</th>
                  <th className="p-3">مبلغ کل</th>
                  <th className="p-3">تاریخ ثبت</th>
                  <th className="p-3 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {customer.orders.map((o) => {
                  const orderDate = new Date(o.createdAt * 1000).toLocaleDateString(
                    "fa-IR",
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <tr key={o.id} className="hover:bg-bg/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-ink" dir="ltr">
                        {o.code}
                      </td>
                      <td className="p-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="p-3 text-ink-2">{o.recipientName}</td>
                      <td className="p-3 text-ink-3">{toFa(o.linesCount)} قلم</td>
                      <td className="p-3 font-medium text-ink">
                        {formatTomanDigits(o.totalToman)} تومان
                      </td>
                      <td className="p-3 text-ink-3">{orderDate}</td>
                      <td className="p-3 text-left">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="btn btn--outline btn--sm text-[11px]"
                        >
                          مشاهده سفارش
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note about v1 customer deletion */}
      <div className="p-3 rounded-lg bg-surface-alt/70 border border-line text-[11px] text-ink-3">
        توجه: بر اساس مشخصات نسخه v1 سیستم، امکان حذف مشتریان برای حفظ یکپارچگی حسابداری و سابقه سفارش‌ها وجود ندارد.
      </div>
    </div>
  );
}
