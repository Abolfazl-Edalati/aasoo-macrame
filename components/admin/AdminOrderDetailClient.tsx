"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTomanDigits, toFa } from "@/lib/format";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin/StatusBadge";
import {
  approveDeclarationAction,
  rejectDeclarationAction,
  overrideApproveOrderAction,
  transitionOrderStatusAction,
} from "@/app/admin/orders/actions";
import type { OrderStatus, PaymentPath, PaymentStatus } from "@/db/schema";

export type AdminOrderDetailClientProps = {
  detail: {
    order: {
      id: number;
      code: string;
      customerId: number;
      status: OrderStatus;
      recipientName: string;
      addressText: string;
      postalCode: string | null;
      subtotalToman: number;
      shippingToman: number;
      discountToman: number;
      totalToman: number;
      promoCode: string | null;
      promoPercent: number | null;
      trackingCode: string | null;
      note: string | null;
      createdAt: number;
      updatedAt: number;
    };
    customer: {
      id: number;
      phone: string;
      name: string | null;
    } | null;
    payment: {
      id: number;
      path: PaymentPath;
      status: PaymentStatus;
      last4: string | null;
      traceCode: string | null;
      declaredAt: number | null;
      rejectReason: string | null;
      staffNote: string | null;
      authority: string | null;
      refId: string | null;
    } | null;
    lines: Array<{
      id: number;
      name: string;
      sizeLabel: string | null;
      colorLabel: string | null;
      unitPriceToman: number;
      qty: number;
      lineTotalToman: number;
    }>;
    declarations: Array<{
      id: number;
      last4: string;
      traceCode: string | null;
      declaredAt: number;
      outcome: "pending" | "approved" | "rejected";
      rejectReason: string | null;
      reviewedAt: number | null;
    }>;
    isStale: boolean;
  };
};

export function AdminOrderDetailClient({ detail }: AdminOrderDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { order, customer, payment, lines, declarations, isStale } = detail;

  // Local form state for reviews and transitions
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectStaffNote, setRejectStaffNote] = useState("");

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStaffNote, setOverrideStaffNote] = useState("");

  const [trackingInput, setTrackingInput] = useState(order.trackingCode || "");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const clearMessages = () => {
    setActionError(null);
    setActionSuccess(null);
  };

  // 1. Approve declaration
  const handleApprove = () => {
    clearMessages();
    startTransition(async () => {
      const res = await approveDeclarationAction(order.id);
      if (res.success) {
        setActionSuccess("پرداخت سفارش با موفقیت تأیید شد و وضعیت به «پرداخت‌شده» تغییر یافت.");
        router.refresh();
      } else {
        setActionError(res.error || "خطا در تأیید پرداخت");
      }
    });
  };

  // 2. Reject declaration
  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setActionError("وارد کردن دلیل رد پرداخت الزامی است.");
      return;
    }

    clearMessages();
    startTransition(async () => {
      const res = await rejectDeclarationAction(
        order.id,
        rejectReason.trim(),
        rejectStaffNote.trim() || undefined
      );
      if (res.success) {
        setShowRejectModal(false);
        setRejectReason("");
        setRejectStaffNote("");
        setActionSuccess("اعلام فیش پرداخت رد شد و دلیل برای مشتری ثبت گردید.");
        router.refresh();
      } else {
        setActionError(res.error || "خطا در رد پرداخت");
      }
    });
  };

  // 3. Override approve
  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    startTransition(async () => {
      const res = await overrideApproveOrderAction(
        order.id,
        overrideStaffNote.trim() || undefined
      );
      if (res.success) {
        setShowOverrideModal(false);
        setOverrideStaffNote("");
        setActionSuccess("پرداخت سفارش به صورت دستی (توسط همکار) تأیید شد.");
        router.refresh();
      } else {
        setActionError(res.error || "خطا در تأیید دستی پرداخت");
      }
    });
  };

  // 4. Status transition
  const handleTransition = (
    newStatus: OrderStatus,
    options?: { trackingCode?: string; note?: string }
  ) => {
    clearMessages();
    startTransition(async () => {
      const res = await transitionOrderStatusAction(order.id, newStatus, options);
      if (res.success) {
        setActionSuccess(`وضعیت سفارش با موفقیت به «${newStatus}» تغییر یافت.`);
        router.refresh();
      } else {
        setActionError(res.error || "خطا در تغییر وضعیت سفارش");
      }
    });
  };

  const createdDateStr = new Date(order.createdAt * 1000).toLocaleDateString(
    "fa-IR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div className="space-y-8">
      {/* Top back link and header */}
      <div className="space-y-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-accent font-medium transition-colors"
        >
          <span>→</span>
          <span>بازگشت به فهرست سفارش‌ها</span>
        </Link>

        <div className="flex justify-between items-start flex-wrap gap-4 border-b border-line pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-bold text-ink">
                سفارش {order.code}
              </h1>
              <span className="text-xs text-ink-3">· {createdDateStr}</span>
            </div>
            <div className="text-xs text-ink-2">
              <span>مشتری: </span>
              <strong className="text-ink">{customer?.name || order.recipientName}</strong>
              {" · "}
              <span className="font-mono">{customer?.phone}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <OrderStatusBadge status={order.status} />
            {payment && <PaymentStatusBadge status={payment.status} />}
            {isStale && (
              <span className="st st--stale">
                ⚠️ بیش از ۷۲ ساعت گذشته
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action feedback banners */}
      {actionError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          {actionSuccess}
        </div>
      )}

      {/* SECTION 1: Order lines snapshot */}
      <section className="card p-6 space-y-4">
        <div className="flex justify-between items-baseline border-b border-line pb-3">
          <h2 className="font-bold text-base text-ink">
            اقلام سفارش
          </h2>
          <span className="text-xs text-ink-3">
            اسنپ‌شات قطعی در زمان ثبت — تغییرات بعدی کاتالوگ در این تاریخچه اثر ندارد.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="pt w-full">
            <thead>
              <tr>
                <th>محصول</th>
                <th>اندازه</th>
                <th>رنگ</th>
                <th>تعداد</th>
                <th>قیمت واحد</th>
                <th>جمع</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id}>
                  <td className="font-medium text-ink">{l.name}</td>
                  <td className="text-ink-2">{l.sizeLabel || "—"}</td>
                  <td className="text-ink-2">{l.colorLabel || "—"}</td>
                  <td className="font-mono text-ink">{toFa(l.qty)}</td>
                  <td className="font-mono text-ink od-nowrap">
                    {formatTomanDigits(l.unitPriceToman)} تومان
                  </td>
                  <td className="font-mono font-bold text-ink od-nowrap">
                    {formatTomanDigits(l.lineTotalToman)} تومان
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing breakdown */}
        <div className="border-t border-line/60 pt-4 flex flex-col items-end gap-1.5 text-xs text-ink-2">
          <div className="flex justify-between w-64">
            <span>جمع اقلام:</span>
            <span className="font-mono font-medium text-ink">
              {formatTomanDigits(order.subtotalToman)} تومان
            </span>
          </div>

          <div className="flex justify-between w-64 items-center">
            <span>هزینه ارسال:</span>
            {order.shippingToman === 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                ارسال رایگان
              </span>
            ) : (
              <span className="font-mono font-medium text-ink">
                {formatTomanDigits(order.shippingToman)} تومان
              </span>
            )}
          </div>

          {order.discountToman > 0 && (
            <div className="flex justify-between w-64 text-emerald-700">
              <span>
                تخفیف{order.promoCode ? ` (${order.promoCode})` : ""}:
              </span>
              <span className="font-mono font-bold">
                −{formatTomanDigits(order.discountToman)} تومان
              </span>
            </div>
          )}

          <div className="flex justify-between w-64 text-sm font-bold text-ink border-t border-line/80 pt-2 mt-1">
            <span>مبلغ کل پرداختی:</span>
            <span className="font-mono text-base text-accent">
              {formatTomanDigits(order.totalToman)} تومان
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Payment & Declarations audit */}
      <section className="card p-6 space-y-5">
        <div className="flex justify-between items-center border-b border-line pb-3">
          <h2 className="font-bold text-base text-ink">
            اطلاعات و بازبینی پرداخت
          </h2>
          <span className="text-xs text-ink-3">
            مسیر: {payment?.path === "card" ? "کارت‌به‌کارت" : "درگاه زرین‌پال"}
          </span>
        </div>

        {payment?.path === "card" ? (
          <div className="space-y-4">
            {/* 72h-stale alert */}
            {isStale && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <strong>هشدار دیرکرد بررسی:</strong> بیش از ۷۲ ساعت از آخرین اعلام کارت‌به‌کارت می‌گذرد.
                  اگر واریزی در حساب ننشسته است، لطفاً اعلام را رد کنید تا ظرفیت سفارش آزاد شود.
                </div>
              </div>
            )}

            {/* Declarations audit history */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-ink-2">تاریخچه اعلام‌های فیش واریزی:</h3>
              {declarations.length === 0 ? (
                <div className="text-xs text-ink-3 p-3 bg-surface-alt rounded-lg">
                  هنوز هیچ فیش پرداختی برای این سفارش ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-2">
                  {declarations.map((d, idx) => {
                    const decDate = new Date(d.declaredAt * 1000).toLocaleDateString(
                      "fa-IR",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );
                    return (
                      <div
                        key={d.id}
                        className={`p-3 rounded-lg border text-xs flex justify-between items-center flex-wrap gap-2 ${
                          idx === 0 ? "bg-surface border-line" : "bg-surface-alt/50 border-line/60"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span>کارت مبدا: <strong className="font-mono">•••• {d.last4}</strong></span>
                            {d.traceCode && (
                              <span> · پیگیری: <strong className="font-mono">{d.traceCode}</strong></span>
                            )}
                            <span className="text-ink-3">· {decDate}</span>
                          </div>

                          {d.rejectReason && (
                            <div className="text-rose-700 text-[11px]">
                              دلیل رد: {d.rejectReason}
                            </div>
                          )}
                        </div>

                        <div>
                          {d.outcome === "pending" && (
                            <span className="st st--warn">در انتظار بررسی</span>
                          )}
                          {d.outcome === "approved" && (
                            <span className="st st--ok">تأییدشده</span>
                          )}
                          {d.outcome === "rejected" && (
                            <span className="st st--err">ردشده</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Declaration review actions (if order is awaiting-payment) */}
            {order.status === "awaiting-payment" && (
              <div className="pt-4 border-t border-line/60 space-y-3">
                <span className="text-xs font-bold text-ink">عملیات بررسی پرداخت:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {payment.status === "declared" && (
                    <>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={handleApprove}
                        className="btn btn--primary btn--sm text-xs cursor-pointer"
                      >
                        {isPending ? "در حال ثبت…" : "واریزی هست — تأیید پرداخت"}
                      </button>

                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => setShowRejectModal(true)}
                        className="btn btn--outline btn--sm text-xs text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer"
                      >
                        واریزی نیست — رد اعلام
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setShowOverrideModal(true)}
                    className="btn btn--quiet btn--sm text-xs cursor-pointer"
                  >
                    تأیید دستی (override) برای پرداخت حضوری/تلفنی
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 text-xs text-ink-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-surface-alt rounded-lg border border-line">
              <div>
                شناسه درخواست (Authority):{" "}
                <strong className="font-mono text-ink">
                  {payment?.authority || "—"}
                </strong>
              </div>
              <div>
                شماره پیگیری (RefID):{" "}
                <strong className="font-mono text-ink">
                  {payment?.refId || "—"}
                </strong>
              </div>
              <div>
                مبلغ تراکنش به ریال:{" "}
                <strong className="font-mono text-ink">
                  {toFa(order.totalToman * 10)} ریال
                </strong>
              </div>
              <div>
                وضعیت درگاه: <PaymentStatusBadge status={payment?.status || "pending"} />
              </div>
            </div>

            {payment?.status === "pending" && (
              <p className="text-ink-3 text-[11px] leading-relaxed">
                پرداخت این سفارش توسط درگاه معلق است. کران جاب بازیابی تراکنش هر ۱۵ دقیقه وضعیت را بررسی و در صورت موفقیت تأیید می‌کند.
              </p>
            )}

            {order.status === "awaiting-payment" && (
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowOverrideModal(true)}
                  className="btn btn--quiet btn--sm text-xs cursor-pointer"
                >
                  تأیید دستی (override) با یادداشت همکار
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 3: Shipping Address Snapshot */}
      <section className="card p-6 space-y-3">
        <h2 className="font-bold text-base text-ink border-b border-line pb-3">
          نشانی تحویل گیرنده (اسنپ‌شات)
        </h2>

        <div className="text-xs text-ink-2 space-y-1.5 leading-relaxed">
          <div>
            گیرنده: <strong className="text-ink">{order.recipientName}</strong>
            {" · "}
            شماره تماس: <span className="font-mono text-ink">{customer?.phone}</span>
          </div>
          <div>
            آدرس کامل: <span className="text-ink">{order.addressText}</span>
          </div>
          {order.postalCode && (
            <div>
              کد پستی: <span className="font-mono text-ink">{order.postalCode}</span>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: Workshop & Order Ops lifecycle transitions */}
      <section className="card p-6 space-y-4">
        <h2 className="font-bold text-base text-ink border-b border-line pb-3">
          جریان کارگاه و وضعیت سفارش
        </h2>

        <div className="space-y-4 text-xs">
          {order.trackingCode && (
            <div className="p-3 bg-surface-alt rounded-lg border border-line flex items-center justify-between">
              <span>کد رهگیری پستی مرسوله:</span>
              <strong className="font-mono text-base text-ink font-bold">
                {order.trackingCode}
              </strong>
            </div>
          )}

          {/* Action triggers depending on current order.status */}
          <div className="flex items-center gap-3 flex-wrap">
            {order.status === "paid" && (
              <>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleTransition("in-progress")}
                  className="btn btn--dark btn--sm text-xs cursor-pointer"
                >
                  {isPending ? "در حال ثبت…" : "شروع بافت در کارگاه (در حال بافت)"}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    if (
                      confirm(
                        "توجه: بازپرداخت مبلغ به مشتری به صورت خارج از سامانه انجام می‌شود. آیا از لغو سفارش و بازگشت موجودی کالاها اطمینان دارید؟"
                      )
                    ) {
                      handleTransition("cancelled-refunded", {
                        note: "لغو توسط همکار کارگاه و استرداد وجه خارج از سامانه",
                      });
                    }
                  }}
                  className="btn btn--outline btn--sm text-xs text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer"
                >
                  لغو و بازپرداخت وجه
                </button>
              </>
            )}

            {order.status === "in-progress" && (
              <div className="space-y-3 w-full">
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="کد رهگیری پستی (اختیاری)"
                    className="h-9 px-3 rounded border border-line bg-surface text-ink text-xs font-mono flex-1 focus:outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() =>
                      handleTransition("shipped", {
                        trackingCode: trackingInput.trim() || undefined,
                      })
                    }
                    className="btn btn--dark btn--sm text-xs shrink-0 cursor-pointer"
                  >
                    {isPending ? "در حال ثبت…" : "ارسال شد + ثبت کد رهگیری"}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      if (
                        confirm(
                          "توجه: بازپرداخت مبلغ خارج از سامانه است. آیا مایل به لغو سفارش و بازگشت موجودی کالا هستید؟"
                        )
                      ) {
                        handleTransition("cancelled-refunded", {
                          note: "لغو سفارش حین بافت و استرداد وجه خارج از سامانه",
                        });
                      }
                    }}
                    className="btn btn--outline btn--sm text-xs text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer"
                  >
                    لغو و بازپرداخت وجه
                  </button>
                </div>
              </div>
            )}

            {order.status === "shipped" && (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleTransition("delivered")}
                  className="btn btn--primary btn--sm text-xs cursor-pointer"
                >
                  {isPending ? "در حال ثبت…" : "مرسوله تحویل شد (تکمیل)"}
                </button>
                <p className="text-[11px] text-ink-3">
                  سفارش ارسال شده است. امکان لغو سفارش پس از تحویل به پست وجود ندارد.
                </p>
              </div>
            )}

            {order.status === "awaiting-payment" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (confirm("آیا از لغو این سفارش پرداخت‌نشده اطمینان دارید؟")) {
                    handleTransition("cancelled");
                  }
                }}
                className="btn btn--outline btn--sm text-xs text-rose-700 border-rose-300 hover:bg-rose-50 cursor-pointer"
              >
                لغو سفارش
              </button>
            )}

            {order.status === "delivered" && (
              <div className="text-emerald-700 font-medium">
                ✓ این سفارش با موفقیت تحویل مشتری گردیده و به پایان رسیده است.
              </div>
            )}

            {order.status === "cancelled-refunded" && (
              <div className="text-rose-700 font-medium">
                این سفارش لغو و بازپرداخت شده است. موجودی کالاهای آن در انبار بازیابی گردید.
              </div>
            )}

            {order.status === "cancelled" && (
              <div className="text-ink-3">
                این سفارش لغو شده است.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Staff Notes if any */}
      {(order.note || payment?.staffNote) && (
        <section className="card p-6 space-y-2">
          <h2 className="font-bold text-xs text-ink-2">یادداشت پرسنل:</h2>
          <div className="text-xs text-ink bg-surface-alt p-3 rounded-lg border border-line">
            {order.note || payment?.staffNote}
          </div>
        </section>
      )}

      {/* MODAL: Reject declaration */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-ink">
              رد اعلام فیش کارت‌به‌کارت
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              این دلیل به مشتری در صفحه پیگیری سفارش نشان داده می‌شود تا در صورت نیاز فیش صحیح را مجدداً بارگذاری کند.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-ink">
                  علت رد اعلام (نمایش به مشتری):
                </span>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="مثال: فیش واریزی ناخواناست یا واریزی به حساب ننشسته است."
                  className="w-full p-3 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                />
              </label>

              {/* Quick presets */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    setRejectReason("فیش واریزی ناخواناست یا واریزی به حساب ننشسته است.")
                  }
                  className="px-2 py-1 bg-surface-alt border border-line rounded text-[11px] text-ink-2 hover:text-ink cursor-pointer"
                >
                  فیش ناخوانا / عدم واریز
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setRejectReason("مبلغ واریز شده کمتر از مبلغ فاکتور سفارش است.")
                  }
                  className="px-2 py-1 bg-surface-alt border border-line rounded text-[11px] text-ink-2 hover:text-ink cursor-pointer"
                >
                  کسری مبلغ واریزی
                </button>
              </div>

              <label className="block space-y-1">
                <span className="text-xs font-medium text-ink">
                  یادداشت داخلی همکار (اختیاری):
                </span>
                <input
                  type="text"
                  value={rejectStaffNote}
                  onChange={(e) => setRejectStaffNote(e.target.value)}
                  placeholder="یادداشت پرسنل برای بررسی‌های بعدی"
                  className="w-full h-9 px-3 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn--outline btn--sm text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn--primary btn--sm text-xs text-white bg-rose-600 hover:bg-rose-700 border-rose-600 cursor-pointer"
                >
                  {isPending ? "در حال ثبت…" : "تأیید رد اعلام"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Override approve */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-surface border border-line rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-base text-ink">
              تأیید دستی پرداخت (Override)
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              این عمل برای پرداخت‌های نقدی، حضوری یا هماهنگی تلفنی است و سفارش را مستقیماً به وضعیت «پرداخت‌شده» می‌برد و موجودی انبار کسر می‌گردد.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-ink">
                  علت تأیید دستی و یادداشت همکار:
                </span>
                <textarea
                  rows={2}
                  value={overrideStaffNote}
                  onChange={(e) => setOverrideStaffNote(e.target.value)}
                  placeholder="مثال: تسویه حضوری در محل کارگاه انجام شد."
                  className="w-full p-3 rounded-lg border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => setShowOverrideModal(false)}
                  className="btn btn--outline btn--sm text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn btn--primary btn--sm text-xs cursor-pointer"
                >
                  {isPending ? "در حال ثبت…" : "تأیید دستی پرداخت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
