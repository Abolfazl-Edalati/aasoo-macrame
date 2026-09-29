import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import { submitCustomOrder, checkCustomOrderRateLimit } from "@/lib/custom-order";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      desc TEXT,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE colors (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      hex TEXT NOT NULL,
      sort INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE custom_order_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      collection_id TEXT REFERENCES collections(id),
      is_bulk INTEGER NOT NULL DEFAULT 0,
      deadline TEXT,
      dimensions_text TEXT,
      description TEXT NOT NULL,
      wants_sample INTEGER NOT NULL DEFAULT 0,
      ip TEXT,
      archived_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE submission_colors (
      submission_id INTEGER NOT NULL REFERENCES custom_order_submissions(id) ON DELETE CASCADE,
      color_id TEXT NOT NULL REFERENCES colors(id)
    );
  `);
  return drizzle(sqlite, { schema });
}

describe("submitCustomOrder", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.insert(schema.collections).values({ id: "wall", name: "تابلو دیواری" }).run();
    testDb.insert(schema.colors).values({ id: "natural", label: "نخودی", hex: "#E8DFD1" }).run();
  });

  it("successfully creates submission and submission colors", async () => {
    const res = await submitCustomOrder(
      {
        name: "سارا محمدی",
        phone: "09123456789",
        collectionId: "wall",
        isBulk: false,
        deadline: "تا یک ماه",
        dimensionsText: "۸۰×۱۲۰",
        description: "این یک توضیح نمونه برای سفارش اختصاصی تابلو دیواری است.",
        colors: ["natural"],
        wantsSample: true,
      },
      { db: testDb, ip: "127.0.0.1" }
    );

    assert.equal(res.success, true);
    assert.match(res.code ?? "", /^CO-\d{5}$/);

    const rows = testDb.select().from(schema.customOrderSubmissions).all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "سارا محمدی");
    assert.equal(rows[0].phone, "09123456789");
    assert.equal(rows[0].wantsSample, true);
    assert.equal(rows[0].email, null);

    const colorRows = testDb.select().from(schema.submissionColors).all();
    assert.equal(colorRows.length, 1);
    assert.equal(colorRows[0].colorId, "natural");
  });

  it("honeypot never stored in DB and returns dummy success", async () => {
    const res = await submitCustomOrder(
      {
        name: "Bot Name",
        phone: "09123456789",
        description: "Bot spamming description that is long enough.",
        honeypot: "http://spam.com",
      },
      { db: testDb }
    );

    assert.equal(res.success, true);
    const rows = testDb.select().from(schema.customOrderSubmissions).all();
    assert.equal(rows.length, 0); // never stored
  });

  it("rejects invalid phone numbers", async () => {
    const res = await submitCustomOrder(
      {
        name: "علی",
        phone: "02188888888",
        description: "توضیحات طولانی برای تست شماره تلفن نامعتبر.",
      },
      { db: testDb }
    );

    assert.equal(res.success, false);
    assert.ok(res.error);
    const rows = testDb.select().from(schema.customOrderSubmissions).all();
    assert.equal(rows.length, 0);
  });

  it("enforces ~3/hour per-phone cooldown", async () => {
    const validPayload = {
      name: "سارا محمدی",
      phone: "09123456789",
      description: "این یک توضیح نمونه برای سفارش اختصاصی تابلو دیواری است.",
    };

    // First 3 submissions should succeed
    const res1 = await submitCustomOrder(validPayload, { db: testDb });
    const res2 = await submitCustomOrder(validPayload, { db: testDb });
    const res3 = await submitCustomOrder(validPayload, { db: testDb });
    assert.equal(res1.success, true);
    assert.equal(res2.success, true);
    assert.equal(res3.success, true);

    // 4th submission in same hour should be rate-limited
    const res4 = await submitCustomOrder(validPayload, { db: testDb });
    assert.equal(res4.success, false);
    assert.match(res4.error ?? "", /بیش از حد مجاز/);

    const rows = testDb.select().from(schema.customOrderSubmissions).all();
    assert.equal(rows.length, 3);
  });
});
