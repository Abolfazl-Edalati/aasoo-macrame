/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  getUnverifiedZarinpalPayments,
  inquiryZarinpalPayment,
} from "@/lib/zarinpal";
import {
  reconcileGatewayPayments,
  sweepUnpaidGatewayOrders,
  sweepUndeclaredCardOrders,
  runReconciliationCron,
} from "@/lib/reconciliation";

function createTestDb() {
  const sqlite = new Database(":memory:");
  const migrationSql = fs.readFileSync(
    path.join(process.cwd(), "drizzle", "0000_robust_iceman.sql"),
    "utf-8"
  );
  const statements = migrationSql.split("--> statement-breakpoint");
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      sqlite.exec(trimmed);
    }
  }

  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });

  // Seed baseline taxonomy, product, customer
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

  db.insert(schema.customers).values({
    id: 1,
    phone: "09123456789",
    name: "مریم سعیدی",
  }).run();

  return db;
}

function createDummyOrder(
  db: any,
  options: {
    id: number;
    code: string;
    status: "awaiting-payment" | "paid" | "cancelled";
    createdAtSecondsAgo: number;
    paymentPath: "gateway" | "card";
    paymentStatus: string;
    authority?: string;
    declaredAt?: number | null;
  }
) {
  const now = Math.floor(Date.now() / 1000);
  const createdAt = now - options.createdAtSecondsAgo;

  db.insert(schema.orders).values({
    id: options.id,
    code: options.code,
    customerId: 1,
    status: options.status,
    totalToman: 450000,
    subtotalToman: 450000,
    shippingToman: 0,
    discountToman: 0,
    recipientName: "مریم سعیدی",
    phone: "09123456789",
    addressText: "تهران، خیابان ولیعصر، پلاک ۱۲۳، واحد ۴",
    createdAt,
  }).run();

  db.insert(schema.orderLines).values({
    orderId: options.id,
    productId: 1,
    name: "دیوارکوب پر مکرومه",
    unitPriceToman: 450000,
    qty: 1,
  }).run();

  db.insert(schema.payments).values({
    id: options.id,
    orderId: options.id,
    path: options.paymentPath,
    status: options.paymentStatus as any,
    amountRial: 4500000,
    authority: options.authority || null,
    declaredAt: options.declaredAt ?? null,
  }).run();
}

describe("ZarinPal unVerified and inquiry API clients", () => {
  it("retrieves unverified transactions list via getUnverifiedZarinpalPayments", async () => {
    const mockFetch = async () => {
      return {
        json: async () => ({
          data: {
            code: 100,
            message: "عملیات با موفقیت انجام شد.",
            authorities: [
              {
                authority: "A00000000000000000000000000000000001",
                amount: 4500000,
                channel: "CARD",
                date: "2026-10-01 12:00:00",
              },
            ],
          },
          errors: [],
        }),
      } as any;
    };

    const res = await getUnverifiedZarinpalPayments({
      fetchFn: mockFetch,
      merchantId: "test-merchant",
    });

    assert.equal(res.success, true);
    assert.equal(res.authorities.length, 1);
    assert.equal(res.authorities[0].authority, "A00000000000000000000000000000000001");
    assert.equal(res.authorities[0].amount, 4500000);
  });

  it("checks authority status via inquiryZarinpalPayment", async () => {
    const mockFetch = async () => {
      return {
        json: async () => ({
          data: {
            code: 100,
            status: "PAID",
            message: "عملیات با موفقیت انجام شد.",
          },
          errors: [],
        }),
      } as any;
    };

    const res = await inquiryZarinpalPayment({
      authority: "A00000000000000000000000000000000002",
      fetchFn: mockFetch,
      merchantId: "test-merchant",
    });

    assert.equal(res.success, true);
    assert.equal(res.status, "PAID");
  });
});

describe("Reconciliation & Recovery Sweeps", () => {
  it("reconciles unverified gateway payment and transitions awaiting-payment to paid", async () => {
    const db = createTestDb();
    const authority = "A00000000000000000000000000000000010";

    createDummyOrder(db, {
      id: 10,
      code: "REC001",
      status: "awaiting-payment",
      createdAtSecondsAgo: 600, // 10 minutes ago
      paymentPath: "gateway",
      paymentStatus: "pending",
      authority,
    });

    // Mock fetch for unVerified and verify endpoints
    const mockFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("unVerified.json")) {
        return {
          json: async () => ({
            data: {
              code: 100,
              authorities: [{ authority, amount: 4500000 }],
            },
          }),
        } as any;
      }
      if (urlStr.includes("verify.json")) {
        return {
          json: async () => ({
            data: {
              code: 100,
              ref_id: 99887766,
              card_pan: "502229******1234",
            },
          }),
        } as any;
      }
      if (urlStr.includes("inquiry.json")) {
        return {
          json: async () => ({
            data: { code: 100, status: "PAID" },
          }),
        } as any;
      }
      return { json: async () => ({}) } as any;
    };

    const result = await reconcileGatewayPayments({ db, fetchFn: mockFetch });
    assert.equal(result.reconciledCount, 1);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 10)).get();
    assert.equal(updatedOrder!.status, "paid");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 10)).get();
    assert.equal(updatedPayment!.status, "verified");
    assert.equal(updatedPayment!.refId, "99887766");

    // Stock was decremented from 5 to 4
    const prod = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod!.stock, 4);
  });

  it("handles late-money path: cancelled -> paid reopen on verified late payment", async () => {
    const db = createTestDb();
    const authority = "A00000000000000000000000000000000020";

    // Order was previously cancelled (e.g. 24h expired)
    createDummyOrder(db, {
      id: 20,
      code: "LATE01",
      status: "cancelled",
      createdAtSecondsAgo: 90000, // 25 hours ago
      paymentPath: "gateway",
      paymentStatus: "expired",
      authority,
    });

    const mockFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("unVerified.json")) {
        return {
          json: async () => ({
            data: {
              code: 100,
              authorities: [{ authority, amount: 4500000 }],
            },
          }),
        } as any;
      }
      if (urlStr.includes("verify.json")) {
        return {
          json: async () => ({
            data: {
              code: 100,
              ref_id: 11223344,
            },
          }),
        } as any;
      }
      return { json: async () => ({}) } as any;
    };

    const result = await reconcileGatewayPayments({ db, fetchFn: mockFetch });
    assert.equal(result.reconciledCount, 1);
    assert.equal(result.reopenedCount, 1);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 20)).get();
    assert.equal(updatedOrder!.status, "paid");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 20)).get();
    assert.equal(updatedPayment!.status, "verified");
    assert.equal(updatedPayment!.refId, "11223344");

    // Stock was decremented
    const prod = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod!.stock, 4);
  });

  it("auto-cancels 24h unpaid gateway order only when dead-check confirms unpaid", async () => {
    const db = createTestDb();
    const authority = "A00000000000000000000000000000000030";

    createDummyOrder(db, {
      id: 30,
      code: "DEAD01",
      status: "awaiting-payment",
      createdAtSecondsAgo: 90000, // 25 hours ago
      paymentPath: "gateway",
      paymentStatus: "pending",
      authority,
    });

    const mockFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("inquiry.json")) {
        return {
          json: async () => ({
            data: { code: 100, status: "FAILED" },
          }),
        } as any;
      }
      return { json: async () => ({}) } as any;
    };

    const result = await sweepUnpaidGatewayOrders({
      db,
      fetchFn: mockFetch,
      olderThanSeconds: 86400,
    });

    assert.equal(result.cancelledCount, 1);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 30)).get();
    assert.equal(updatedOrder!.status, "cancelled");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 30)).get();
    assert.equal(updatedPayment!.status, "expired");

    // Stock was NOT decremented
    const prod = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod!.stock, 5);
  });

  it("does NOT auto-cancel 24h gateway order if inquiry shows PAID — verifies instead", async () => {
    const db = createTestDb();
    const authority = "A00000000000000000000000000000000040";

    createDummyOrder(db, {
      id: 40,
      code: "SAVED1",
      status: "awaiting-payment",
      createdAtSecondsAgo: 90000, // 25 hours ago
      paymentPath: "gateway",
      paymentStatus: "pending",
      authority,
    });

    const mockFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("inquiry.json")) {
        return {
          json: async () => ({
            data: { code: 100, status: "PAID" },
          }),
        } as any;
      }
      if (urlStr.includes("verify.json")) {
        return {
          json: async () => ({
            data: { code: 100, ref_id: 55443322 },
          }),
        } as any;
      }
      return { json: async () => ({}) } as any;
    };

    const result = await sweepUnpaidGatewayOrders({
      db,
      fetchFn: mockFetch,
      olderThanSeconds: 86400,
    });

    // Should NOT have been cancelled
    assert.equal(result.cancelledCount, 0);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 40)).get();
    assert.equal(updatedOrder!.status, "paid");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 40)).get();
    assert.equal(updatedPayment!.status, "verified");
  });

  it("does NOT auto-cancel 24h gateway order if dead-check inquiry fails due to network error", async () => {
    const db = createTestDb();
    const authority = "A00000000000000000000000000000000045";

    createDummyOrder(db, {
      id: 45,
      code: "NETFAIL",
      status: "awaiting-payment",
      createdAtSecondsAgo: 90000,
      paymentPath: "gateway",
      paymentStatus: "pending",
      authority,
    });

    const mockFetch = async () => {
      throw new Error("Network timeout connecting to ZarinPal");
    };

    const result = await sweepUnpaidGatewayOrders({
      db,
      fetchFn: mockFetch,
      olderThanSeconds: 86400,
    });

    // Must NOT cancel when dead-check cannot reach gateway
    assert.equal(result.cancelledCount, 0);
    assert.equal(result.errors.length, 1);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 45)).get();
    assert.equal(updatedOrder!.status, "awaiting-payment");
  });

  it("auto-cancels 24h card order if never declared", async () => {
    const db = createTestDb();

    createDummyOrder(db, {
      id: 50,
      code: "CARD01",
      status: "awaiting-payment",
      createdAtSecondsAgo: 90000, // 25 hours ago
      paymentPath: "card",
      paymentStatus: "undeclared",
      declaredAt: null,
    });

    const result = await sweepUndeclaredCardOrders({
      db,
      olderThanSeconds: 86400,
    });

    assert.equal(result.cancelledCount, 1);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 50)).get();
    assert.equal(updatedOrder!.status, "cancelled");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 50)).get();
    assert.equal(updatedPayment!.status, "expired");
  });

  it("does NOT auto-cancel 24h card order if declared (declared orders wait for staff)", async () => {
    const db = createTestDb();
    const declaredAt = Math.floor(Date.now() / 1000) - 80000;

    createDummyOrder(db, {
      id: 60,
      code: "CARD02",
      status: "awaiting-payment",
      createdAtSecondsAgo: 90000, // 25 hours ago
      paymentPath: "card",
      paymentStatus: "declared",
      declaredAt,
    });

    // Record a declaration
    db.insert(schema.declarations).values({
      orderId: 60,
      last4: "9876",
      createdAt: declaredAt,
    }).run();

    const result = await sweepUndeclaredCardOrders({
      db,
      olderThanSeconds: 86400,
    });

    assert.equal(result.cancelledCount, 0);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 60)).get();
    assert.equal(updatedOrder!.status, "awaiting-payment");
  });

  it("runs full cron sweep idempotently without error", async () => {
    const db = createTestDb();

    const mockFetch = async () => {
      return {
        json: async () => ({
          data: { code: 100, authorities: [] },
        }),
      } as any;
    };

    const firstRun = await runReconciliationCron({ db, fetchFn: mockFetch });
    assert.equal(firstRun.errors.length, 0);

    const secondRun = await runReconciliationCron({ db, fetchFn: mockFetch });
    assert.equal(secondRun.errors.length, 0);
  });
});
