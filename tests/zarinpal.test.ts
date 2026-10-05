import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  getZarinpalBaseUrl,
  getStartPayUrl,
  requestZarinpalPayment,
  verifyZarinpalPayment,
  initiateGatewayPayment,
  verifyGatewayPayment,
} from "@/lib/zarinpal";
import { createOrder } from "@/lib/orders";

function createTestDb() {
  const sqlite = new Database(":memory:");
  const migrationSql = fs.readFileSync(path.join(process.cwd(), "drizzle", "0000_robust_iceman.sql"), "utf-8");
  const statements = migrationSql.split("--> statement-breakpoint");
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }

  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Seed standard collections, colors, product, and customer for tests
  db.insert(schema.collections).values({ id: "wall", name: "دیوارکوب", sort: 1 }).run();
  db.insert(schema.colors).values({ id: "cream", label: "کرم طبیعی", hex: "#F4F0EA" }).run();

  db.insert(schema.products).values({
    id: 1,
    slug: "tablo-par",
    name: "دیوارکوب پر مکرومه",
    subtitle: "دستبافت با نخ پنبه خالص",
    collectionId: "wall",
    description: "دیوارکوب زیبا با گره‌های دستبافت",
    priceToman: 450000,
    stock: 5,
    status: "published",
  }).run();

  db.insert(schema.productSizes).values({
    id: 10,
    productId: 1,
    label: "متوسط (۴۰×۶۰)",
    deltaToman: 50000,
  }).run();

  db.insert(schema.customers).values({
    id: 1,
    phone: "09123456789",
    name: "مریم سعیدی",
  }).run();

  db.insert(schema.settings).values([
    { key: "shipping_flat_toman", value: "90000" },
    { key: "shipping_free_from_toman", value: "600000" },
  ]).run();

  return { sqlite, db };
}

describe("ZarinPal Config and URLs", () => {
  it("computes StartPay redirect URL accurately", () => {
    const auth = "A00000000000000000000000000000000000";
    const url = getStartPayUrl(auth, "https://sandbox.zarinpal.com");
    assert.equal(url, `https://sandbox.zarinpal.com/pg/StartPay/${auth}`);
  });

  it("respects ZARINPAL_BASE_URL when provided", () => {
    process.env.ZARINPAL_BASE_URL = "https://custom.gateway.ir";
    assert.equal(getZarinpalBaseUrl(), "https://custom.gateway.ir");
    delete process.env.ZARINPAL_BASE_URL;
  });
});

describe("ZarinPal REST v4 Client", () => {
  it("requests payment with amount in Rial and no auth header", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: Record<string, unknown> | null = null;

    const mockFetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      capturedBody = JSON.parse(String(init?.body));

      return {
        ok: true,
        json: async () => ({
          data: {
            code: 100,
            message: "Success",
            authority: "A00000000000000000000000000000000001",
            fee_type: "Merchant",
            fee: 0,
          },
          errors: [],
        }),
      } as Response;
    }) as typeof fetch;

    const res = await requestZarinpalPayment({
      amountRial: 5400000, // 540,000 Toman * 10
      description: "سفارش ۲۳۴۵۶۷ — کارگاه گِرِه",
      callbackUrl: "https://gereh.shop/checkout/callback",
      baseUrl: "https://sandbox.zarinpal.com",
      merchantId: "00000000-0000-0000-0000-000000000000",
      fetchFn: mockFetch,
    });

    assert.equal(res.success, true);
    assert.equal(res.authority, "A00000000000000000000000000000000001");
    assert.equal(res.startPayUrl, "https://sandbox.zarinpal.com/pg/StartPay/A00000000000000000000000000000000001");
    assert.equal(capturedUrl, "https://sandbox.zarinpal.com/pg/v4/payment/request.json");
    const body = capturedBody as { amount?: number; merchant_id?: string } | null;
    assert.equal(body?.amount, 5400000);
    assert.equal(body?.merchant_id, "00000000-0000-0000-0000-000000000000");
    // Verify no authorization header is sent
    assert.equal(capturedHeaders.authorization, undefined);
    assert.equal(capturedHeaders.Authorization, undefined);
  });

  it("verifies payment with code 100 for first-time settlement", async () => {
    let capturedBody: Record<string, unknown> | null = null;

    const mockFetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(String(init?.body));
      return {
        ok: true,
        json: async () => ({
          data: {
            code: 100,
            message: "Paid",
            ref_id: 987654321,
            card_pan: "502229******1234",
            card_hash: "abcd",
            fee_type: "Merchant",
            fee: 0,
          },
          errors: [],
        }),
      } as Response;
    }) as typeof fetch;

    const res = await verifyZarinpalPayment({
      amountRial: 5400000,
      authority: "A00000000000000000000000000000000001",
      baseUrl: "https://sandbox.zarinpal.com",
      merchantId: "00000000-0000-0000-0000-000000000000",
      fetchFn: mockFetch,
    });

    assert.equal(res.success, true);
    assert.equal(res.code, 100);
    assert.equal(res.refId, "987654321");
    const body = capturedBody as { amount?: number; authority?: string } | null;
    assert.equal(body?.amount, 5400000);
    assert.equal(body?.authority, "A00000000000000000000000000000000001");
  });

  it("verifies payment with code 101 for already settled (idempotency)", async () => {
    const mockFetch = (async () => ({
      ok: true,
      json: async () => ({
        data: {
          code: 101,
          message: "Verified",
          ref_id: 987654321,
        },
        errors: [],
      }),
    })) as unknown as typeof fetch;

    const res = await verifyZarinpalPayment({
      amountRial: 5400000,
      authority: "A00000000000000000000000000000000001",
      fetchFn: mockFetch,
    });

    assert.equal(res.success, true);
    assert.equal(res.code, 101);
    assert.equal(res.refId, "987654321");
  });
});

describe("Gateway Payment DB Operations & Lifecycle", () => {
  let testDb: ReturnType<typeof createTestDb>["db"];

  beforeEach(() => {
    const { db } = createTestDb();
    testDb = db;
  });

  it("initiates gateway payment and sets authority + amount_rial in DB", async () => {
    // 1. Create order
    const orderRes = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 1 }],
        paymentPath: "gateway",
      },
      { db: testDb }
    );

    assert.equal(orderRes.success, true);
    if (!orderRes.success) throw new Error("Order creation failed");
    const orderCode = orderRes.orderCode;
    const order = testDb.select().from(schema.orders).where(eq(schema.orders.code, orderCode)).get()!;

    // 2. Initiate payment
    const mockFetch = (async () => ({
      ok: true,
      json: async () => ({
        data: {
          code: 100,
          message: "Success",
          authority: "A00000000000000000000000000000000002",
        },
      }),
    })) as unknown as typeof fetch;

    const initRes = await initiateGatewayPayment(order.id, {
      callbackUrl: "https://gereh.shop/checkout/callback",
      db: testDb,
      fetchFn: mockFetch,
    });

    assert.equal(initRes.success, true);
    assert.equal(initRes.authority, "A00000000000000000000000000000000002");
    assert.ok(initRes.redirectUrl?.includes("A00000000000000000000000000000000002"));

    // Check DB payment row
    const payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, order.id)).get()!;
    assert.equal(payment.authority, "A00000000000000000000000000000000002");
    assert.equal(payment.status, "pending");
    assert.equal(payment.amountRial, order.totalToman * 10);
  });

  it("handles successful verification (code 100): settles payment and decrements stock", async () => {
    // 1. Create order for 2 items (starting stock is 5)
    const orderRes = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 2 }],
        paymentPath: "gateway",
      },
      { db: testDb }
    );
    assert.equal(orderRes.success, true);
    if (!orderRes.success) throw new Error("Order creation failed");
    const orderCode = orderRes.orderCode;
    const order = testDb.select().from(schema.orders).where(eq(schema.orders.code, orderCode)).get()!;

    // Initiate payment
    await initiateGatewayPayment(order.id, {
      callbackUrl: "https://gereh.shop/checkout/callback",
      db: testDb,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({
          data: { code: 100, authority: "A_TEST_SUCCESS_100" },
        }),
      })) as unknown as typeof fetch,
    });

    // Check product stock before payment: still 5 (not decremented until paid!)
    let prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get()!;
    assert.equal(prod.stock, 5);

    // 2. Callback arrives: verify payment
    let verifyCallAmount = 0;
    const mockVerifyFetch = (async (_url: unknown, init?: RequestInit) => {
      const b = JSON.parse(String(init?.body));
      verifyCallAmount = b.amount;
      return {
        ok: true,
        json: async () => ({
          data: {
            code: 100,
            message: "Paid",
            ref_id: 11223344,
          },
        }),
      };
    }) as unknown as typeof fetch;

    const verifyRes = await verifyGatewayPayment("A_TEST_SUCCESS_100", "OK", {
      db: testDb,
      fetchFn: mockVerifyFetch,
    });

    assert.equal(verifyRes.success, true);
    assert.equal(verifyRes.orderCode, orderCode);
    assert.equal(verifyRes.refId, "11223344");
    // Verify amount used was DB-stored amount (totalToman * 10)
    assert.equal(verifyCallAmount, order.totalToman * 10);

    // Order should now be 'paid'
    const updatedOrder = testDb.select().from(schema.orders).where(eq(schema.orders.id, order.id)).get()!;
    assert.equal(updatedOrder.status, "paid");

    // Payment row should be 'verified' with ref_id
    const updatedPayment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, order.id)).get()!;
    assert.equal(updatedPayment.status, "verified");
    assert.equal(updatedPayment.refId, "11223344");
    assert.ok(updatedPayment.approvedAt && updatedPayment.approvedAt > 0);

    // Stock MUST be decremented on paid (5 - 2 = 3)
    prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get()!;
    assert.equal(prod.stock, 3);
  });

  it("handles idempotent re-verification (code 101): does not decrement stock twice", async () => {
    const orderRes = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 2 }],
        paymentPath: "gateway",
      },
      { db: testDb }
    );
    assert.equal(orderRes.success, true);
    if (!orderRes.success) throw new Error("Order creation failed");
    const orderCode = orderRes.orderCode;
    const order = testDb.select().from(schema.orders).where(eq(schema.orders.code, orderCode)).get()!;

    await initiateGatewayPayment(order.id, {
      callbackUrl: "https://gereh.shop/checkout/callback",
      db: testDb,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({
          data: { code: 100, authority: "A_TEST_IDEMPOTENT_101" },
        }),
      })) as unknown as typeof fetch,
    });

    // First verification (100)
    await verifyGatewayPayment("A_TEST_IDEMPOTENT_101", "OK", {
      db: testDb,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({
          data: { code: 100, ref_id: 55667788 },
        }),
      })) as unknown as typeof fetch,
    });

    let prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get()!;
    assert.equal(prod.stock, 3);

    // Second verification (101 - duplicate callback / browser refresh)
    const secondRes = await verifyGatewayPayment("A_TEST_IDEMPOTENT_101", "OK", {
      db: testDb,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({
          data: { code: 101, message: "Verified", ref_id: 55667788 },
        }),
      })) as unknown as typeof fetch,
    });

    assert.equal(secondRes.success, true);
    assert.equal(secondRes.orderCode, orderCode);
    assert.equal(secondRes.refId, "55667788");

    // Stock must STILL be 3 (NEVER decremented twice)
    prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get()!;
    assert.equal(prod.stock, 3);
  });

  it("handles cancelled payment (Status=NOK): marks payment expired and preserves stock", async () => {
    const orderRes = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 2 }],
        paymentPath: "gateway",
      },
      { db: testDb }
    );
    assert.equal(orderRes.success, true);
    if (!orderRes.success) throw new Error("Order creation failed");
    const orderCode = orderRes.orderCode;
    const order = testDb.select().from(schema.orders).where(eq(schema.orders.code, orderCode)).get()!;

    await initiateGatewayPayment(order.id, {
      callbackUrl: "https://gereh.shop/checkout/callback",
      db: testDb,
      fetchFn: (async () => ({
        ok: true,
        json: async () => ({
          data: { code: 100, authority: "A_TEST_CANCELLED" },
        }),
      })) as unknown as typeof fetch,
    });

    // Callback arrives with Status=NOK
    const verifyRes = await verifyGatewayPayment("A_TEST_CANCELLED", "NOK", {
      db: testDb,
    });

    assert.equal(verifyRes.success, false);
    assert.equal(verifyRes.orderCode, orderCode);

    // Order status stays awaiting-payment (can retry or use card-to-card)
    const ord = testDb.select().from(schema.orders).where(eq(schema.orders.id, order.id)).get()!;
    assert.equal(ord.status, "awaiting-payment");

    // Payment status transitions to expired
    const pay = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, order.id)).get()!;
    assert.equal(pay.status, "expired");

    // Stock not decremented
    const prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get()!;
    assert.equal(prod.stock, 5);
  });
});
