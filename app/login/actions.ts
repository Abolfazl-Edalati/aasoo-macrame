"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/server";
import { AUTH_CONFIG } from "@/lib/auth/config";

export async function requestOtpAction(phone: string) {
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    null;

  return requestOtp(phone, { ip });
}

export async function verifyOtpAction(
  phone: string,
  code: string
): Promise<{ success: true } | { success: false; error: string }> {
  const result = await verifyOtp(phone, code);
  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Single active identity per browser: replace existing session
  const cookieStore = await cookies();
  const oldToken = cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;

  const { token } = await createSession("customer", result.customer.id, {
    oldToken,
  });

  await setSessionCookie(token);

  return { success: true };
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/");
}
