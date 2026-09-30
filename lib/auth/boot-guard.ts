/**
 * Boot guard for production environment (SPEC §4).
 * Refuses to start if SMS_SEND=false when NODE_ENV=production.
 */

export function assertProductionBootGuard(): void {
  const isProduction = process.env.NODE_ENV === "production";
  const smsSend = process.env.SMS_SEND;

  if (isProduction && smsSend === "false") {
    throw new Error(
      "Boot guard: SMS_SEND cannot be false in production (SPEC §4)."
    );
  }
}
