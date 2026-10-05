import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import {
  getAdminAttentionQueue,
  getAdminKanbanOrders,
  adminApproveOrder,
  adminRejectOrder,
  adminOverrideApproveOrder,
  adminTransitionOrder,
} from "@/lib/admin/orders";

describe("Admin Order Operations & Attention Queue", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    const migrationSql = fs.readFileSync(path.join(process.cwd(), "drizzle", "0000_robust_iceman.sql"), "utf-8");
    const statements = migrationSql.split("--> statement-breakpoint");
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        sqlite.exec(trimmed);
      }
    }
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });

    // Seed test collections and colors
    db.insert(schema.collections).values({ id: "wall", name: "دیوارکوب", sort: 1 }).run();
    db.insert(schema.colors).values({ id: "cream", label: "کرم طبیعی", hex: "#F4F0EA" }).run();

    // Seed test staff user
    db.insert(schema.staffUsers)
      .values({
        id: 1,
        username: "admin",
        passwordHash: "hash",
        displayName: "ابوالفضل",
      })
      .run();

    // Seed test customer
    db.insert(schema.customers)
      .values({
        id: 1,
        phone: "09123456789",
        name: "سارا حسینی",
      })
      .run();

    // Seed test product with stock
    db.insert(schema.products)
      .values({
        id: 1,
        slug: "macrame-wall",
        name: "دیوارکوب بوهمی",
        description: "دیوارکوب دستبافت مکرومه با نخ پنبه مرغوب",
        collectionId: "wall",
        priceToman: 450000,
        stock: 5,
        status: "published",
      })
      .run();
  });

  test("getAdminAttentionQueue retrieves declared payments, stale declarations, and pending gateway payments", () => {
    const now = Math.floor(Date.now() / 1000);
    const staleTime = now - 75 * 3600; // 75h ago (stale > 72h)

    // Order 1: Card declared (recent)
    db.insert(schema.orders)
      .values({
        id: 101,
        code: "ORD101",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان تجریش، خیابان باهنر",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now - 3600,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 101,
        path: "card",
        status: "declared",
        last4: "1234",
        traceCode: "TRC101",
        declaredAt: now - 3600,
      })
      .run();

    // Order 2: Card declared (>72h stale)
    db.insert(schema.orders)
      .values({
        id: 102,
        code: "ORD102",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "مریم احمدی",
        addressText: "شیراز، خیابان زند، پلاک ۱۲",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: staleTime,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 102,
        path: "card",
        status: "declared",
        last4: "5678",
        declaredAt: staleTime,
      })
      .run();

    // Order 3: Gateway pending
    db.insert(schema.orders)
      .values({
        id: 103,
        code: "ORD103",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "علی رضایی",
        addressText: "اصفهان، میدان نقش جهان",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now - 1800,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 103,
        path: "gateway",
        status: "pending",
        authority: "A0000000000000000000000000000000103",
        amountRial: 4500000,
      })
      .run();

    // Order 4: Already paid (should NOT be in attention queue)
    db.insert(schema.orders)
      .values({
        id: 104,
        code: "ORD104",
        customerId: 1,
        status: "paid",
        recipientName: "فاطمه کاظمی",
        addressText: "مشهد، بلوار سجاد",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now - 7200,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 104,
        path: "card",
        status: "approved",
      })
      .run();

    const queue = getAdminAttentionQueue({ db });
    assert.equal(queue.length, 3);

    const ord101 = queue.find((o) => o.code === "ORD101");
    assert.ok(ord101);
    assert.equal(ord101.paymentStatus, "declared");
    assert.equal(ord101.isStale, false);

    const ord102 = queue.find((o) => o.code === "ORD102");
    assert.ok(ord102);
    assert.equal(ord102.paymentStatus, "declared");
    assert.equal(ord102.isStale, true);

    const ord103 = queue.find((o) => o.code === "ORD103");
    assert.ok(ord103);
    assert.equal(ord103.paymentPath, "gateway");
    assert.equal(ord103.paymentStatus, "pending");
  });

  test("getAdminKanbanOrders segments orders into paid, in-progress, and shipped", () => {
    const now = Math.floor(Date.now() / 1000);

    // Order in paid
    db.insert(schema.orders)
      .values({
        id: 201,
        code: "ORD201",
        customerId: 1,
        status: "paid",
        recipientName: "مشتری ۱",
        addressText: "تهران، خیابان ولیعصر",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 201,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 1,
      })
      .run();

    // Order in in-progress
    db.insert(schema.orders)
      .values({
        id: 202,
        code: "ORD202",
        customerId: 1,
        status: "in-progress",
        recipientName: "مشتری ۲",
        addressText: "تهران، پونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 202,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 2,
      })
      .run();

    // Order in shipped
    db.insert(schema.orders)
      .values({
        id: 203,
        code: "ORD203",
        customerId: 1,
        status: "shipped",
        trackingCode: "POST123456789",
        recipientName: "مشتری ۳",
        addressText: "تبریز، خیابان آزادی",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
        createdAt: now,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 203,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 1,
      })
      .run();

    const kanban = getAdminKanbanOrders({ db });
    assert.equal(kanban.paid.length, 1);
    assert.equal(kanban.paid[0].code, "ORD201");
    assert.equal(kanban.inProgress.length, 1);
    assert.equal(kanban.inProgress[0].code, "ORD202");
    assert.equal(kanban.shipped.length, 1);
    assert.equal(kanban.shipped[0].code, "ORD203");
    assert.equal(kanban.shipped[0].trackingCode, "POST123456789");
  });

  test("adminApproveOrder approves declaration and flips order to paid, decrementing stock", async () => {
    const now = Math.floor(Date.now() / 1000);
    db.insert(schema.orders)
      .values({
        id: 301,
        code: "ORD301",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان ونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 301,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 2,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 301,
        path: "card",
        status: "declared",
        last4: "9876",
        declaredAt: now,
      })
      .run();

    const res = await adminApproveOrder(301, { staffUserId: 1, staffNote: "تأیید شد" }, { db });
    assert.equal(res.success, true);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 301)).get();
    assert.equal(updatedOrder?.status, "paid");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 301)).get();
    assert.equal(updatedPayment?.status, "approved");
    assert.equal(updatedPayment?.staffNote, "تأیید شد");

    const updatedProduct = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(updatedProduct?.stock, 3); // 5 - 2 = 3
  });

  test("adminRejectOrder rejects declaration with reason visible to customer", async () => {
    const now = Math.floor(Date.now() / 1000);
    db.insert(schema.orders)
      .values({
        id: 302,
        code: "ORD302",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان ونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 302,
        path: "card",
        status: "declared",
        last4: "9876",
        declaredAt: now,
      })
      .run();
    db.insert(schema.declarations)
      .values({
        orderId: 302,
        last4: "9876",
        createdAt: now,
      })
      .run();

    const res = await adminRejectOrder(
      302,
      { staffUserId: 1, reason: "مبلغی به حساب واریز نشده است" },
      { db }
    );
    assert.equal(res.success, true);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 302)).get();
    assert.equal(updatedOrder?.status, "awaiting-payment");

    const updatedPayment = db.select().from(schema.payments).where(eq(schema.payments.orderId, 302)).get();
    assert.equal(updatedPayment?.status, "rejected");
    assert.equal(updatedPayment?.rejectReason, "مبلغی به حساب واریز نشده است");

    const updatedDecl = db.select().from(schema.declarations).where(eq(schema.declarations.orderId, 302)).get();
    assert.equal(updatedDecl?.rejectedReason, "مبلغی به حساب واریز نشده است");
  });

  test("adminOverrideApproveOrder manually approves any unpaid order with note", async () => {
    db.insert(schema.orders)
      .values({
        id: 303,
        code: "ORD303",
        customerId: 1,
        status: "awaiting-payment",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان ونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 303,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 1,
      })
      .run();
    db.insert(schema.payments)
      .values({
        orderId: 303,
        path: "card",
        status: "undeclared",
      })
      .run();

    const res = await adminOverrideApproveOrder(
      303,
      { staffUserId: 1, staffNote: "واریز نقدی در کارگاه انجام شد" },
      { db }
    );
    assert.equal(res.success, true);

    const updatedOrder = db.select().from(schema.orders).where(eq(schema.orders.id, 303)).get();
    assert.equal(updatedOrder?.status, "paid");

    const updatedProduct = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(updatedProduct?.stock, 4); // 5 - 1 = 4
  });

  test("adminTransitionOrder progresses order post-paid and handles cancelled-refunded stock restoration", async () => {
    db.insert(schema.orders)
      .values({
        id: 401,
        code: "ORD401",
        customerId: 1,
        status: "paid",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان ونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 401,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 2,
      })
      .run();

    // 1. Advance to in-progress
    const step1 = await adminTransitionOrder(401, "in-progress", { staffUserId: 1 }, { db });
    assert.equal(step1.success, true);
    assert.equal(step1.order?.status, "in-progress");

    // 2. Advance to shipped with tracking code
    const step2 = await adminTransitionOrder(
      401,
      "shipped",
      { staffUserId: 1, trackingCode: "IRPOST9876543210" },
      { db }
    );
    assert.equal(step2.success, true);
    assert.equal(step2.order?.status, "shipped");
    assert.equal(step2.order?.trackingCode, "IRPOST9876543210");

    // 3. Forbid cancelled-refunded after shipped
    const step3 = await adminTransitionOrder(401, "cancelled-refunded", { staffUserId: 1 }, { db });
    assert.equal(step3.success, false);

    // 4. Test cancelled-refunded before shipped restores stock
    db.insert(schema.orders)
      .values({
        id: 402,
        code: "ORD402",
        customerId: 1,
        status: "paid",
        recipientName: "سارا حسینی",
        addressText: "تهران، میدان ونک",
        subtotalToman: 450000,
        shippingToman: 0,
        totalToman: 450000,
      })
      .run();
    db.insert(schema.orderLines)
      .values({
        orderId: 402,
        productId: 1,
        name: "دیوارکوب بوهمی",
        unitPriceToman: 450000,
        qty: 2,
      })
      .run();
    // Simulate stock after paid (was 5, decremented to 3)
    db.update(schema.products).set({ stock: 3 }).where(eq(schema.products.id, 1)).run();

    const refundStep = await adminTransitionOrder(402, "cancelled-refunded", { staffUserId: 1 }, { db });
    assert.equal(refundStep.success, true);
    assert.equal(refundStep.order?.status, "cancelled-refunded");

    const restoredProduct = db.select().from(schema.products).where(eq(schema.products.id, 1)).get();
    assert.equal(restoredProduct?.stock, 5); // 3 + 2 = 5
  });
});
