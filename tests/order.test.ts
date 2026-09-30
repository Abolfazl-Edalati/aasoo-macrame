import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  generateOrderCode,
  isValidOrderCode,
  ORDER_CODE_CHARSET,
  ORDER_CONFIG,
  ORDER_ERRORS,
  isPaymentStale,
  canTransitionOrder,
  transitionOrderStatus,
  createOrder,
  declareCardPayment,
  approveCardPayment,
  rejectCardPayment,
  staffOverrideApprove,
  customerCancelOrder,
} from "@/lib/orders";

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

  // Enable foreign keys
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
    description: "دیوارکوب زیبا با گره‌های دستبافت و چوب طبیعی",
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

  return db;
}

describe("Order Code Generator", () => {
  it("generates 6-character random code from confusable-free charset", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateOrderCode();
      assert.equal(code.length, 6);
      assert.match(code, /^[2-9A-HJ-NP-Z]{6}$/);

      // Verify no confusable characters (0, O, 1, I)
      assert.ok(!code.includes("0"), "Must not contain digit 0");
      assert.ok(!code.includes("O"), "Must not contain letter O");
      assert.ok(!code.includes("1"), "Must not contain digit 1");
      assert.ok(!code.includes("I"), "Must not contain letter I");

      assert.equal(isValidOrderCode(code), true);
    }
  });

  it("validates confusable-free codes correctly", () => {
    assert.equal(isValidOrderCode("234567"), true);
    assert.equal(isValidOrderCode("ABCDEF"), true);
    assert.equal(isValidOrderCode("WXYZ23"), true);

    // Invalid codes
    assert.equal(isValidOrderCode("123456"), false, "contains 1");
    assert.equal(isValidOrderCode("023456"), false, "contains 0");
    assert.equal(isValidOrderCode("ABCDOI"), false, "contains O and I");
    assert.equal(isValidOrderCode("SHORT"), false, "length < 6");
    assert.equal(isValidOrderCode("TOOLONG1"), false, "length > 6");
  });
});

describe("Order Creation & Freezing", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  it("creates order row pre-redirect with awaiting-payment status and frozen snapshots", async () => {
    const res = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        postalCode: "1912345678",
        items: [{ id: 1, size: 10, color: "cream", qty: 1 }],
        paymentPath: "card",
        note: "بسته‌بندی هدیه",
      },
      { db: testDb }
    );

    assert.equal(res.success, true);
    if (!res.success) return;

    assert.match(res.orderCode, /^[2-9A-HJ-NP-Z]{6}$/);
    assert.equal(res.order.status, "awaiting-payment");
    assert.equal(res.order.recipientName, "مریم سعیدی");
    assert.equal(res.order.addressText, "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴");
    assert.equal(res.order.postalCode, "1912345678");
    assert.equal(res.order.note, "بسته‌بندی هدیه");

    // Price calculation: base 450,000 + size delta 50,000 = 500,000.
    // Total >= 300,000 (free shipping threshold) => shipping = 0
    assert.equal(res.order.subtotalToman, 500000);
    assert.equal(res.order.shippingToman, 0);
    assert.equal(res.order.totalToman, 500000);

    // Verify order_lines frozen snapshot
    const lines = testDb.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, res.order.id)).all();
    assert.equal(lines.length, 1);
    assert.equal(lines[0].productId, 1);
    assert.equal(lines[0].name, "دیوارکوب پر مکرومه");
    assert.equal(lines[0].sizeLabel, "متوسط (۴۰×۶۰)");
    assert.equal(lines[0].colorLabel, "کرم طبیعی");
    assert.equal(lines[0].unitPriceToman, 500000);
    assert.equal(lines[0].qty, 1);

    // Verify payment row initialized to 'undeclared'
    const payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, res.order.id)).get();
    assert.ok(payment);
    assert.equal(payment.path, "card");
    assert.equal(payment.status, "undeclared");

    // CRITICAL: Stock does NOT decrement on order creation!
    const product = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(product?.stock, 5, "Stock must remain 5 while awaiting-payment");
  });

  it("preserves order line snapshots with soft FK product_id ON DELETE SET NULL", async () => {
    const res = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان ولیعصر، کوچه فیروز، پلاک ۵",
        items: [{ id: 1, size: 10, color: "cream", qty: 2 }],
        paymentPath: "card",
      },
      { db: testDb }
    );
    assert.equal(res.success, true);
    if (!res.success) return;

    // Delete product from catalog
    testDb.delete(schema.products).where(eq(schema.products.id, 1)).run();

    // Order lines still exist and frozen data is preserved, productId becomes null
    const lines = testDb.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, res.order.id)).all();
    assert.equal(lines.length, 1);
    assert.equal(lines[0].productId, null);
    assert.equal(lines[0].name, "دیوارکوب پر مکرومه");
    assert.equal(lines[0].unitPriceToman, 500000);
    assert.equal(lines[0].qty, 2);
  });

  it("rejects order creation when address is shorter than 12 characters", async () => {
    const res = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم",
        addressText: "کوتاه",
        items: [{ id: 1, size: 10, color: "cream", qty: 1 }],
        paymentPath: "card",
      },
      { db: testDb }
    );

    assert.equal(res.success, false);
    assert.equal(res.error, ORDER_ERRORS.INVALID_ADDRESS);
  });

  it("rejects order creation when cart is empty", async () => {
    const res = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [],
        paymentPath: "card",
      },
      { db: testDb }
    );

    assert.equal(res.success, false);
    assert.equal(res.error, ORDER_ERRORS.EMPTY_CART);
  });
});

describe("Order State Machine & Stock Transitions", () => {
  let testDb: ReturnType<typeof createTestDb>;
  let orderId: number;
  let orderCode: string;

  beforeEach(async () => {
    testDb = createTestDb();
    const created = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 2 }],
        paymentPath: "card",
      },
      { db: testDb }
    );
    assert.equal(created.success, true);
    if (!created.success) return;
    orderId = created.order.id;
    orderCode = created.orderCode;
  });

  it("decrements stock ONLY when order transitions to 'paid'", async () => {
    // Initial stock is 5
    let prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 5);

    // Transition to 'paid'
    const res = await transitionOrderStatus(orderId, "paid", { actor: "staff", staffUserId: 1 }, { db: testDb });
    assert.equal(res.success, true);
    assert.equal(res.order?.status, "paid");

    // Stock decremented by qty 2 => 3
    prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 3);
  });

  it("allows staff progression: paid -> in-progress -> shipped -> delivered", async () => {
    // awaiting-payment -> paid
    await transitionOrderStatus(orderId, "paid", { actor: "staff" }, { db: testDb });

    // paid -> in-progress
    const inProg = await transitionOrderStatus(orderId, "in-progress", { actor: "staff" }, { db: testDb });
    assert.equal(inProg.success, true);
    assert.equal(inProg.order?.status, "in-progress");

    // in-progress -> shipped with tracking code
    const shipped = await transitionOrderStatus(
      orderId,
      "shipped",
      { actor: "staff", trackingCode: "POST12345678" },
      { db: testDb }
    );
    assert.equal(shipped.success, true);
    assert.equal(shipped.order?.status, "shipped");
    assert.equal(shipped.order?.trackingCode, "POST12345678");

    // shipped -> delivered
    const delivered = await transitionOrderStatus(orderId, "delivered", { actor: "staff" }, { db: testDb });
    assert.equal(delivered.success, true);
    assert.equal(delivered.order?.status, "delivered");
  });

  it("restores stock when transitioning from paid to cancelled-refunded", async () => {
    // Transition to paid (stock drops from 5 to 3)
    await transitionOrderStatus(orderId, "paid", { actor: "staff" }, { db: testDb });
    let prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 3);

    // Staff cancels and refunds before shipping
    const refunded = await transitionOrderStatus(orderId, "cancelled-refunded", { actor: "staff" }, { db: testDb });
    assert.equal(refunded.success, true);
    assert.equal(refunded.order?.status, "cancelled-refunded");

    // Stock restored back to 5
    prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 5);
  });

  it("allows customer self-cancel ONLY while unpaid", async () => {
    // Self-cancel while awaiting-payment
    const cancelRes = await customerCancelOrder(orderCode, 1, { db: testDb });
    assert.equal(cancelRes.success, true);

    const order = testDb.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    assert.equal(order?.status, "cancelled");

    // Stock was never decremented, remains 5
    const prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 5);
  });

  it("forbids customer self-cancel once paid", async () => {
    await transitionOrderStatus(orderId, "paid", { actor: "staff" }, { db: testDb });

    const cancelRes = await customerCancelOrder(orderCode, 1, { db: testDb });
    assert.equal(cancelRes.success, false);
    assert.equal(cancelRes.error, ORDER_ERRORS.CANNOT_CANCEL_PAID);
  });

  it("supports late-money reopen: cancelled -> paid", async () => {
    // Order cancelled
    await transitionOrderStatus(orderId, "cancelled", { actor: "system" }, { db: testDb });

    // Late money arrived, staff or system reopens
    const reopen = await transitionOrderStatus(orderId, "paid", { actor: "staff", staffUserId: 1 }, { db: testDb });
    assert.equal(reopen.success, true);
    assert.equal(reopen.order?.status, "paid");

    // Stock decremented on reopen to paid
    const prod = testDb.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(prod?.stock, 3);
  });
});

describe("Card-to-card Lifecycle & Declarations", () => {
  let testDb: ReturnType<typeof createTestDb>;
  let orderId: number;

  beforeEach(async () => {
    testDb = createTestDb();
    const created = await createOrder(
      {
        customerId: 1,
        recipientName: "مریم سعیدی",
        addressText: "تهران، خیابان شریعتی، کوچه بهار، پلاک ۲۴",
        items: [{ id: 1, size: 10, color: "cream", qty: 1 }],
        paymentPath: "card",
      },
      { db: testDb }
    );
    assert.equal(created.success, true);
    if (!created.success) return;
    orderId = created.order.id;
  });

  it("handles full lifecycle: undeclared -> declared -> rejected -> re-declared -> approved", async () => {
    // 1. Initially undeclared
    let payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "undeclared");

    // 2. Customer declares card payment (converting Persian digits)
    const decl1 = await declareCardPayment(
      orderId,
      { last4: "۶۰۳۷", traceCode: "TR-12345" },
      1,
      { db: testDb }
    );
    assert.equal(decl1.success, true);

    payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "declared");
    assert.equal(payment?.last4, "6037");
    assert.equal(payment?.traceCode, "TR-12345");
    assert.ok(payment?.declaredAt);

    // Verify declaration logged
    let declRows = testDb.select().from(schema.declarations).where(eq(schema.declarations.orderId, orderId)).all();
    assert.equal(declRows.length, 1);
    assert.equal(declRows[0].last4, "6037");

    // 3. Staff rejects with reason
    const rej = await rejectCardPayment(
      orderId,
      { staffUserId: 1, reason: "مبلغ واریزی کمتر از کل سفارش است" },
      { db: testDb }
    );
    assert.equal(rej.success, true);

    payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "rejected");
    assert.equal(payment?.rejectReason, "مبلغ واریزی کمتر از کل سفارش است");

    declRows = testDb.select().from(schema.declarations).where(eq(schema.declarations.orderId, orderId)).all();
    assert.equal(declRows[0].rejectedReason, "مبلغ واریزی کمتر از کل سفارش است");
    assert.ok(declRows[0].rejectedAt);

    // 4. Customer re-declares (returns to declared, clears rejectReason, stores new declaration row)
    const decl2 = await declareCardPayment(
      orderId,
      { last4: "8888", traceCode: "TR-99999" },
      1,
      { db: testDb }
    );
    assert.equal(decl2.success, true);

    payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "declared");
    assert.equal(payment?.last4, "8888");
    assert.equal(payment?.rejectReason, null, "rejectReason must be cleared on re-declaration");

    // Both declarations are preserved in history (CONTEXT.md: all attempts kept)
    declRows = testDb.select().from(schema.declarations).where(eq(schema.declarations.orderId, orderId)).all();
    assert.equal(declRows.length, 2);
    assert.equal(declRows[0].last4, "6037");
    assert.equal(declRows[1].last4, "8888");

    // 5. Staff approves payment
    const app = await approveCardPayment(
      orderId,
      { staffUserId: 1, staffNote: "تأیید شد با بانک ملی" },
      { db: testDb }
    );
    assert.equal(app.success, true);

    payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "approved");
    assert.ok(payment?.approvedAt);

    // Order transitioned to 'paid'
    const order = testDb.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    assert.equal(order?.status, "paid");
  });

  it("staff override-approve works on unpaid order", async () => {
    const override = await staffOverrideApprove(
      orderId,
      { staffUserId: 1, staffNote: "تأیید دستی شتاب" },
      { db: testDb }
    );
    assert.equal(override.success, true);

    const payment = testDb.select().from(schema.payments).where(eq(schema.payments.orderId, orderId)).get();
    assert.equal(payment?.status, "approved");

    const order = testDb.select().from(schema.orders).where(eq(schema.orders.id, orderId)).get();
    assert.equal(order?.status, "paid");
  });

  it("rejects declaration with invalid last4", async () => {
    const res1 = await declareCardPayment(orderId, { last4: "123" }, 1, { db: testDb });
    assert.equal(res1.success, false);
    assert.equal(res1.error, ORDER_ERRORS.INVALID_CARD_LAST4);

    const res2 = await declareCardPayment(orderId, { last4: "12345" }, 1, { db: testDb });
    assert.equal(res2.success, false);
    assert.equal(res2.error, ORDER_ERRORS.INVALID_CARD_LAST4);
  });
});

describe("72h Staleness Computation", () => {
  it("computes staleness correctly from declared_at without DB persistence", () => {
    const now = Math.floor(Date.now() / 1000);

    // Declared 10 hours ago -> not stale
    assert.equal(isPaymentStale(now - 10 * 3600), false);

    // Declared 71 hours ago -> not stale
    assert.equal(isPaymentStale(now - 71 * 3600), false);

    // Declared 72 hours ago -> stale
    assert.equal(isPaymentStale(now - 72 * 3600), true);

    // Declared 100 hours ago -> stale
    assert.equal(isPaymentStale(now - 100 * 3600), true);

    // Null or undefined declared_at -> not stale
    assert.equal(isPaymentStale(null), false);
    assert.equal(isPaymentStale(undefined), false);
  });
});
