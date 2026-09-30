import { eq, sql } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import type { OrderStatus } from "@/db/schema";
import { ORDER_CONFIG, ORDER_ERRORS } from "./config";

export type OrderTransitionActor = "customer" | "staff" | "system";

export type TransitionContext = {
  actor: OrderTransitionActor;
  staffUserId?: number;
  trackingCode?: string;
  reason?: string;
  note?: string;
};

/**
 * Computes whether a card-to-card declaration is stale (>= 72 hours).
 * SPEC §5: "72h staleness is computed from declared_at, never stored;
 * stale flag invisible to the customer."
 */
export function isPaymentStale(declaredAt: number | null | undefined): boolean {
  if (!declaredAt) return false;
  const now = Math.floor(Date.now() / 1000);
  return now - declaredAt >= ORDER_CONFIG.CARD_STALENESS_SECONDS;
}

/**
 * Validates whether an order status transition is permissible per SPEC §5:
 * awaiting-payment ──(money confirmed)──▶ paid ──▶ in-progress ──▶ shipped ──▶ delivered
 *       ├─▶ cancelled            (unpaid end)
 *       └─▶ cancelled-refunded   (staff-only, before shipped)
 * Plus late-money reopen: cancelled ──▶ paid
 */
export function canTransitionOrder(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus,
  actor: OrderTransitionActor
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: false, reason: "سفارش هم‌اکنون در این وضعیت قرار دارد." };
  }

  // Customer self-cancel only while unpaid
  if (actor === "customer") {
    if (targetStatus === "cancelled" && currentStatus === "awaiting-payment") {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason:
        currentStatus === "paid" || currentStatus === "in-progress" || currentStatus === "shipped" || currentStatus === "delivered"
          ? ORDER_ERRORS.CANNOT_CANCEL_PAID
          : ORDER_ERRORS.CANNOT_CANCEL_STATUS,
    };
  }

  // Staff and system transitions
  switch (currentStatus) {
    case "awaiting-payment":
      if (targetStatus === "paid" || targetStatus === "cancelled") {
        return { allowed: true };
      }
      break;

    case "paid":
      if (targetStatus === "in-progress" || targetStatus === "cancelled-refunded") {
        return { allowed: true };
      }
      break;

    case "in-progress":
      if (targetStatus === "shipped" || targetStatus === "cancelled-refunded") {
        return { allowed: true };
      }
      break;

    case "shipped":
      if (targetStatus === "delivered") {
        return { allowed: true };
      }
      break;

    case "cancelled":
      // SPEC §5: late-money reopen: cancelled → paid
      if (targetStatus === "paid") {
        return { allowed: true };
      }
      break;

    case "delivered":
    case "cancelled-refunded":
      // Terminal states
      return { allowed: false, reason: "این وضعیت نهایی است و قابل تغییر نیست." };
  }

  return { allowed: false, reason: ORDER_ERRORS.INVALID_TRANSITION };
}

/**
 * Transitions order status and handles side effects (stock adjustments, updated timestamps).
 * Stock decrements ONLY on 'paid'.
 * Stock restores ONLY on 'cancelled-refunded'.
 */
export async function transitionOrderStatus(
  orderId: number,
  newStatus: OrderStatus,
  context: TransitionContext,
  options?: { db?: any }
): Promise<{ success: boolean; error?: string; order?: typeof schema.orders.$inferSelect }> {
  const db = options?.db ?? defaultDb;

  const order = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  if (!order) {
    return { success: false, error: ORDER_ERRORS.ORDER_NOT_FOUND };
  }

  const check = canTransitionOrder(order.status as OrderStatus, newStatus, context.actor);
  if (!check.allowed) {
    return { success: false, error: check.reason || ORDER_ERRORS.INVALID_TRANSITION };
  }

  const now = Math.floor(Date.now() / 1000);
  const lines = db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, orderId)).all();

  // Perform state transition
  // 1. If transitioning to 'paid': decrement product stock
  if (newStatus === "paid") {
    for (const line of lines) {
      if (line.productId) {
        db.update(schema.products)
          .set({
            stock: sql`MAX(0, ${schema.products.stock} - ${line.qty})`,
          })
          .where(eq(schema.products.id, line.productId))
          .run();
      }
    }
  }

  // 2. If transitioning to 'cancelled-refunded': restore product stock
  if (newStatus === "cancelled-refunded") {
    for (const line of lines) {
      if (line.productId) {
        db.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} + ${line.qty}`,
          })
          .where(eq(schema.products.id, line.productId))
          .run();
      }
    }
  }

  // 3. Prepare update payload
  const updatePayload: {
    status: OrderStatus;
    updatedAt: number;
    trackingCode?: string;
    note?: string;
  } = {
    status: newStatus,
    updatedAt: now,
  };

  if (context.trackingCode !== undefined) {
    updatePayload.trackingCode = context.trackingCode;
  }
  if (context.note !== undefined) {
    updatePayload.note = context.note;
  }

  db.update(schema.orders)
    .set(updatePayload)
    .where(eq(schema.orders.id, orderId))
    .run();

  const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
  return { success: true, order: updatedOrder };
}
