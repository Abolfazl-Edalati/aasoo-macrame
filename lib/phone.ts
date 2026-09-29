/**
 * Phone number normalization and validation for Iranian mobile numbers (SPEC §4).
 * Canonical format: 09xxxxxxxxx (11 digits, mobile-only).
 */

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Normalizes input:
 * - Persian and Arabic digits converted to Latin digits
 * - Strip whitespace, dashes, parentheses, plus
 * - Fold +98, 0098, 98, or leading 9 into 09...
 */
export function normalizeIranianPhone(raw: string): string {
  let cleaned = raw.trim();

  // Convert Persian digits
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(PERSIAN_DIGITS[i], String(i));
    cleaned = cleaned.replaceAll(ARABIC_DIGITS[i], String(i));
  }

  // Remove non-digit characters except leading plus if any
  cleaned = cleaned.replace(/[\s\-\(\)\.]+/g, "");

  if (cleaned.startsWith("+98")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("0098")) {
    cleaned = "0" + cleaned.slice(4);
  } else if (cleaned.startsWith("98") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }

  return cleaned;
}

export type PhoneValidationResult =
  | { valid: true; phone: string }
  | { valid: false; error: string };

/**
 * Validates normalized Iranian mobile phone number (^09\d{9}$).
 * Rejects landlines with specific Persian error message.
 */
export function validateIranianPhone(raw: string): PhoneValidationResult {
  const normalized = normalizeIranianPhone(raw);

  if (!normalized) {
    return { valid: false, error: "شماره موبایل را وارد کنید." };
  }

  if (normalized.startsWith("0") && !normalized.startsWith("09")) {
    return {
      valid: false,
      error: "شماره وارد شده تلفن ثابت است؛ لطفاً شماره موبایل با ۰۹ وارد کنید.",
    };
  }

  const mobileRegex = /^09\d{9}$/;
  if (!mobileRegex.test(normalized)) {
    return {
      valid: false,
      error: "شماره موبایل ۱۱ رقمی است و با ۰۹ شروع می‌شود.",
    };
  }

  return { valid: true, phone: normalized };
}
