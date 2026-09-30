import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_CONFIG } from "@/lib/auth/config";
import { getSession } from "@/lib/auth/session";

/**
 * Route guards for Gereh (SPEC §1, §4).
 * Runs on Node.js runtime via proxy.ts.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const token = request.cookies.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
  const currentUser = await getSession(token);

  // 1. Staff login route (/admin/login)
  if (pathname === "/admin/login") {
    if (currentUser?.type === "staff") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // 2. Staff protected routes (/admin/*)
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!currentUser || currentUser.type !== "staff") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // 3. Customer login route (/login)
  if (pathname === "/login") {
    if (currentUser?.type === "customer") {
      const next = searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : "/account";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 4. Customer account routes (/account, /account/*)
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    if (!currentUser) {
      const loginUrl = new URL("/login", request.url);
      const returnPath = pathname + (request.nextUrl.search || "");
      loginUrl.searchParams.set("next", returnPath);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/account",
    "/account/:path*",
    "/login",
  ],
};
