import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { hash } from "@node-rs/argon2";
import * as schema from "@/db/schema";
import {
  AUTH_CONFIG,
  AUTH_ERRORS,
  assertProductionBootGuard,
  requestOtp,
  verifyOtp,
  hashOtpCode,
  createSession,
  getSession,
  destroySession,
  authenticateStaff,
  resetStaffThrottles,
  getCustomerAddresses,
  createCustomerAddress,
  deleteCustomerAddress,
} from "@/lib/auth";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE customer_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      text TEXT NOT NULL,
      postal_code TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code_sha256 TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      ip TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE staff_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token_sha256 TEXT NOT NULL UNIQUE,
      subject_type TEXT NOT NULL,
      subject_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);
  return drizzle(sqlite, { schema });
}

describe("assertProductionBootGuard", () => {
  it("throws when NODE_ENV=production and SMS_SEND=false", () => {
    const env = process.env as Record<string, string | undefined>;
    const origEnv = env.NODE_ENV;
    const origSms = env.SMS_SEND;

    try {
      env.NODE_ENV = "production";
      env.SMS_SEND = "false";
      assert.throws(() => assertProductionBootGuard(), /Boot guard/);
    } finally {
      env.NODE_ENV = origEnv;
      env.SMS_SEND = origSms;
    }
  });

  it("does not throw in development or when SMS_SEND=true", () => {
    const env = process.env as Record<string, string | undefined>;
    const origEnv = env.NODE_ENV;
    const origSms = env.SMS_SEND;

    try {
      env.NODE_ENV = "development";
      env.SMS_SEND = "false";
      assert.doesNotThrow(() => assertProductionBootGuard());

      env.NODE_ENV = "production";
      env.SMS_SEND = "true";
      assert.doesNotThrow(() => assertProductionBootGuard());
    } finally {
      env.NODE_ENV = origEnv;
      env.SMS_SEND = origSms;
    }
  });
});

describe("OTP request & throttling", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  it("successfully requests OTP and stores SHA-256 hashed code", async () => {
    const res = await requestOtp("۰۹۱۲۳۴۵۶۷۸۹", { db: testDb });
    assert.equal(res.success, true);
    assert.equal(res.cooldownSeconds, AUTH_CONFIG.OTP_RESEND_COOLDOWN_SECONDS);

    const rows = testDb.select().from(schema.otpCodes).all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].phone, "09123456789");
    assert.equal(rows[0].attempts, 0);
    assert.equal(rows[0].consumedAt, null);
    assert.match(rows[0].codeSha256, /^[a-f0-9]{64}$/);
  });

  it("enforces 60-second resend cooldown", async () => {
    const res1 = await requestOtp("09123456789", { db: testDb });
    assert.equal(res1.success, true);

    const res2 = await requestOtp("09123456789", { db: testDb });
    assert.equal(res2.success, false);
    assert.match(res2.error, /ثانیه تا درخواست مجدد/);
  });

  it("invalidates previous unconsumed codes on new request (single active code)", async () => {
    await requestOtp("09123456789", { db: testDb });

    // Manually age the first code so resend cooldown passes
    const past = Math.floor(Date.now() / 1000) - 70;
    testDb.update(schema.otpCodes).set({ createdAt: past }).run();

    const res2 = await requestOtp("09123456789", { db: testDb });
    assert.equal(res2.success, true);

    const rows = testDb.select().from(schema.otpCodes).all();
    assert.equal(rows.length, 2);
    assert.ok(rows[0].consumedAt !== null);
    assert.equal(rows[1].consumedAt, null);
  });

  it("enforces hourly limit (5 requests / hour) with verbatim Persian error", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Insert 5 requests within the last hour
    for (let i = 0; i < 5; i++) {
      testDb.insert(schema.otpCodes).values({
        phone: "09123456789",
        codeSha256: "dummyhash",
        attempts: 0,
        expiresAt: now + 120,
        consumedAt: now,
        createdAt: now - (3000 - i * 60),
      }).run();
    }

    const res = await requestOtp("09123456789", { db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.PHONE_HOURLY_LOCK);
    assert.ok(res.unlockInSeconds && res.unlockInSeconds > 0);
  });

  it("enforces daily limit (10 requests / 24h) with verbatim Persian error", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Insert 10 requests within 24h
    for (let i = 0; i < 10; i++) {
      testDb.insert(schema.otpCodes).values({
        phone: "09123456789",
        codeSha256: "dummyhash",
        attempts: 0,
        expiresAt: now + 120,
        consumedAt: now,
        createdAt: now - (50000 - i * 1000),
      }).run();
    }

    const res = await requestOtp("09123456789", { db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.PHONE_DAILY_LOCK);
    assert.equal(res.isDailyLock, true);
  });

  it("enforces IP limit (20 requests / hour) with verbatim Persian error", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Insert 20 requests for the same IP
    for (let i = 0; i < 20; i++) {
      testDb.insert(schema.otpCodes).values({
        phone: `091200000${i.toString().padStart(2, "0")}`,
        codeSha256: "dummyhash",
        attempts: 0,
        expiresAt: now + 120,
        consumedAt: now,
        ip: "192.168.1.100",
        createdAt: now - (1000 - i * 10),
      }).run();
    }

    const res = await requestOtp("09981234567", { ip: "192.168.1.100", db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.IP_LOCK);
  });
});

describe("OTP verification & implicit signup", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
  });

  it("verifies matching code and creates customer implicitly", async () => {
    const now = Math.floor(Date.now() / 1000);
    const code = "123456";
    testDb.insert(schema.otpCodes).values({
      phone: "09123456789",
      codeSha256: hashOtpCode(code),
      attempts: 0,
      expiresAt: now + 120,
      createdAt: now,
    }).run();

    const res = await verifyOtp("09123456789", "۱۲۳۴۵۶", { db: testDb });
    assert.equal(res.success, true);
    assert.equal(res.customer.phone, "09123456789");

    // Check DB customer row created
    const customer = testDb.select().from(schema.customers).get();
    assert.ok(customer);
    assert.equal(customer.phone, "09123456789");

    // Check OTP marked as consumed
    const otp = testDb.select().from(schema.otpCodes).get();
    assert.ok(otp?.consumedAt);
  });

  it("returns verbatim wrong code error for failures 1 to 3", async () => {
    const now = Math.floor(Date.now() / 1000);
    testDb.insert(schema.otpCodes).values({
      phone: "09123456789",
      codeSha256: hashOtpCode("123456"),
      attempts: 0,
      expiresAt: now + 120,
      createdAt: now,
    }).run();

    const res1 = await verifyOtp("09123456789", "999999", { db: testDb });
    assert.equal(res1.success, false);
    assert.equal(res1.error, AUTH_ERRORS.WRONG_CODE);

    const otp = testDb.select().from(schema.otpCodes).get();
    assert.equal(otp?.attempts, 1);
  });

  it("appends last-attempt warning on 4th wrong code attempt", async () => {
    const now = Math.floor(Date.now() / 1000);
    testDb.insert(schema.otpCodes).values({
      phone: "09123456789",
      codeSha256: hashOtpCode("123456"),
      attempts: 3,
      expiresAt: now + 120,
      createdAt: now,
    }).run();

    const res = await verifyOtp("09123456789", "999999", { db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.WRONG_CODE_LAST_ATTEMPT);

    const otp = testDb.select().from(schema.otpCodes).get();
    assert.equal(otp?.attempts, 4);
    assert.equal(otp?.consumedAt, null);
  });

  it("consumes code on 5th wrong code attempt and returns expired/consumed error", async () => {
    const now = Math.floor(Date.now() / 1000);
    testDb.insert(schema.otpCodes).values({
      phone: "09123456789",
      codeSha256: hashOtpCode("123456"),
      attempts: 4,
      expiresAt: now + 120,
      createdAt: now,
    }).run();

    const res = await verifyOtp("09123456789", "999999", { db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED);
    assert.equal(res.isExpiredOrConsumed, true);

    const otp = testDb.select().from(schema.otpCodes).get();
    assert.equal(otp?.attempts, 5);
    assert.ok(otp?.consumedAt);
  });

  it("rejects expired OTP with verbatim Persian error", async () => {
    const past = Math.floor(Date.now() / 1000) - 200;
    testDb.insert(schema.otpCodes).values({
      phone: "09123456789",
      codeSha256: hashOtpCode("123456"),
      attempts: 0,
      expiresAt: past + 120,
      createdAt: past,
    }).run();

    const res = await verifyOtp("09123456789", "123456", { db: testDb });
    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED);
  });
});

describe("Sessions", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.insert(schema.customers).values({ id: 1, phone: "09123456789", name: "زهرا" }).run();
  });

  it("creates 256-bit session token, stores SHA-256 hashed at rest with 30-day expiry", async () => {
    const { token, expiresAt, session } = await createSession("customer", 1, { db: testDb });

    assert.equal(token.length, 64); // 256 bits = 32 bytes = 64 hex chars
    assert.equal(session.subjectType, "customer");
    assert.equal(session.subjectId, 1);
    assert.ok(expiresAt > Math.floor(Date.now() / 1000) + 29 * 86400);

    const dbRow = testDb.select().from(schema.sessions).get();
    assert.ok(dbRow);
    assert.notEqual(dbRow.tokenSha256, token); // hashed at rest
  });

  it("resolves session and destroys session on logout", async () => {
    const { token } = await createSession("customer", 1, { db: testDb });

    const currentUser = await getSession(token, { db: testDb });
    assert.ok(currentUser);
    assert.equal(currentUser.type, "customer");
    assert.equal(currentUser.customer.phone, "09123456789");

    const destroyed = await destroySession(token, { db: testDb });
    assert.equal(destroyed, true);

    const afterDestroy = await getSession(token, { db: testDb });
    assert.equal(afterDestroy, null);
  });

  it("invalidates old session token (single active identity per browser)", async () => {
    const session1 = await createSession("customer", 1, { db: testDb });
    const session2 = await createSession("customer", 1, { oldToken: session1.token, db: testDb });

    const checkOld = await getSession(session1.token, { db: testDb });
    assert.equal(checkOld, null);

    const checkNew = await getSession(session2.token, { db: testDb });
    assert.ok(checkNew);
  });
});

describe("Staff login & throttling", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(async () => {
    testDb = createTestDb();
    resetStaffThrottles();
    const passwordHash = await hash("gereh-secret-pass");
    testDb.insert(schema.staffUsers).values({
      id: 1,
      username: "admin",
      passwordHash,
      displayName: "مدیر کارگاه",
    }).run();
  });

  it("authenticates with correct credentials and creates staff session", async () => {
    const res = await authenticateStaff("admin", "gereh-secret-pass", { db: testDb });
    assert.equal(res.success, true);
    assert.ok(res.token);
    assert.equal(res.staffUser?.username, "admin");

    const currentUser = await getSession(res.token, { db: testDb });
    assert.ok(currentUser);
    assert.equal(currentUser.type, "staff");
    assert.equal(currentUser.staff.displayName, "مدیر کارگاه");
  });

  it("returns generic error on wrong username or password", async () => {
    const res1 = await authenticateStaff("wrongadmin", "pass", { db: testDb });
    assert.equal(res1.success, false);
    assert.equal(res1.error, AUTH_ERRORS.STAFF_LOGIN_FAILED);

    const res2 = await authenticateStaff("admin", "wrongpass", { db: testDb });
    assert.equal(res2.success, false);
    assert.equal(res2.error, AUTH_ERRORS.STAFF_LOGIN_FAILED);
  });

  it("enforces 10 failures / 15 min throttle per username+IP", async () => {
    for (let i = 0; i < 10; i++) {
      const res = await authenticateStaff("admin", "wrongpass", {
        ip: "10.0.0.1",
        db: testDb,
      });
      assert.equal(res.success, false);
    }

    const res11 = await authenticateStaff("admin", "gereh-secret-pass", {
      ip: "10.0.0.1",
      db: testDb,
    });
    assert.equal(res11.success, false);
    assert.equal(res11.error, AUTH_ERRORS.IP_LOCK);
  });
});

describe("Customer addresses", () => {
  let testDb: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    testDb = createTestDb();
    testDb.insert(schema.customers).values({ id: 1, phone: "09123456789" }).run();
  });

  it("rejects addresses shorter than 12 characters", async () => {
    const res = await createCustomerAddress(1, {
      label: "خانه",
      recipientName: "مریم",
      text: "کوتاه است",
    }, { db: testDb });

    assert.equal(res.success, false);
    assert.equal(res.error, AUTH_ERRORS.ADDRESS_TOO_SHORT);
  });

  it("creates address and lists it", async () => {
    const res = await createCustomerAddress(1, {
      label: "خانه",
      recipientName: "مریم سعیدی",
      text: "تهران، میدان انقلاب، خیابان کارگر شمالی، پلاک ۱۲",
      postalCode: "1234567890",
    }, { db: testDb });

    assert.equal(res.success, true);
    assert.equal(res.address.label, "خانه");

    const list = await getCustomerAddresses(1, { db: testDb });
    assert.equal(list.length, 1);
    assert.equal(list[0].recipientName, "مریم سعیدی");
  });

  it("caps address book at 5 addresses per customer", async () => {
    for (let i = 1; i <= 5; i++) {
      const res = await createCustomerAddress(1, {
        label: `آدرس ${i}`,
        recipientName: "مریم سعیدی",
        text: `تهران، خیابان ولیعصر، کوچه شماره ${i}، پلاک ۱۰`,
      }, { db: testDb });
      assert.equal(res.success, true);
    }

    const res6 = await createCustomerAddress(1, {
      label: "آدرس ششم",
      recipientName: "مریم سعیدی",
      text: "تهران، خیابان ولیعصر، کوچه شماره ۶، پلاک ۱۰",
    }, { db: testDb });

    assert.equal(res6.success, false);
    assert.equal(res6.error, AUTH_ERRORS.MAX_ADDRESSES_REACHED);
  });

  it("deletes address scoped to customer", async () => {
    const res = await createCustomerAddress(1, {
      label: "خانه",
      recipientName: "مریم سعیدی",
      text: "تهران، خیابان ولیعصر، کوچه شماره ۱، پلاک ۱۰",
    }, { db: testDb });
    assert.equal(res.success, true);

    const deleted = await deleteCustomerAddress(1, res.address.id, { db: testDb });
    assert.equal(deleted, true);

    const list = await getCustomerAddresses(1, { db: testDb });
    assert.equal(list.length, 0);
  });
});
