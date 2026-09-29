export type PromoConfig = {
  code: string;
  percent: number;
  enabled: boolean;
};

export type PromoValidationResult =
  | { valid: true; code: string; percent: number }
  | { valid: false; error: string };

/**
 * Validates a promo code string against the active promo configuration from settings.
 * Returns either `{ valid: true, code, percent }` or `{ valid: false, error: string }`.
 */
export function validatePromo(
  rawCode: string | null | undefined,
  activePromo: PromoConfig | null | undefined
): PromoValidationResult {
  const code = (rawCode ?? "").trim();
  if (!code) {
    return { valid: false, error: "کد تخفیف را وارد کنید." };
  }

  const normalizedInput = code.toUpperCase();

  if (!activePromo) {
    return {
      valid: false,
      error: `کد «${code}» معتبر نیست.`,
    };
  }

  const normalizedPromoCode = activePromo.code.trim().toUpperCase();

  if (normalizedInput !== normalizedPromoCode) {
    return {
      valid: false,
      error: `کد «${code}» معتبر نیست.`,
    };
  }

  if (!activePromo.enabled) {
    return {
      valid: false,
      error: "این کد تخفیف منقضی یا غیرفعال شده است.",
    };
  }

  return {
    valid: true,
    code: activePromo.code,
    percent: activePromo.percent,
  };
}
