import crypto from "node:crypto";
import { eq, and, sql } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import { sessions, customers, staffUsers } from "@/db/schema";
import { AUTH_CONFIG } from "./config";

export type SessionSubjectType = "customer" | "staff";

export interface SessionData {
  id: number;
  tokenSha256: string;
  subjectType: SessionSubjectType;
  subjectId: number;
  expiresAt: number;
  createdAt: number;
}

export type CurrentUser =
  | {
      type: "customer";
      customer: {
        id: number;
        phone: string;
        name: string | null;
        createdAt: number;
      };
      session: SessionData;
    }
  | {
      type: "staff";
      staff: {
        id: number;
        username: string;
        displayName: string;
        createdAt: number;
      };
      session: SessionData;
    };

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const SESSION_COOKIE_OPTIONS = {
  name: AUTH_CONFIG.SESSION_COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: AUTH_CONFIG.SESSION_TTL_SECONDS,
};

/**
 * Creates a new session with an opaque 256-bit random token.
 * Token is stored SHA-256 hashed at rest with 30-day absolute expiry.
 * If an oldToken is provided, that previous session is destroyed (single active identity).
 */
export async function createSession(
  subjectType: SessionSubjectType,
  subjectId: number,
  options?: { oldToken?: string | null; db?: typeof defaultDb }
): Promise<{ token: string; expiresAt: number; session: SessionData }> {
  const dbClient = options?.db ?? defaultDb;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + AUTH_CONFIG.SESSION_TTL_SECONDS;

  // Single active identity per browser: invalidate old session if provided
  if (options?.oldToken) {
    const oldHash = hashSessionToken(options.oldToken);
    dbClient.delete(sessions).where(eq(sessions.tokenSha256, oldHash)).run();
  }

  // Generate 256-bit cryptographically secure random token (64 hex characters)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenSha256 = hashSessionToken(rawToken);

  const [session] = dbClient
    .insert(sessions)
    .values({
      tokenSha256,
      subjectType,
      subjectId,
      expiresAt,
      createdAt: now,
    })
    .returning()
    .all();

  return {
    token: rawToken,
    expiresAt,
    session,
  };
}

/**
 * Validates a raw session token and resolves the user identity (customer or staff).
 * Returns null if token is missing, invalid, or expired.
 */
export async function getSession(
  rawToken: string | undefined | null,
  options?: { db?: typeof defaultDb }
): Promise<CurrentUser | null> {
  if (!rawToken) return null;

  const dbClient = options?.db ?? defaultDb;
  const tokenSha256 = hashSessionToken(rawToken);
  const now = Math.floor(Date.now() / 1000);

  const sessionRow = dbClient
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenSha256, tokenSha256),
        sql`${sessions.expiresAt} > ${now}`
      )
    )
    .get();

  if (!sessionRow) return null;

  if (sessionRow.subjectType === "customer") {
    const customer = dbClient
      .select()
      .from(customers)
      .where(eq(customers.id, sessionRow.subjectId))
      .get();

    if (!customer) return null;

    return {
      type: "customer",
      customer,
      session: sessionRow,
    };
  }

  if (sessionRow.subjectType === "staff") {
    const staff = dbClient
      .select({
        id: staffUsers.id,
        username: staffUsers.username,
        displayName: staffUsers.displayName,
        createdAt: staffUsers.createdAt,
      })
      .from(staffUsers)
      .where(eq(staffUsers.id, sessionRow.subjectId))
      .get();

    if (!staff) return null;

    return {
      type: "staff",
      staff,
      session: sessionRow,
    };
  }

  return null;
}

/**
 * Destroys a session by deleting the row from the sessions table.
 */
export async function destroySession(
  rawToken: string | undefined | null,
  options?: { db?: typeof defaultDb }
): Promise<boolean> {
  if (!rawToken) return false;

  const dbClient = options?.db ?? defaultDb;
  const tokenSha256 = hashSessionToken(rawToken);

  const res = dbClient
    .delete(sessions)
    .where(eq(sessions.tokenSha256, tokenSha256))
    .run();

  return res.changes > 0;
}
