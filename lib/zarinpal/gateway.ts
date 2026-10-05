import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { requestZarinpalPayment, verifyZarinpalPayment } from "./client";
import { transitionOrderStatus } from "@/lib/orders/machine";

export interface InitiateGatewayOptions {
  callbackUrl?: string;
  mobile?: string;
  db?: typeof defaultDb;
  fetchFn?: typeof fetch;
}

export interface InitiateGatewayResult {
  success: boolean;
  orderCode?: string;
  authority?: string;
  redirectUrl?: string;
  error?: string;
  code?: number;
}

/**
 * Initiates an online payment via ZarinPal for an order.
 * SPEC §5: Payment request POST /pg/v4/payment/request.json
 */
export async function initiateGatewayPayment(
  orderId: number,
  options?: InitiateGatewayOptions
): Promise<InitiateGatewayResult> {
  const db = options?.db ?? defaultDb;

  // 1. Fetch order
  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .get();

  if (!order) {
    return { success: false, error: "سفارش مورد نظر یافت نشد." };
  }

  if (order.status !== "awaiting-payment") {
    return {
      success: false,
      error: "سفارش در وضعیت انتظار پرداخت نیست.",
      orderCode: order.code,
    };
  }

  // 2. Fetch customer for mobile if available
  let mobile: string | undefined = options?.mobile;
  if (!mobile && order.customerId) {
    const customer = db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, order.customerId))
      .get();
    if (customer?.phone) {
      mobile = customer.phone;
    }
  }

  // 3. Amount in Rial (Toman * 10)
  const amountRial = order.totalToman * 10;
  const appUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const callbackUrl =
    options?.callbackUrl || `${appUrl.replace(/\/+$/, "")}/checkout/callback`;

  // 4. Request payment from ZarinPal
  const reqRes = await requestZarinpalPayment({
    amountRial,
    description: `سفارش ${order.code} — کارگاه گِرِه`,
    callbackUrl,
    mobile,
    orderId: order.id,
    fetchFn: options?.fetchFn,
  });

  if (!reqRes.success || !reqRes.authority || !reqRes.startPayUrl) {
    return {
      success: false,
      error: reqRes.message,
      code: reqRes.code,
      orderCode: order.code,
    };
  }

  // 5. Update or insert payment row
  const existingPayment = db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.orderId, order.id))
    .get();

  if (existingPayment) {
    db.update(schema.payments)
      .set({
        path: "gateway",
        status: "pending",
        authority: reqRes.authority,
        amountRial,
        rejectReason: null,
      })
      .where(eq(schema.payments.id, existingPayment.id))
      .run();
  } else {
    db.insert(schema.payments)
      .values({
        orderId: order.id,
        path: "gateway",
        status: "pending",
        authority: reqRes.authority,
        amountRial,
      })
      .run();
  }

  return {
    success: true,
    orderCode: order.code,
    authority: reqRes.authority,
    redirectUrl: reqRes.startPayUrl,
  };
}

export interface VerifyGatewayOptions {
  db?: typeof defaultDb;
  fetchFn?: typeof fetch;
}

export interface VerifyGatewayResult {
  success: boolean;
  orderCode?: string;
  refId?: string;
  error?: string;
  code?: number;
  isDuplicate?: boolean;
  isCancelled?: boolean;
}

/**
 * Verifies payment returned from ZarinPal callback.
 * SPEC §5:
 * - verifies Authority + Status server-side against DB-stored amount, never querystring
 * - code 100 settles, 101 = already settled (idempotent - double-verify is never treated as failure)
 * - flips awaiting-payment -> paid through transition helper (stock decrements there)
 * - ref_id stored and shown on order
 */
export async function verifyGatewayPayment(
  authority: string,
  status: string,
  options?: VerifyGatewayOptions
): Promise<VerifyGatewayResult> {
  const db = options?.db ?? defaultDb;

  // 1. Locate payment by authority
  const payment = db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.authority, authority))
    .get();

  if (!payment) {
    return {
      success: false,
      error: "اطلاعات پرداخت با شناسه ارائه‌شده یافت نشد.",
    };
  }

  // 2. Locate corresponding order
  const order = db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, payment.orderId))
    .get();

  if (!order) {
    return {
      success: false,
      error: "سفارش مرتبط با این پرداخت یافت نشد.",
    };
  }

  // 3. If already verified, return idempotent success immediately
  if (payment.status === "verified") {
    return {
      success: true,
      orderCode: order.code,
      refId: payment.refId || undefined,
      isDuplicate: true,
      code: 101,
    };
  }

  // 4. If status is NOT 'OK' (user cancelled or payment declined by bank)
  if (status !== "OK") {
    db.update(schema.payments)
      .set({
        status: "expired",
        rejectReason: "پرداخت توسط کاربر لغو شد یا در درگاه بانکی ناموفق بود.",
      })
      .where(eq(schema.payments.id, payment.id))
      .run();

    return {
      success: false,
      orderCode: order.code,
      error: "پرداخت لغو شد یا انجام نشد.",
      isCancelled: true,
    };
  }

  // 5. Amount in Rial strictly from DB (SPEC §5: never the querystring!)
  const amountRial = payment.amountRial || order.totalToman * 10;

  // 6. Verify against ZarinPal API
  const verifyRes = await verifyZarinpalPayment({
    authority,
    amountRial,
    fetchFn: options?.fetchFn,
  });

  const now = Math.floor(Date.now() / 1000);

  if (verifyRes.success && (verifyRes.code === 100 || verifyRes.code === 101)) {
    const isFirstTimeSettlement = verifyRes.code === 100;
    const refId = verifyRes.refId ? String(verifyRes.refId) : payment.refId;

    // Transition order status to 'paid' (which decrements stock) FIRST
    if (order.status !== "paid") {
      const transitionRes = await transitionOrderStatus(
        order.id,
        "paid",
        { actor: "system" },
        { db }
      );
      if (!transitionRes.success) {
        return {
          success: false,
          orderCode: order.code,
          error: transitionRes.error,
        };
      }
    }

    // Update payment row to verified
    db.update(schema.payments)
      .set({
        status: "verified",
        refId: refId || null,
        approvedAt: now,
        rejectReason: null,
      })
      .where(eq(schema.payments.id, payment.id))
      .run();

    return {
      success: true,
      orderCode: order.code,
      refId: refId || undefined,
      code: verifyRes.code,
      isDuplicate: !isFirstTimeSettlement,
    };
  }

  // Verification failed
  db.update(schema.payments)
    .set({
      status: "expired",
      rejectReason: verifyRes.message,
    })
    .where(eq(schema.payments.id, payment.id))
    .run();

  return {
    success: false,
    orderCode: order.code,
    error: verifyRes.message,
    code: verifyRes.code,
  };
}
