"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateStaff } from "@/lib/auth/staff";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/server";
import { AUTH_CONFIG } from "@/lib/auth/config";

export async function staffLoginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    null;

  const cookieStore = await cookies();
  const oldSessionToken = cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;

  const res = await authenticateStaff(username, password, {
    ip,
    oldSessionToken,
  });

  if (!res.success) {
    return {
      success: false,
      error: res.error || "نام کاربری یا رمز عبور نادرست است.",
    };
  }

  if (res.token) {
    await setSessionCookie(res.token);
  }

  return { success: true };
}

export async function staffLogoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}
