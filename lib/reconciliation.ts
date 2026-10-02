import { eq, and, sql } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { transitionOrderStatus } from "@/lib/orders/machine";
import {
  getUnverifiedZarinpalPayments,
  inquiryZarinpalPayment,
  verifyGatewayPayment,
} from "@/lib/zarinpal";

type DatabaseInstance = typeof defaultDb;

export interface ReconcileOptions {
  db?: DatabaseInstance;
  fetchFn?: typeof fetch;
  baseUrl?: string;
  merchantId?: string;
  olderThanSeconds?: number;
}

export interface ReconcileResult {
  reconciledCount: number;
  reopenedCount: number;
  cancelledGatewayCount: number;
  cancelledCardCount: number;
  errors: string[];
}

/**
 * 1. Gateway recovery:
 * Queries unVerified.json for successful payments missed by callback.
 * Reconciles each against DB-stored amount and flips awaiting-payment (or cancelled) -> paid.
 * Also checks any pending gateway payments >15m with inquiry.json.
 * SPEC §5 & SPEC §9
 */
export async function reconcileGatewayPayments(
  options?: ReconcileOptions
): Promise<{ reconciledCount: number; reopenedCount: number; errors: string[] }> {
  const db = options?.db ?? defaultDb;
  let reconciledCount = 0;
  let reopenedCount = 0;
  const errors: string[] = [];

  // 1. Check unVerified.json list
  const unverifiedRes = await getUnverifiedZarinpalPayments({
    fetchFn: options?.fetchFn,
    baseUrl: options?.baseUrl,
    merchantId: options?.merchantId,
  });

  if (unverifiedRes.success && unverifiedRes.authorities.length > 0) {
    for (const item of unverifiedRes.authorities) {
      try {
        const payment = db
          .select()
          .from(schema.payments)
          .where(eq(schema.payments.authority, item.authority))
          .get();

        if (!payment) continue;

        const order = db
          .select()
          .from(schema.orders)
          .where(eq(schema.orders.id, payment.orderId))
          .get();

        if (!order) continue;

        // If not already verified, verify it server-side
        if (payment.status !== "verified") {
          const wasCancelled = order.status === "cancelled";
          const res = await verifyGatewayPayment(item.authority, "OK", {
            db,
            fetchFn: options?.fetchFn,
          });

          if (res.success) {
            reconciledCount++;
            if (wasCancelled) {
              reopenedCount++;
            }
          } else if (res.error) {
            errors.push(`Authority ${item.authority} verify error: ${res.error}`);
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Error processing authority ${item.authority}: ${msg}`);
      }
    }
  }

  // 2. Poll pending gateway payments with inquiry.json
  const pendingGatewayPayments = db
    .select()
    .from(schema.payments)
    .where(
      and(
        eq(schema.payments.path, "gateway"),
        eq(schema.payments.status, "pending")
      )
    )
    .all();

  for (const payment of pendingGatewayPayments) {
    if (!payment.authority) continue;

    try {
      const order = db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.id, payment.orderId))
        .get();

      if (!order) continue;

      const inquiryRes = await inquiryZarinpalPayment({
        authority: payment.authority,
        fetchFn: options?.fetchFn,
        baseUrl: options?.baseUrl,
        merchantId: options?.merchantId,
      });

      if (inquiryRes.success && (inquiryRes.status === "PAID" || inquiryRes.status === "VERIFIED")) {
        const wasCancelled = order.status === "cancelled";
        const res = await verifyGatewayPayment(payment.authority, "OK", {
          db,
          fetchFn: options?.fetchFn,
        });

        if (res.success) {
          reconciledCount++;
          if (wasCancelled) {
            reopenedCount++;
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Inquiry error for ${payment.authority}: ${msg}`);
    }
  }

  return { reconciledCount, reopenedCount, errors };
}

/**
 * 2. 24h auto-cancel of unpaid gateway orders:
 * Only cancels after dead-check via inquiry.json confirms unpaid (not PAID/VERIFIED).
 * SPEC §5 & SPEC §9
 */
export async function sweepUnpaidGatewayOrders(
  options?: ReconcileOptions
): Promise<{ cancelledCount: number; errors: string[] }> {
  const db = options?.db ?? defaultDb;
  const olderThanSeconds = options?.olderThanSeconds ?? 24 * 3600;
  const cutoff = Math.floor(Date.now() / 1000) - olderThanSeconds;
  let cancelledCount = 0;
  const errors: string[] = [];

  // Find awaiting-payment orders older than cutoff
  const staleOrders = db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.status, "awaiting-payment"),
        sql`${schema.orders.createdAt} <= ${cutoff}`
      )
    )
    .all();

  for (const order of staleOrders) {
    try {
      const payment = db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, order.id))
        .get();

      if (!payment || payment.path !== "gateway" || payment.status === "verified") {
        continue;
      }

      // Dead-check: verify with ZarinPal inquiry before cancelling (SPEC §5, §9)
      let isGenuinelyUnpaid = false;
      if (payment.authority) {
        const inquiry = await inquiryZarinpalPayment({
          authority: payment.authority,
          fetchFn: options?.fetchFn,
          baseUrl: options?.baseUrl,
          merchantId: options?.merchantId,
        });

        if (inquiry.success) {
          if (inquiry.status === "PAID" || inquiry.status === "VERIFIED") {
            // Money was paid! Reconcile instead of cancelling
            await verifyGatewayPayment(payment.authority, "OK", {
              db,
              fetchFn: options?.fetchFn,
            });
          } else {
            // Dead-check explicitly confirmed unpaid
            isGenuinelyUnpaid = true;
          }
        } else {
          // Network or API failure: do not cancel, wait for next sweep
          errors.push(
            `Dead-check inquiry failed for authority ${payment.authority}: ${inquiry.message}. Skipping auto-cancel.`
          );
        }
      } else {
        // No authority recorded, can safely consider unpaid
        isGenuinelyUnpaid = true;
      }

      if (isGenuinelyUnpaid) {
        const cancelRes = await transitionOrderStatus(
          order.id,
          "cancelled",
          { actor: "system" },
          { db }
        );

        if (cancelRes.success) {
          db.update(schema.payments)
            .set({
              status: "expired",
              rejectReason: "لغو خودکار پس از ۲۴ ساعت عدم پرداخت درگاه.",
            })
            .where(eq(schema.payments.id, payment.id))
            .run();

          cancelledCount++;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error sweeping gateway order ${order.id}: ${msg}`);
    }
  }

  return { cancelledCount, errors };
}

/**
 * 3. 24h auto-cancel of card orders never declared:
 * Orders with card payment where payment was never declared (status === 'undeclared').
 * Declared orders wait for staff review and are NOT auto-cancelled.
 * SPEC §5 & SPEC §9
 */
export async function sweepUndeclaredCardOrders(
  options?: ReconcileOptions
): Promise<{ cancelledCount: number; errors: string[] }> {
  const db = options?.db ?? defaultDb;
  const olderThanSeconds = options?.olderThanSeconds ?? 24 * 3600;
  const cutoff = Math.floor(Date.now() / 1000) - olderThanSeconds;
  let cancelledCount = 0;
  const errors: string[] = [];

  const staleOrders = db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.status, "awaiting-payment"),
        sql`${schema.orders.createdAt} <= ${cutoff}`
      )
    )
    .all();

  for (const order of staleOrders) {
    try {
      const payment = db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, order.id))
        .get();

      if (!payment || payment.path !== "card") {
        continue;
      }

      // Check if declared: declared orders wait for staff
      if (payment.status === "declared" || payment.declaredAt !== null) {
        continue;
      }

      // Check declarations table
      const declarations = db
        .select()
        .from(schema.declarations)
        .where(eq(schema.declarations.orderId, order.id))
        .all();

      if (declarations.length > 0) {
        continue;
      }

      // Order was never declared
      const cancelRes = await transitionOrderStatus(
        order.id,
        "cancelled",
        { actor: "system" },
        { db }
      );

      if (cancelRes.success) {
        db.update(schema.payments)
          .set({
            status: "expired",
            rejectReason: "لغو خودکار پس از ۲۴ ساعت عدم ثبت مشخصات کارت‌به‌کارت.",
          })
          .where(eq(schema.payments.id, payment.id))
          .run();

        cancelledCount++;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Error sweeping card order ${order.id}: ${msg}`);
    }
  }

  return { cancelledCount, errors };
}

/**
 * Runs the full 15-minute reconciliation cron sweep:
 * 1. Gateway recovery (unVerified.json + inquiry.json)
 * 2. 24h auto-cancel of dead gateway orders
 * 3. 24h auto-cancel of undeclared card orders
 * Safe & idempotent.
 */
export async function runReconciliationCron(
  options?: ReconcileOptions
): Promise<ReconcileResult> {
  const errors: string[] = [];

  const recoveryRes = await reconcileGatewayPayments(options);
  errors.push(...recoveryRes.errors);

  const gatewaySweepRes = await sweepUnpaidGatewayOrders(options);
  errors.push(...gatewaySweepRes.errors);

  const cardSweepRes = await sweepUndeclaredCardOrders(options);
  errors.push(...cardSweepRes.errors);

  return {
    reconciledCount: recoveryRes.reconciledCount,
    reopenedCount: recoveryRes.reopenedCount,
    cancelledGatewayCount: gatewaySweepRes.cancelledCount,
    cancelledCardCount: cardSweepRes.cancelledCount,
    errors,
  };
}
