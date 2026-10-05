import { eq, desc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { ORDER_ERRORS } from "./config";
import { transitionOrderStatus } from "./machine";

/**
 * Normalizes Persian/Arabic digits to ASCII digits and strips formatting.
 */
function normalizeDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/\D/g, "");
}

/**
 * Customer declares a card-to-card transfer for an order (SPEC §5, Issue #17).
 * Lifecycle: undeclared → declared, or rejected → declared (re-declaration).
 * Every declaration attempt is recorded in the `declarations` audit table.
 */
export async function declareCardPayment(
  orderId: number,
  data: { last4: string; traceCode?: string | null },
  customerId: number,
  options?: { db?: typeof defaultDb }
): Promise<{ success: boolean; error?: string }> {
  const db = options?.db ?? defaultDb;

  const order = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!order) {
    return { success: false, error: ORDER_ERRORS.ORDER_NOT_FOUND };
  }

  if (order.customerId !== customerId) {
    return { success: false, error: ORDER_ERRORS.UNAUTHORIZED };
  }

  if (order.status !== "awaiting-payment") {
    return { success: false, error: ORDER_ERRORS.CANNOT_CANCEL_STATUS };
  }

  const payment = db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
  if (!payment) {
    return { success: false, error: "اطلاعات پرداخت برای این سفارش یافت نشد." };
  }

  if (payment.path !== "card") {
    return { success: false, error: "شیوه پرداخت این سفارش کارت‌به‌کارت نیست." };
  }

  if (payment.status === "approved") {
    return { success: false, error: ORDER_ERRORS.ALREADY_APPROVED };
  }

  const cleanLast4 = normalizeDigits(data.last4 || "");
  if (cleanLast4.length !== 4) {
    return { success: false, error: ORDER_ERRORS.INVALID_CARD_LAST4 };
  }

  const cleanTrace = data.traceCode ? data.traceCode.trim() : null;
  const now = Math.floor(Date.now() / 1000);

  // 1. Record attempt in declarations audit table
  db.insert(schema.declarations)
    .values({
      orderId,
      last4: cleanLast4,
      traceCode: cleanTrace,
      createdAt: now,
    })
    .run();

  // 2. Update payment row to declared, clear rejectReason
  db.update(schema.payments)
    .set({
      status: "declared",
      last4: cleanLast4,
      traceCode: cleanTrace,
      declaredAt: now,
      rejectReason: null,
    })
    .where(eq(schema.payments.orderId, orderId))
    .run();

  return { success: true };
}

/**
 * Staff approves a card-to-card payment (SPEC §5).
 * Updates payment status to 'approved' and transitions order to 'paid' (which decrements stock).
 */
export async function approveCardPayment(
  orderId: number,
  context: { staffUserId: number; staffNote?: string },
  options?: { db?: typeof defaultDb }
): Promise<{ success: boolean; error?: string }> {
  const db = options?.db ?? defaultDb;

  const payment = db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
  if (!payment) {
    return { success: false, error: "اطلاعات پرداخت یافت نشد." };
  }

  const now = Math.floor(Date.now() / 1000);

  // Update payment row
  db.update(schema.payments)
    .set({
      status: "approved",
      approvedAt: now,
      staffNote: context.staffNote || null,
    })
    .where(eq(schema.payments.orderId, orderId))
    .run();

  // Transition order to 'paid'
  const transition = await transitionOrderStatus(
    orderId,
    "paid",
    {
      actor: "staff",
      staffUserId: context.staffUserId,
      note: context.staffNote,
    },
    { db }
  );

  return transition;
}

/**
 * Staff rejects a card-to-card declaration with a reason (SPEC §5).
 * Payment status becomes 'rejected', order stays 'awaiting-payment'.
 * Customer can re-declare, returning payment status to 'declared'.
 */
export async function rejectCardPayment(
  orderId: number,
  context: { staffUserId: number; reason: string; staffNote?: string },
  options?: { db?: typeof defaultDb }
): Promise<{ success: boolean; error?: string }> {
  const db = options?.db ?? defaultDb;

  if (!context.reason || !context.reason.trim()) {
    return { success: false, error: "دلیل رد پرداخت الزامی است." };
  }

  const payment = db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
  if (!payment) {
    return { success: false, error: "اطلاعات پرداخت یافت نشد." };
  }

  const now = Math.floor(Date.now() / 1000);

  // Update payment row
  db.update(schema.payments)
    .set({
      status: "rejected",
      rejectReason: context.reason.trim(),
      staffNote: context.staffNote || null,
    })
    .where(eq(schema.payments.orderId, orderId))
    .run();

  // Update latest declaration row with reject details
  const latestDecl = db
    .select()
    .from(schema.declarations)
    .where(eq(schema.declarations.orderId, orderId))
    .orderBy(desc(schema.declarations.id))
    .get();

  if (latestDecl) {
    db.update(schema.declarations)
      .set({
        rejectedReason: context.reason.trim(),
        rejectedAt: now,
      })
      .where(eq(schema.declarations.id, latestDecl.id))
      .run();
  }

  return { success: true };
}

/**
 * Staff override-approve capability on any unpaid order (SPEC §5).
 * Handles late-money reopen or manual offline clearance.
 */
export async function staffOverrideApprove(
  orderId: number,
  context: { staffUserId: number; staffNote?: string },
  options?: { db?: typeof defaultDb }
): Promise<{ success: boolean; error?: string }> {
  const db = options?.db ?? defaultDb;

  const now = Math.floor(Date.now() / 1000);

  // Update payment row if exists
  const payment = db.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
  if (payment) {
    db.update(schema.payments)
      .set({
        status: "approved",
        approvedAt: now,
        staffNote: context.staffNote || payment.staffNote,
      })
      .where(eq(schema.payments.orderId, orderId))
      .run();
  }

  // Force order to 'paid' (decrements stock)
  return transitionOrderStatus(
    orderId,
    "paid",
    {
      actor: "staff",
      staffUserId: context.staffUserId,
      note: context.staffNote,
    },
    { db }
  );
}
