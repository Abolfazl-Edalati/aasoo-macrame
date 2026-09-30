import crypto from "node:crypto";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { otpCodes, customers } from "@/db/schema";
import { validateIranianPhone } from "@/lib/phone";
import { AUTH_CONFIG, AUTH_ERRORS } from "./config";
import { getSmsProvider } from "./sms-provider";

export type RequestOtpResult =
  | {
      success: true;
      cooldownSeconds: number;
    }
  | {
      success: false;
      error: string;
      isDailyLock?: boolean;
      unlockInSeconds?: number;
      waitSeconds?: number;
    };

export type VerifyOtpResult =
  | {
      success: true;
      customer: {
        id: number;
        phone: string;
        name: string | null;
        createdAt: number;
      };
    }
  | {
      success: false;
      error: string;
      isExpiredOrConsumed?: boolean;
    };

export function hashOtpCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

/**
 * Request an SMS OTP code for an Iranian mobile number.
 * Enforces:
 * - Phone validation (09xxxxxxxxx canonical)
 * - 20 requests / hour per IP
 * - 10 requests / 24h per phone (daily cap)
 * - 5 requests / 1h per phone (hourly cap)
 * - 60s resend cooldown
 * - Invalidates any previous unconsumed codes for this phone (single active code)
 * - Code is NEVER returned to the client
 */
export async function requestOtp(
  rawPhone: string,
  options?: { ip?: string | null; db?: typeof defaultDb }
): Promise<RequestOtpResult> {
  const dbClient = options?.db ?? defaultDb;
  const ip = options?.ip ?? null;

  const phoneRes = validateIranianPhone(rawPhone);
  if (!phoneRes.valid) {
    return { success: false, error: phoneRes.error };
  }
  const phone = phoneRes.phone;
  const now = Math.floor(Date.now() / 1000);

  // 1. Check IP hourly limit (20/hour)
  if (ip) {
    const ipOneHourAgo = now - 3600;
    const ipRow = dbClient
      .select({ count: sql<number>`count(*)` })
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.ip, ip),
          sql`${otpCodes.createdAt} > ${ipOneHourAgo}`
        )
      )
      .get();

    if (Number(ipRow?.count ?? 0) >= AUTH_CONFIG.OTP_IP_HOURLY_LIMIT) {
      return { success: false, error: AUTH_ERRORS.IP_LOCK };
    }
  }

  // 2. Check Phone daily limit (10/day)
  const phone24hAgo = now - AUTH_CONFIG.OTP_PHONE_DAILY_COOLDOWN_SECONDS;
  const dailyRow = dbClient
    .select({ count: sql<number>`count(*)` })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        sql`${otpCodes.createdAt} > ${phone24hAgo}`
      )
    )
    .get();

  if (Number(dailyRow?.count ?? 0) >= AUTH_CONFIG.OTP_PHONE_DAILY_LIMIT) {
    return {
      success: false,
      error: AUTH_ERRORS.PHONE_DAILY_LOCK,
      isDailyLock: true,
    };
  }

  // 3. Check Phone hourly limit (5/hour)
  const phone1hAgo = now - AUTH_CONFIG.OTP_PHONE_HOURLY_COOLDOWN_SECONDS;
  const hourlyRows = dbClient
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        sql`${otpCodes.createdAt} > ${phone1hAgo}`
      )
    )
    .orderBy(asc(otpCodes.createdAt))
    .all();

  if (hourlyRows.length >= AUTH_CONFIG.OTP_PHONE_HOURLY_LIMIT) {
    const oldestInWindow = hourlyRows[0].createdAt;
    const unlockInSeconds = Math.max(1, 3600 - (now - oldestInWindow));
    return {
      success: false,
      error: AUTH_ERRORS.PHONE_HOURLY_LOCK,
      unlockInSeconds,
    };
  }

  // 4. Check 60s resend cooldown
  const latestRow = dbClient
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.phone, phone))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1)
    .get();

  if (latestRow && now - latestRow.createdAt < AUTH_CONFIG.OTP_RESEND_COOLDOWN_SECONDS) {
    const waitSeconds = AUTH_CONFIG.OTP_RESEND_COOLDOWN_SECONDS - (now - latestRow.createdAt);
    return {
      success: false,
      error: `لطفاً ${waitSeconds} ثانیه تا درخواست مجدد صبر کنید.`,
      waitSeconds,
    };
  }

  // Invalidate any existing unconsumed codes for this phone (one active code per phone)
  dbClient
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(
      and(
        eq(otpCodes.phone, phone),
        sql`${otpCodes.consumedAt} IS NULL`
      )
    )
    .run();

  // Generate 6-digit numeric code
  const codeNum = crypto.randomInt(100000, 1000000);
  const code = codeNum.toString();
  const codeSha256 = hashOtpCode(code);
  const expiresAt = now + AUTH_CONFIG.OTP_TTL_SECONDS;

  // Insert new OTP row
  dbClient
    .insert(otpCodes)
    .values({
      phone,
      codeSha256,
      attempts: 0,
      expiresAt,
      ip,
      createdAt: now,
    })
    .run();

  // Send via provider
  const sendRes = await getSmsProvider().sendOtp({ phone, code });
  if (!sendRes.success) {
    return {
      success: false,
      error: sendRes.error || "خطا در ارسال پیامک. لطفاً کمی بعد دوباره امتحان کنید.",
    };
  }

  return {
    success: true,
    cooldownSeconds: AUTH_CONFIG.OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verify an SMS OTP code.
 * Enforces:
 * - 2-minute TTL
 * - Max 5 attempts
 * - Single-use (consumed on verify or 5th failure)
 * - Attempts counts never shown before 4th failure
 * - Verbatim Persian error messages
 * - Implicit signup on first successful verification
 */
export async function verifyOtp(
  rawPhone: string,
  rawCode: string,
  options?: { db?: typeof defaultDb }
): Promise<VerifyOtpResult> {
  const dbClient = options?.db ?? defaultDb;

  const phoneRes = validateIranianPhone(rawPhone);
  if (!phoneRes.valid) {
    return { success: false, error: phoneRes.error };
  }
  const phone = phoneRes.phone;
  const now = Math.floor(Date.now() / 1000);

  // Normalize code input (trim, Persian/Arabic digits folded)
  let code = rawCode.trim();
  const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  for (let i = 0; i < 10; i++) {
    code = code.replaceAll(PERSIAN_DIGITS[i], String(i));
    code = code.replaceAll(ARABIC_DIGITS[i], String(i));
  }

  // Find latest active (unconsumed) OTP
  const row = dbClient
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, phone),
        sql`${otpCodes.consumedAt} IS NULL`
      )
    )
    .orderBy(desc(otpCodes.createdAt))
    .limit(1)
    .get();

  if (!row) {
    return {
      success: false,
      error: AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED,
      isExpiredOrConsumed: true,
    };
  }

  // Check TTL
  if (now > row.expiresAt) {
    dbClient
      .update(otpCodes)
      .set({ consumedAt: now })
      .where(eq(otpCodes.id, row.id))
      .run();
    return {
      success: false,
      error: AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED,
      isExpiredOrConsumed: true,
    };
  }

  // Check attempts cap
  if (row.attempts >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
    dbClient
      .update(otpCodes)
      .set({ consumedAt: now })
      .where(eq(otpCodes.id, row.id))
      .run();
    return {
      success: false,
      error: AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED,
      isExpiredOrConsumed: true,
    };
  }

  // Compare SHA-256 hash
  const inputHash = hashOtpCode(code);
  if (inputHash !== row.codeSha256) {
    const newAttempts = row.attempts + 1;

    if (newAttempts >= AUTH_CONFIG.OTP_MAX_ATTEMPTS) {
      dbClient
        .update(otpCodes)
        .set({ attempts: newAttempts, consumedAt: now })
        .where(eq(otpCodes.id, row.id))
        .run();
      return {
        success: false,
        error: AUTH_ERRORS.CODE_EXPIRED_OR_CONSUMED,
        isExpiredOrConsumed: true,
      };
    }

    dbClient
      .update(otpCodes)
      .set({ attempts: newAttempts })
      .where(eq(otpCodes.id, row.id))
      .run();

    if (newAttempts === 4) {
      return {
        success: false,
        error: AUTH_ERRORS.WRONG_CODE_LAST_ATTEMPT,
      };
    }

    return {
      success: false,
      error: AUTH_ERRORS.WRONG_CODE,
    };
  }

  // Code matches! Mark as consumed
  dbClient
    .update(otpCodes)
    .set({ consumedAt: now })
    .where(eq(otpCodes.id, row.id))
    .run();

  // Implicit signup: find or create customer
  let customer = dbClient
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .get();

  if (!customer) {
    const [created] = dbClient
      .insert(customers)
      .values({
        phone,
        createdAt: now,
      })
      .returning()
      .all();
    customer = created;
  }

  return {
    success: true,
    customer,
  };
}
