/**
 * Auth configuration constants and verbatim Persian error copy (SPEC §4, Issue #4).
 */

export const AUTH_CONFIG = {
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 120, // 2 minutes
  OTP_MAX_ATTEMPTS: 5, // max 5 verify attempts per code
  OTP_RESEND_COOLDOWN_SECONDS: 60, // 60s cooldown
  OTP_PHONE_HOURLY_LIMIT: 5,
  OTP_PHONE_DAILY_LIMIT: 10,
  OTP_IP_HOURLY_LIMIT: 20,
  OTP_PHONE_HOURLY_COOLDOWN_SECONDS: 3600, // 1 hour
  OTP_PHONE_DAILY_COOLDOWN_SECONDS: 86400, // 24 hours
  STAFF_MAX_FAILURES_WINDOW_SECONDS: 900, // 15 minutes
  STAFF_MAX_FAILURES_LIMIT: 10,
  SESSION_TTL_SECONDS: 30 * 24 * 3600, // 30 days absolute (no sliding)
  SESSION_COOKIE_NAME: "gereh_session",
  MAX_ADDRESSES_PER_CUSTOMER: 5,
  ADDRESS_MIN_LENGTH: 12,
} as const;

/**
 * Persian error copy lifted verbatim from Issue #4 resolution comment:
 * - Wrong code: کد وارد شده صحیح است؟ دوباره تلاش کنید. — after the 4th failure append با یک تلاش ناموفق دیگر، باید کد جدید بگیرید. ; attempt counts never shown before that.
 * - Expired/consumed code: زمان انقضای کد گذشته است. کد جدید بگیرید.
 * - Phone hourly lock: درخواستها برای این شماره بیش از حد مجاز است. یک ساعت دیگر دوباره تلاش کنید.
 * - Phone daily lock: برای این شماره امروز بیشتر از حد مجاز کد ارسال شده است. لطفاً از راههای تماس به ما پیام دهید.
 * - IP lock: تعداد درخواستها از این شبکه بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.
 * - Staff login failure: نام کاربری یا رمز عبور نادرست است. — generic, never says which field was wrong.
 */
export const AUTH_ERRORS = {
  WRONG_CODE: "کد وارد شده صحیح است؟ دوباره تلاش کنید.",
  WRONG_CODE_LAST_ATTEMPT:
    "کد وارد شده صحیح است؟ دوباره تلاش کنید. با یک تلاش ناموفق دیگر، باید کد جدید بگیرید.",
  CODE_EXPIRED_OR_CONSUMED: "زمان انقضای کد گذشته است. کد جدید بگیرید.",
  PHONE_HOURLY_LOCK:
    "درخواستها برای این شماره بیش از حد مجاز است. یک ساعت دیگر دوباره تلاش کنید.",
  PHONE_DAILY_LOCK:
    "برای این شماره امروز بیشتر از حد مجاز کد ارسال شده است. لطفاً از راههای تماس به ما پیام دهید.",
  IP_LOCK:
    "تعداد درخواستها از این شبکه بیش از حد مجاز است. لطفاً بعداً دوباره تلاش کنید.",
  STAFF_LOGIN_FAILED: "نام کاربری یا رمز عبور نادرست است.",
  MAX_ADDRESSES_REACHED: "حداکثر ۵ آدرس می‌توانید ثبت کنید.",
  ADDRESS_TOO_SHORT: "آدرس پستی باید حداقل ۱۲ نویسه باشد.",
} as const;
