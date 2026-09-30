import { verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { staffUsers } from "@/db/schema";
import { AUTH_CONFIG, AUTH_ERRORS } from "./config";
import { createSession } from "./session";

// In-memory sliding window for staff login attempts (15 min window)
// Map key: `${username.toLowerCase()}:${ip ?? "unknown"}` -> timestamps in seconds
const staffFailedAttempts = new Map<string, number[]>();

export function getStaffThrottleKey(username: string, ip?: string | null): string {
  return `${username.trim().toLowerCase()}:${ip?.trim() || "unknown"}`;
}

export function resetStaffThrottles(): void {
  staffFailedAttempts.clear();
}

export interface StaffLoginResult {
  success: boolean;
  error?: string;
  token?: string;
  staffUser?: {
    id: number;
    username: string;
    displayName: string;
  };
}

/**
 * Authenticates staff members with username and argon2id password.
 * Enforces:
 * - 10 failures / 15 min per username+IP
 * - Generic Persian error on credentials failure
 * - Single active identity per browser (replaces customer identity)
 */
export async function authenticateStaff(
  usernameRaw: string,
  passwordRaw: string,
  options?: {
    ip?: string | null;
    oldSessionToken?: string | null;
    db?: typeof defaultDb;
  }
): Promise<StaffLoginResult> {
  const dbClient = options?.db ?? defaultDb;
  const username = usernameRaw.trim();
  const password = passwordRaw;
  const now = Math.floor(Date.now() / 1000);
  const throttleKey = getStaffThrottleKey(username, options?.ip);

  // Clean old failure timestamps
  const windowStart = now - AUTH_CONFIG.STAFF_MAX_FAILURES_WINDOW_SECONDS;
  const attempts = (staffFailedAttempts.get(throttleKey) ?? []).filter(
    (t) => t > windowStart
  );
  staffFailedAttempts.set(throttleKey, attempts);

  // Check 10 failures / 15 min limit
  if (attempts.length >= AUTH_CONFIG.STAFF_MAX_FAILURES_LIMIT) {
    return {
      success: false,
      error: AUTH_ERRORS.IP_LOCK,
    };
  }

  // Look up staff user
  const user = dbClient
    .select()
    .from(staffUsers)
    .where(eq(staffUsers.username, username))
    .get();

  if (!user) {
    // Record failed attempt
    attempts.push(now);
    staffFailedAttempts.set(throttleKey, attempts);
    return {
      success: false,
      error: AUTH_ERRORS.STAFF_LOGIN_FAILED,
    };
  }

  // Verify argon2id hash
  let isValid = false;
  try {
    isValid = await verify(user.passwordHash, password);
  } catch {
    isValid = false;
  }

  if (!isValid) {
    // Record failed attempt
    attempts.push(now);
    staffFailedAttempts.set(throttleKey, attempts);
    return {
      success: false,
      error: AUTH_ERRORS.STAFF_LOGIN_FAILED,
    };
  }

  // Success: clear throttle history for this key
  staffFailedAttempts.delete(throttleKey);

  // Create staff session, replacing old customer/staff session if present
  const sessionRes = await createSession("staff", user.id, {
    oldToken: options?.oldSessionToken,
    db: dbClient,
  });

  return {
    success: true,
    token: sessionRes.token,
    staffUser: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    },
  };
}
