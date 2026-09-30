import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyGatewayPayment } from "@/lib/zarinpal";

/**
 * ZarinPal Payment Return Callback (SPEC §5)
 * GET /checkout/callback?Authority=...&Status=...
 * - Verifies Authority + Status server-side against DB-stored amount (never querystring)
 * - Code 100 settles, 101 = already settled (idempotent - double-verify is never failure)
 * - Flips awaiting-payment -> paid through transition helper (stock decrements there)
 * - Redirects to /order/[code]
 * - Nobody links here manually
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const authority =
    searchParams.get("Authority") || searchParams.get("authority");
  const status = searchParams.get("Status") || searchParams.get("status");

  // Missing parameters: nobody links here manually, redirect to cart
  if (!authority || !status) {
    return NextResponse.redirect(new URL("/cart", request.url));
  }

  const result = await verifyGatewayPayment(authority, status);

  if (result.orderCode) {
    const targetUrl = new URL(`/order/${result.orderCode}`, request.url);
    if (!result.success) {
      targetUrl.searchParams.set("payment", "failed");
    }
    return NextResponse.redirect(targetUrl);
  }

  // If authority not recognized in database
  return NextResponse.redirect(new URL("/cart", request.url));
}
