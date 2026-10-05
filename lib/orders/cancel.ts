import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { ORDER_ERRORS } from "./config";
import { transitionOrderStatus } from "./machine";

/**
 * Allows a customer to self-cancel an order.
 * SPEC §5: "Customer self-cancel only while unpaid; no partial cancels"
 */
export async function customerCancelOrder(
  orderCode: string,
  customerId: number,
  options?: { db?: typeof defaultDb }
): Promise<{ success: boolean; error?: string }> {
  const db = options?.db ?? defaultDb;

  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.code, orderCode.toUpperCase()))
    .get();

  if (!order) {
    return { success: false, error: ORDER_ERRORS.ORDER_NOT_FOUND };
  }

  if (order.customerId !== customerId) {
    return { success: false, error: ORDER_ERRORS.UNAUTHORIZED };
  }

  if (order.status !== "awaiting-payment") {
    return {
      success: false,
      error:
        order.status === "paid" || order.status === "in-progress" || order.status === "shipped" || order.status === "delivered"
          ? ORDER_ERRORS.CANNOT_CANCEL_PAID
          : ORDER_ERRORS.CANNOT_CANCEL_STATUS,
    };
  }

  return transitionOrderStatus(
    order.id,
    "cancelled",
    {
      actor: "customer",
    },
    { db }
  );
}
