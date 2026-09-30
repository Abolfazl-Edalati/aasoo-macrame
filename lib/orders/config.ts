import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const ORDER_CONFIG = {
  CODE_LENGTH: 6,
  CARD_STALENESS_SECONDS: 72 * 3600, // 72 hours from declared_at (computed, never stored)
  CARD_AUTO_CANCEL_SECONDS: 24 * 3600, // 24 hours if never declared
  GATEWAY_AUTO_CANCEL_SECONDS: 24 * 3600, // 24 hours
  DEFAULT_CARD_INFO: {
    bankName: "بانک ملی ایران",
    cardNumber: "۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸",
    cardHolder: "زهرا مهدوی (کارگاه گِرِه)",
    shaba: "IR120170000000123456789012",
  },
} as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, { label: string; class: string }> = {
  "awaiting-payment": {
    label: "در انتظار پرداخت",
    class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  "paid": {
    label: "پرداخت‌شده",
    class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  "in-progress": {
    label: "در حال بافت",
    class: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  "shipped": {
    label: "ارسال‌شده",
    class: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  },
  "delivered": {
    label: "تحویل‌شده",
    class: "bg-slate-500/10 text-slate-700 border-slate-500/20",
  },
  "cancelled": {
    label: "لغوشده",
    class: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
  "cancelled-refunded": {
    label: "لغو و مستردشده",
    class: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, { label: string; class: string }> = {
  "undeclared": {
    label: "در انتظار اعلام پرداخت",
    class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  "declared": {
    label: "اعلام‌شده (در انتظار بررسی)",
    class: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  },
  "approved": {
    label: "تأییدشده",
    class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  "rejected": {
    label: "ردشده",
    class: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
  "pending": {
    label: "در انتظار پرداخت درگاه",
    class: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  "verified": {
    label: "پرداخت موفق",
    class: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  },
  "expired": {
    label: "منقضی‌شده",
    class: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  },
};

export const ORDER_ERRORS = {
  EMPTY_CART: "سبد خرید شما خالی است.",
  INVALID_CUSTOMER: "حساب کاربری یافت نشد یا معتبر نیست.",
  INVALID_RECIPIENT_NAME: "نام و نام خانوادگی تحویل‌گیرنده الزامی است.",
  INVALID_ADDRESS: "آدرس پستی باید حداقل ۱۲ نویسه باشد.",
  ORDER_NOT_FOUND: "سفارش مورد نظر یافت نشد.",
  UNAUTHORIZED: "شما به این سفارش دسترسی ندارید.",
  CANNOT_CANCEL_PAID: "سفارش پرداخت‌شده قابل لغو توسط مشتری نیست.",
  CANNOT_CANCEL_STATUS: "این سفارش در وضعیت فعلی امکان لغو ندارد.",
  INVALID_CARD_LAST4: "لطفاً ۴ رقم آخر کارت مبدأ را به درستی وارد کنید.",
  ALREADY_APPROVED: "پرداخت این سفارش قبلاً تأیید شده است.",
  INVALID_TRANSITION: "تغییر وضعیت سفارش با این مشخصات امکان‌پذیر نیست.",
  STOCK_DEPLETED: "موجودی کالای انتخابی به اتمام رسیده است.",
} as const;
