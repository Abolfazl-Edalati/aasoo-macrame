"use client";

import React, { useState, useTransition } from "react";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, ORDER_CONFIG } from "@/lib/orders/config";
import type { OrderStatus, PaymentPath, PaymentStatus } from "@/db/schema";
import { toFa, formatTomanDigits } from "@/lib/format";
import { submitDeclarationAction, cancelOrderAction, retryGatewayPaymentAction } from "@/app/order/[code]/actions";
import { TransitionLink } from "@/components/motion/TransitionLink";

type OrderDetailProps = {
  order: {
    id: number;
    code: string;
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
  };
  lines: {
    id: number;
    name: string;
    sizeLabel: string | null;
    colorLabel: string | null;
    unitPriceToman: number;
    qty: number;
  }[];
  payment: {
    id: number;
    path: PaymentPath;
    status: PaymentStatus;
    refId?: string | null;
    authority?: string | null;
    last4: string | null;
    traceCode: string | null;
    rejectReason: string | null;
    declaredAt: number | null;
    approvedAt: number | null;
  } | null;
  declarationsHistory: {
    id: number;
    last4: string;
    traceCode: string | null;
    rejectedReason: string | null;
    createdAt: number;
  }[];
  bankInfo?: {
    bankName: string;
    cardNumber: string;
    cardHolder: string;
    shaba?: string;
  };
};

export function OrderDetailClient({
  order,
  lines,
  payment,
  bankInfo = ORDER_CONFIG.DEFAULT_CARD_INFO,
}: OrderDetailProps) {
  const [last4, setLast4] = useState(payment?.last4 || "");
  const [traceCode, setTraceCode] = useState(payment?.traceCode || "");
  const [isEditingDecl, setIsEditingDecl] = useState(payment?.status === "undeclared" || payment?.status === "rejected");
  const [declError, setDeclError] = useState<string | null>(null);
  const [declSuccess, setDeclSuccess] = useState<string | null>(null);

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusMeta = ORDER_STATUS_LABELS[order.status] || {
    label: order.status,
    class: "bg-surface text-ink border-line",
  };
  const paymentStatusMeta = payment?.status ? PAYMENT_STATUS_LABELS[payment.status] : null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleRetryGateway = () => {
    setGatewayError(null);
    startTransition(async () => {
      const res = await retryGatewayPaymentAction(order.code);
      if (res.success && res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        setGatewayError(res.error || "خطا در اتصال به درگاه پرداخت.");
      }
    });
  };

  const handleSubmitDeclaration = (e: React.FormEvent) => {
    e.preventDefault();
    setDeclError(null);
    setDeclSuccess(null);

    startTransition(async () => {
      const res = await submitDeclarationAction(order.code, last4, traceCode);
      if (res.success) {
        setDeclSuccess("اعلام پرداخت با موفقیت ثبت شد و در صف بررسی کارگاه قرار گرفت.");
        setIsEditingDecl(false);
      } else {
        setDeclError(res.error || "خطا در ثبت اعلام پرداخت.");
      }
    });
  };

  const handleCancelOrder = () => {
    setCancelError(null);

    startTransition(async () => {
      const res = await cancelOrderAction(order.code);
      if (res.success) {
        setConfirmCancel(false);
      } else {
        setCancelError(res.error || "امکان لغو این سفارش وجود ندارد.");
      }
    });
  };

  return (
    <div className="wrap py-10 max-w-4xl mx-auto space-y-8">
      {/* Top Bar / Header */}
      <div className="card p-6 bg-surface border border-line rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-line mb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="eyebrow">سفارش</span>
              <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${statusMeta.class}`}>
                {statusMeta.label}
              </span>
            </div>
            <h1 className="font-display text-2xl text-ink mt-1 flex items-center gap-2">
              کد سفارش: <span className="font-mono tracking-wider">{order.code}</span>
              <button
                type="button"
                onClick={() => handleCopy(order.code, "code")}
                className="text-xs text-ink-3 hover:text-accent font-sans cursor-pointer p-1"
                title="کپی کد سفارش"
              >
                {copiedText === "code" ? "کپی شد ✓" : "کپی"}
              </button>
            </h1>
          </div>

          {/* Self-Cancel Button if Unpaid */}
          {order.status === "awaiting-payment" && (
            <div>
              {!confirmCancel ? (
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                >
                  لغو این سفارش
                </button>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-xs text-rose-700">از لغو سفارش مطمئنید؟</span>
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isPending}
                    className="px-2.5 py-1 bg-rose-600 text-white text-xs rounded-lg hover:bg-rose-700 cursor-pointer"
                  >
                    {isPending ? "در حال لغو..." : "بله، لغو شود"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="text-xs text-ink-2 hover:underline cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {cancelError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl mb-4" role="alert">
            {cancelError}
          </div>
        )}

        {/* Shipped Tracking Code Banner */}
        {(order.status === "shipped" || order.status === "delivered") && order.trackingCode && (
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-xs font-semibold text-purple-900 block">
                {order.status === "delivered" ? "مرسوله تحویل شده است" : "سفارش شما تحویل پست شد"}
              </span>
              <span className="text-xs text-purple-700">کد رهگیری مرسوله پستی:</span>
              <span className="font-mono text-sm font-bold text-purple-900 mx-2">{order.trackingCode}</span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(order.trackingCode!, "tracking")}
              className="btn btn--outline text-xs px-3 py-1.5 cursor-pointer"
            >
              {copiedText === "tracking" ? "کپی شد ✓" : "کپی کد رهگیری"}
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4 text-xs text-ink-2">
          <div>
            <span className="block text-ink-3">تحویل‌گیرنده:</span>
            <span className="font-medium text-ink">{order.recipientName}</span>
          </div>
          <div>
            <span className="block text-ink-3">نشانی ارسال:</span>
            <span className="font-medium text-ink">{order.addressText}</span>
            {order.postalCode && <span className="block text-ink-3 mt-0.5">کد پستی: {order.postalCode}</span>}
          </div>
          {order.note && (
            <div className="sm:col-span-2">
              <span className="block text-ink-3">یادداشت سفارش:</span>
              <span className="text-ink">{order.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* GATEWAY PAYMENT SECTION */}
      {payment?.path === "gateway" && (
        <div className="card p-6 bg-surface border border-line rounded-lg space-y-6">
          <div className="border-b border-line pb-4 flex justify-between items-center">
            <div>
              <h2 className="font-display text-lg text-ink">پرداخت درگاه (زرین‌پال)</h2>
              <p className="text-xs text-ink-2 mt-1">
                پرداخت امن از طریق درگاه با کلیه کارت‌های عضو شبکه شتاب.
              </p>
            </div>
            {paymentStatusMeta && (
              <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${paymentStatusMeta.class}`}>
                {paymentStatusMeta.label}
              </span>
            )}
          </div>

          {/* Success: Verified Status */}
          {payment.status === "verified" && (
            <div className="p-5 bg-paper rounded-lg border border-line space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="text-xs text-ink-3 block">وضعیت پرداخت:</span>
                  <span className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                    مبلغ با موفقیت پرداخت و تأیید شد.
                  </span>
                </div>
                {payment.refId && (
                  <div className="space-y-1 sm:text-left border-t sm:border-t-0 sm:border-r border-line pt-3 sm:pt-0 sm:pr-6">
                    <span className="text-xs text-ink-3 block">شماره مرجع (کد پیگیری درگاه):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-ink" dir="ltr">
                        {payment.refId}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(payment.refId!, "refId")}
                        className="text-xs text-accent hover:underline cursor-pointer"
                      >
                        {copiedText === "refId" ? "کپی شد ✓" : "کپی"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Awaiting-Payment & Pending/Expired */}
          {order.status === "awaiting-payment" && payment.status !== "verified" && (
            <div className="space-y-4">
              {payment.status === "expired" && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg space-y-1">
                  <span className="font-bold block">پرداخت درگاه ناموفق بود یا لغو شد:</span>
                  <p className="leading-relaxed">
                    {payment.rejectReason || "پرداخت به پایان نرسید یا لغو گردید. در صورت کسر وجه از حساب، ظرف ۷۲ ساعت توسط بانک بازگشت داده می‌شود."}
                  </p>
                </div>
              )}

              <div className="p-5 bg-paper rounded-lg border border-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-ink-3 block">مبلغ قابل پرداخت:</span>
                  <span className="od-nowrap font-display text-xl text-accent">
                    {formatTomanDigits(order.totalToman)} تومان
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleRetryGateway}
                  disabled={isPending}
                  className="btn btn--primary btn--lg magnetic cursor-pointer w-full sm:w-auto"
                >
                  {isPending ? "در حال انتقال به درگاه..." : "پرداخت از طریق درگاه زرین‌پال"}
                </button>
              </div>

              {gatewayError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg" role="alert">
                  {gatewayError}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CARD-TO-CARD PAYMENT SECTION */}
      {payment?.path === "card" && (
        <div className="card p-6 bg-surface border border-line rounded-lg space-y-6">
          <div className="border-b border-line pb-4">
            <h2 className="font-display text-lg text-ink">پرداخت کارت به کارت</h2>
            <p className="text-xs text-ink-2 mt-1">
              مبلغ سفارش را به شماره کارت زیر واریز نموده و ۴ رقم آخر کارت خود را ثبت کنید.
            </p>
          </div>

          {/* Bank Card Display Box */}
          <div className="p-5 bg-paper rounded-xl border border-line flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <span className="text-xs text-ink-3 block">{bankInfo.bankName}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold text-ink tracking-wider" dir="ltr">
                  {bankInfo.cardNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(bankInfo.cardNumber.replace(/\D/g, ""), "card")}
                  className="text-xs text-accent hover:underline cursor-pointer"
                >
                  {copiedText === "card" ? "کپی شد ✓" : "کپی"}
                </button>
              </div>
              <span className="text-xs text-ink-2 block">به نام: {bankInfo.cardHolder}</span>
            </div>

            <div className="text-left border-t md:border-t-0 md:border-r border-line pt-3 md:pt-0 md:pr-6">
              <span className="text-xs text-ink-3 block">مبلغ واریزی:</span>
              <span className="font-display text-xl text-accent">
                {formatTomanDigits(order.totalToman)} تومان
              </span>
            </div>
          </div>

          {/* Alert: Rejected Status with reason */}
          {payment.status === "rejected" && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl space-y-1">
              <span className="font-bold block">پرداخت اعلام‌شده توسط کارگاه تأیید نشد:</span>
              <p className="leading-relaxed">{payment.rejectReason || "عدم تطابق مبلغ یا تراکنش ناموفق."}</p>
              <span className="block text-rose-600 mt-2">
                لطفاً اطلاعات واریز را بررسی و مجدداً اعلام فرمایید:
              </span>
            </div>
          )}

          {/* Notice: Declared Status */}
          {payment.status === "declared" && !isEditingDecl && (
            <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex justify-between items-center">
              <div>
                <span className="font-bold block mb-0.5">اعلام پرداخت ثبت شده است</span>
                <span>
                  واریز با کارت ****{payment.last4} در صف بررسی است. تأیید پرداخت تا چند ساعت کاری انجام می‌شود.
                </span>
              </div>
              {order.status === "awaiting-payment" && (
                <button
                  type="button"
                  onClick={() => setIsEditingDecl(true)}
                  className="btn btn--outline text-xs px-3 py-1.5 cursor-pointer mr-3"
                >
                  ویرایش اعلام
                </button>
              )}
            </div>
          )}

          {/* Success: Approved */}
          {payment.status === "approved" && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
              <span className="font-bold block mb-0.5">پرداخت شما تأیید شد ✓</span>
              <span>سفارش با موفقیت ثبت نهایی گردیده و جهت آماده‌سازی به کارگاه ارسال شد.</span>
            </div>
          )}

          {/* Declaration Input Form */}
          {order.status === "awaiting-payment" && (isEditingDecl || payment.status === "undeclared") && (
            <form onSubmit={handleSubmitDeclaration} className="space-y-4 pt-2">
              <h3 className="font-medium text-xs text-ink">ثبت مشخصات واریز</h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="card-last4" className="block text-xs font-medium text-ink mb-1.5">
                    ۴ رقم آخر کارت واریزکننده <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="card-last4"
                    type="text"
                    dir="ltr"
                    maxLength={4}
                    required
                    placeholder="۱۲۳۴"
                    value={last4}
                    onChange={(e) => setLast4(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-center tracking-[0.2em] font-mono text-base focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label htmlFor="bank-trace" className="block text-xs font-medium text-ink mb-1.5">
                    شماره پیگیری بانکی (اختیاری)
                  </label>
                  <input
                    id="bank-trace"
                    type="text"
                    dir="ltr"
                    placeholder="کد پیگیری یا شماره ارجاع"
                    value={traceCode}
                    onChange={(e) => setTraceCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-ink text-left text-sm focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {declError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl" role="alert">
                  {declError}
                </div>
              )}

              {declSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl" role="alert">
                  {declSuccess}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isPending || last4.trim().length !== 4}
                  className="btn btn--primary btn--lg magnetic cursor-pointer"
                >
                  {isPending ? "در حال ثبت..." : "ثبت اعلام پرداخت"}
                </button>

                {payment.status === "declared" && isEditingDecl && (
                  <button
                    type="button"
                    onClick={() => setIsEditingDecl(false)}
                    className="text-xs text-ink-2 hover:underline cursor-pointer"
                  >
                    انصراف
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Order Lines & Pricing Breakdown */}
      <div className="card p-6 bg-surface border border-line rounded-2xl space-y-6">
        <h2 className="font-display text-lg text-ink border-b border-line pb-4">
          اقلام سفارش ({toFa(lines.reduce((s, l) => s + l.qty, 0))} عدد)
        </h2>

        <div className="divide-y divide-line">
          {lines.map((line) => (
            <div key={line.id} className="py-3 flex justify-between items-center gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-ink text-sm block">{line.name}</span>
                <span className="text-ink-2">
                  {line.sizeLabel || "تک‌سایز"} • {line.colorLabel || "پیش‌فرض"} • {toFa(line.qty)} عدد
                </span>
              </div>
              <div className="text-left font-mono">
                <span className="text-ink block">{formatTomanDigits(line.unitPriceToman * line.qty)} تومان</span>
                {line.qty > 1 && (
                  <span className="text-[11px] text-ink-3 block">
                    هر عدد {formatTomanDigits(line.unitPriceToman)} تومان
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="border-t border-line pt-4 space-y-2 text-xs">
          <div className="flex justify-between text-ink-2">
            <span>جمع اقلام:</span>
            <span className="font-mono text-ink">{formatTomanDigits(order.subtotalToman)} تومان</span>
          </div>

          {order.discountToman > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>تخفیف ({order.promoCode || "کد تخفیف"} - ٪{toFa(order.promoPercent || 0)}):</span>
              <span className="font-mono">−{formatTomanDigits(order.discountToman)} تومان</span>
            </div>
          )}

          <div className="flex justify-between text-ink-2">
            <span>هزینه ارسال:</span>
            <span className="font-mono text-ink">
              {order.shippingToman === 0 ? "رایگان" : `${formatTomanDigits(order.shippingToman)} تومان`}
            </span>
          </div>

          <div className="flex justify-between text-sm font-bold text-ink pt-2 border-t border-line">
            <span>مبلغ کل:</span>
            <span className="font-mono text-accent text-base">{formatTomanDigits(order.totalToman)} تومان</span>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-line text-xs">
          <TransitionLink href="/account" className="text-ink-2 hover:text-accent">
            ← بازگشت به حساب کاربری
          </TransitionLink>

          <TransitionLink href="/shop" className="text-accent hover:underline">
            مشاهده سایر محصولات
          </TransitionLink>
        </div>
      </div>
    </div>
  );
}
