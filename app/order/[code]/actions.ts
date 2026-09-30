"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/server";
import { declareCardPayment } from "@/lib/orders/card-payment";
import { customerCancelOrder } from "@/lib/orders/cancel";
import { ORDER_ERRORS } from "@/lib/orders/config";

/**
 * Customer submits or re-submits a card-to-card declaration on /order/[code]
 */
export async function submitDeclarationAction(
  orderCode: string,
  last4: string,
  traceCode?: string
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false, error: "لطفاً ابتدا وارد حساب کاربری خود شوید." };
  }

  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.code, orderCode.toUpperCase()))
    .get();

  if (!order) {
    return { success: false, error: ORDER_ERRORS.ORDER_NOT_FOUND };
  }

  if (order.customerId !== currentUser.customer.id) {
    return { success: false, error: ORDER_ERRORS.UNAUTHORIZED };
  }

  const result = await declareCardPayment(
    order.id,
    { last4, traceCode },
    currentUser.customer.id
  );

  if (result.success) {
    revalidatePath(`/order/${orderCode}`);
  }

  return result;
}

/**
 * Customer self-cancels an unpaid order on /order/[code]
 */
export async function cancelOrderAction(orderCode: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false, error: "لطفاً ابتدا وارد حساب کاربری خود شوید." };
  }

  const result = await customerCancelOrder(orderCode, currentUser.customer.id);

  if (result.success) {
    revalidatePath(`/order/${orderCode}`);
  }

  return result;
}
