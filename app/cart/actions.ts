"use server";

import { getCartSettings } from "@/lib/storefront";
import { validatePromo, type PromoValidationResult } from "@/lib/promo";

/**
 * Server action to validate a promo code against live DB settings
 */
export async function validatePromoAction(code: string): Promise<PromoValidationResult> {
  const settings = getCartSettings();
  return validatePromo(code, settings.promo);
}
