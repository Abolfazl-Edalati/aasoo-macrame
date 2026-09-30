/**
 * ZarinPal Gateway Configuration (SPEC §5, ADR-0004)
 */

export const ZARINPAL_CONFIG = {
  PRODUCTION_BASE_URL: "https://payment.zarinpal.com",
  SANDBOX_BASE_URL: "https://sandbox.zarinpal.com",
  // In sandbox, any valid UUID works as merchant_id
  DEFAULT_SANDBOX_MERCHANT_ID: "00000000-0000-0000-0000-000000000000",
} as const;

/**
 * Returns the effective base URL for ZarinPal API and StartPay redirects.
 * Allows sandbox host swap via ZARINPAL_BASE_URL or ZARINPAL_SANDBOX.
 */
export function getZarinpalBaseUrl(): string {
  if (process.env.ZARINPAL_BASE_URL) {
    return process.env.ZARINPAL_BASE_URL.replace(/\/+$/, "");
  }
  if (process.env.ZARINPAL_SANDBOX === "true" || process.env.NODE_ENV !== "production") {
    return ZARINPAL_CONFIG.SANDBOX_BASE_URL;
  }
  return ZARINPAL_CONFIG.PRODUCTION_BASE_URL;
}

/**
 * Returns the merchant ID for ZarinPal.
 */
export function getZarinpalMerchantId(): string {
  return (
    process.env.ZARINPAL_MERCHANT_ID?.trim() ||
    ZARINPAL_CONFIG.DEFAULT_SANDBOX_MERCHANT_ID
  );
}

/**
 * Constructs the customer redirect URL to ZarinPal StartPay.
 */
export function getStartPayUrl(authority: string, baseUrl?: string): string {
  const base = baseUrl || getZarinpalBaseUrl();
  return `${base}/pg/StartPay/${authority}`;
}
