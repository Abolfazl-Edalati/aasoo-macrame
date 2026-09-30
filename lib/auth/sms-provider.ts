import { assertProductionBootGuard } from "./boot-guard";

export interface SendOtpParams {
  phone: string; // canonical 09xxxxxxxxx
  code: string;  // 6 digits
}

export interface SmsOtpResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsOtpProvider {
  name: string;
  sendOtp(params: SendOtpParams): Promise<SmsOtpResult>;
}

/**
 * Kavenegar verify/lookup provider (Primary).
 * Template: gereh-otp (body: "گِرِه | کد تأیید شما: %token")
 */
export class KavenegarProvider implements SmsOtpProvider {
  readonly name = "kavenegar";

  constructor(
    private readonly apiKey = process.env.KAVENEGAR_API_KEY,
    private readonly template = process.env.KAVENEGAR_TEMPLATE || "gereh-otp"
  ) {}

  async sendOtp({ phone, code }: SendOtpParams): Promise<SmsOtpResult> {
    if (!this.apiKey) {
      return { success: false, error: "Kavenegar API key not configured" };
    }

    try {
      const url = new URL(
        `https://api.kavenegar.com/v1/${encodeURIComponent(this.apiKey)}/verify/lookup.json`
      );
      url.searchParams.set("receptor", phone);
      url.searchParams.set("token", code);
      url.searchParams.set("template", this.template);

      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Kavenegar HTTP error: ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        return?: { status: number; message: string };
        entries?: Array<{ messageid: number }>;
      };

      if (data.return?.status === 200) {
        return {
          success: true,
          messageId: data.entries?.[0]?.messageid?.toString(),
        };
      }

      return {
        success: false,
        error: data.return?.message || "Kavenegar lookup failed",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/**
 * FarazSMS pattern API provider (Fallback).
 * Shared service line: 90008361 (no deposit, delivers to blacklisted SIMs).
 */
export class FarazSmsProvider implements SmsOtpProvider {
  readonly name = "farazsms";

  constructor(
    private readonly apiKey = process.env.FARAZSMS_API_KEY,
    private readonly patternCode = process.env.FARAZSMS_PATTERN_CODE || "gereh-otp",
    private readonly lineNumber = process.env.FARAZSMS_LINE_NUMBER || "90008361"
  ) {}

  async sendOtp({ phone, code }: SendOtpParams): Promise<SmsOtpResult> {
    if (!this.apiKey) {
      return { success: false, error: "FarazSMS API key not configured" };
    }

    try {
      const res = await fetch("https://api.iranpayamak.com/ws/v1/sms/pattern", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": this.apiKey,
        },
        body: JSON.stringify({
          code: this.patternCode,
          recipient: phone,
          attributes: { code },
          line_number: this.lineNumber,
          number_format: "english",
        }),
      });

      if (!res.ok) {
        return {
          success: false,
          error: `FarazSMS HTTP error: ${res.status}`,
        };
      }

      const data = (await res.json()) as {
        status?: string;
        data?: { id?: number };
        message?: string;
      };

      if (res.status === 200 || res.status === 201 || data.status === "success") {
        return {
          success: true,
          messageId: data.data?.id?.toString(),
        };
      }

      return {
        success: false,
        error: data.message || "FarazSMS pattern send failed",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

/**
 * Console/Dev provider:
 * Server log only. The code is NEVER returned in an API response.
 */
export class ConsoleSmsProvider implements SmsOtpProvider {
  readonly name = "console";

  async sendOtp({ phone, code }: SendOtpParams): Promise<SmsOtpResult> {
    console.log(`[SMS-DEV] OTP code for ${phone}: ${code}`);
    return { success: true };
  }
}

/**
 * Composite provider:
 * In development / SMS_SEND=false: logs server-side only.
 * In production or SMS_SEND=true: runs Kavenegar primary with FarazSMS fallback.
 */
export class CompositeSmsOtpProvider implements SmsOtpProvider {
  readonly name = "composite";

  constructor(
    private readonly primary = new KavenegarProvider(),
    private readonly fallback = new FarazSmsProvider(),
    private readonly dev = new ConsoleSmsProvider()
  ) {}

  async sendOtp(params: SendOtpParams): Promise<SmsOtpResult> {
    assertProductionBootGuard();

    const smsSend = process.env.SMS_SEND === "true";
    if (!smsSend) {
      return this.dev.sendOtp(params);
    }

    // Try primary (Kavenegar)
    const primaryRes = await this.primary.sendOtp(params);
    if (primaryRes.success) {
      return primaryRes;
    }

    console.warn(`[SMS] Primary provider failed: ${primaryRes.error}. Attempting fallback...`);

    // Try fallback (FarazSMS)
    const fallbackRes = await this.fallback.sendOtp(params);
    if (fallbackRes.success) {
      return fallbackRes;
    }

    console.error(`[SMS] Both providers failed. Primary: ${primaryRes.error}, Fallback: ${fallbackRes.error}`);
    return {
      success: false,
      error: "ارسال پیامک با خطا مواجه شد. لطفاً کمی بعد دوباره تلاش کنید.",
    };
  }
}

let activeProvider: SmsOtpProvider | null = null;

export function getSmsProvider(): SmsOtpProvider {
  if (!activeProvider) {
    activeProvider = new CompositeSmsOtpProvider();
  }
  return activeProvider;
}

export function setSmsProvider(provider: SmsOtpProvider | null): void {
  activeProvider = provider;
}
