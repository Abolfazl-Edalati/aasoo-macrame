import React from "react";
import type { OrderStatus, PaymentStatus } from "@/db/schema";

export const ORDER_STATUS_FA: Record<OrderStatus, string> = {
  "awaiting-payment": "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  "in-progress": "در حال بافت",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغو‌شده",
  "cancelled-refunded": "لغو و بازپرداخت",
};

export const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  "awaiting-payment": "st--warn",
  paid: "st--ok",
  "in-progress": "",
  shipped: "",
  delivered: "st--ok",
  cancelled: "st--err",
  "cancelled-refunded": "st--err",
};

export const PAYMENT_STATUS_FA: Record<PaymentStatus, string> = {
  undeclared: "اعلام‌نشده",
  declared: "اعلام فیش",
  approved: "پرداخت تأییدشده",
  rejected: "اعلام ردشده",
  pending: "درگاه معلق",
  verified: "تراکنش تأییدشده",
  expired: "منقضی‌شده",
};

export const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  undeclared: "st--warn",
  declared: "st--warn",
  approved: "st--ok",
  rejected: "st--err",
  pending: "st--warn",
  verified: "st--ok",
  expired: "st--err",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const label = ORDER_STATUS_FA[status] ?? status;
  const cls = ORDER_STATUS_CLASS[status] ?? "";
  return <span className={`st ${cls}`}>{label}</span>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const label = PAYMENT_STATUS_FA[status] ?? status;
  const cls = PAYMENT_STATUS_CLASS[status] ?? "";
  return <span className={`st ${cls}`}>{label}</span>;
}
