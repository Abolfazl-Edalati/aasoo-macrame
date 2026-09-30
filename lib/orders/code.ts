import crypto from "node:crypto";

/**
 * 6-character random confusable-free order code generator (SPEC §3, §5, Issue #17).
 * Excludes confusable characters: 0, O, 1, I.
 * Base32 Crockford uppercase subset: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (32 characters).
 */
export const ORDER_CODE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
export const ORDER_CODE_LENGTH = 6;
export const ORDER_CODE_REGEX = /^[2-9A-HJ-NP-Z]{6}$/;

/**
 * Generates a random 6-character confusable-free order code.
 * Never derived from internal ID.
 */
export function generateOrderCode(): string {
  const bytes = crypto.randomBytes(ORDER_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < ORDER_CODE_LENGTH; i++) {
    code += ORDER_CODE_CHARSET[bytes[i] % ORDER_CODE_CHARSET.length];
  }
  return code;
}

/**
 * Validates whether a given string is a valid 6-char confusable-free order code.
 */
export function isValidOrderCode(code: string): boolean {
  if (typeof code !== "string" || code.length !== ORDER_CODE_LENGTH) {
    return false;
  }
  return ORDER_CODE_REGEX.test(code.toUpperCase());
}
