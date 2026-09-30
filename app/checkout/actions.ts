"use server";

import { headers } from "next/headers";
import { getCurrentUser, setSessionCookie } from "@/lib/auth/server";
import { requestOtp, verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { createCustomerAddress, getCustomerAddresses } from "@/lib/auth/address";
import { createOrder, type OrderCreationItem } from "@/lib/orders/create";
import { initiateGatewayPayment } from "@/lib/zarinpal";
import type { PaymentPath } from "@/db/schema";
import { AUTH_CONFIG } from "@/lib/auth/config";

/**
 * Sends OTP from checkout step 1
 */
export async function checkoutRequestOtpAction(phone: string) {
  const reqHeaders = await headers();
  const ip =
    reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    reqHeaders.get("x-real-ip") ||
    "127.0.0.1";

  return requestOtp(phone, { ip });
}

/**
 * Verifies OTP from checkout step 1 and establishes customer session
 */
export async function checkoutVerifyOtpAction(phone: string, code: string) {
  const verifyResult = await verifyOtp(phone, code);
  if (!verifyResult.success) {
    return verifyResult;
  }

  // Create session
  const { token } = await createSession("customer", verifyResult.customer.id);
  await setSessionCookie(token);

  const addresses = await getCustomerAddresses(verifyResult.customer.id);

  return {
    success: true as const,
    customer: verifyResult.customer,
    addresses,
  };
}

export type CheckoutOrderSubmitInput = {
  recipientName: string;
  addressText: string;
  postalCode?: string | null;
  saveToAddressBook?: boolean;
  addressLabel?: string;
  items: OrderCreationItem[];
  promoCode?: string | null;
  paymentPath: PaymentPath;
  note?: string | null;
};

/**
 * Submits the checkout form to create an order
 */
export async function createOrderFromCheckoutAction(input: CheckoutOrderSubmitInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.type !== "customer") {
    return { success: false, error: "لطفاً ابتدا وارد حساب کاربری خود شوید." };
  }

  const customerId = currentUser.customer.id;

  // 1. Create order
  const orderResult = await createOrder({
    customerId,
    recipientName: input.recipientName,
    addressText: input.addressText,
    postalCode: input.postalCode,
    items: input.items,
    promoCode: input.promoCode,
    paymentPath: input.paymentPath,
    note: input.note,
  });

  if (!orderResult.success) {
    return orderResult;
  }

  // 2. Optionally save to address book if requested or if customer has fewer than 5 addresses
  if (input.saveToAddressBook) {
    try {
      const existing = await getCustomerAddresses(customerId);
      if (existing.length < AUTH_CONFIG.MAX_ADDRESSES_PER_CUSTOMER) {
        // Check if identical address already saved
        const alreadyExists = existing.some(
          (a) => a.text.trim() === input.addressText.trim()
        );
        if (!alreadyExists) {
          await createCustomerAddress(customerId, {
            label: input.addressLabel?.trim() || "آدرس تحویل",
            recipientName: input.recipientName,
            text: input.addressText,
            postalCode: input.postalCode || undefined,
          });
        }
      }
    } catch {
      // Non-fatal if saving to address book fails
    }
  }

  // 3. If online payment (ZarinPal gateway), initiate transaction for immediate redirect
  if (input.paymentPath === "gateway") {
    try {
      const gatewayRes = await initiateGatewayPayment(orderResult.order.id);
      if (gatewayRes.success && gatewayRes.redirectUrl) {
        return {
          success: true as const,
          orderCode: orderResult.orderCode,
          paymentRedirectUrl: gatewayRes.redirectUrl,
        };
      }
    } catch {
      // Non-fatal: if gateway fails to initiate, order still created in awaiting-payment,
      // customer will land on /order/[code] where they can retry or use card-to-card.
    }
  }

  return {
    success: true as const,
    orderCode: orderResult.orderCode,
  };
}
