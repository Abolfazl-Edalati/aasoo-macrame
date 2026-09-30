import { cookies } from "next/headers";
import { AUTH_CONFIG } from "./config";
import { getSession, CurrentUser, SESSION_COOKIE_OPTIONS, destroySession } from "./session";

/**
 * Gets current authenticated user (customer or staff) from cookies in Server Components / Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
  return getSession(token);
}

/**
 * Sets session cookie on Next.js cookie store.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_OPTIONS.name, token, SESSION_COOKIE_OPTIONS);
}

/**
 * Clears session cookie and destroys DB session.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroySession(token);
  }
  cookieStore.delete(AUTH_CONFIG.SESSION_COOKIE_NAME);
}
