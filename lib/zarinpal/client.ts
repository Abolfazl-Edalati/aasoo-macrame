import { getZarinpalBaseUrl, getZarinpalMerchantId, getStartPayUrl } from "./config";

export interface ZarinpalPaymentRequestOptions {
  amountRial: number; // in RIAL (Toman * 10)
  description: string;
  callbackUrl: string;
  merchantId?: string;
  baseUrl?: string;
  mobile?: string;
  orderId?: number | string;
  fetchFn?: typeof fetch;
}

export interface ZarinpalPaymentRequestResult {
  success: boolean;
  code: number;
  message: string;
  authority?: string;
  startPayUrl?: string;
  fee?: number;
  errors?: unknown;
}

interface ZarinpalEnvelopeData {
  code?: number;
  message?: string;
  authority?: string | number;
  ref_id?: string | number;
  card_pan?: string;
  card_hash?: string;
  fee?: number;
  fee_type?: string;
  authorities?: Array<{
    authority: string;
    amount: number;
    channel?: string;
    date?: string;
  }>;
  status?: string;
}

interface ZarinpalEnvelopeErrors {
  code?: number;
  message?: string;
  validations?: unknown;
}

interface ZarinpalResponseEnvelope {
  data?: ZarinpalEnvelopeData;
  errors?: ZarinpalEnvelopeErrors;
}

function unpackEnvelope(
  json: unknown,
  defaultSuccessMessage: string,
  defaultErrorMessage: string
): {
  code: number;
  message: string;
  data?: ZarinpalEnvelopeData;
  errors?: ZarinpalEnvelopeErrors;
} {
  const env = json as ZarinpalResponseEnvelope | undefined;
  const code = env?.data?.code ?? env?.errors?.code ?? -1;
  const message =
    env?.data?.message ??
    env?.errors?.message ??
    (code === 100 || code === 101 ? defaultSuccessMessage : defaultErrorMessage);
  return { code, message, data: env?.data, errors: env?.errors };
}

/**
 * Requests a new payment authority from ZarinPal v4 REST API.
 * SPEC §5: POST /pg/v4/payment/request.json (merchant_id + amount + description + callback_url, no auth header)
 */
export async function requestZarinpalPayment(
  options: ZarinpalPaymentRequestOptions
): Promise<ZarinpalPaymentRequestResult> {
  const baseUrl = options.baseUrl || getZarinpalBaseUrl();
  const merchantId = options.merchantId || getZarinpalMerchantId();
  const fetchFn = options.fetchFn || fetch;

  const body: Record<string, unknown> = {
    merchant_id: merchantId,
    amount: options.amountRial,
    currency: "IRR",
    description: options.description,
    callback_url: options.callbackUrl,
  };

  if (options.mobile || options.orderId) {
    body.metadata = {
      ...(options.mobile ? { mobile: options.mobile } : {}),
      ...(options.orderId ? { order_id: String(options.orderId) } : {}),
    };
  }

  try {
    const res = await fetchFn(`${baseUrl}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    const { code, message, data, errors } = unpackEnvelope(
      json,
      "عملیات با موفقیت انجام شد.",
      "خطا در درخواست درگاه پرداخت."
    );

    if (code === 100 && data?.authority) {
      const authority = String(data.authority);
      return {
        success: true,
        code,
        message,
        authority,
        startPayUrl: getStartPayUrl(authority, baseUrl),
        fee: data.fee,
      };
    }

    return {
      success: false,
      code,
      message,
      errors,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطای ارتباط با درگاه پرداخت زرین‌پال.";
    return {
      success: false,
      code: -99,
      message,
    };
  }
}

export interface ZarinpalPaymentVerifyOptions {
  amountRial: number; // strictly from DB payments.amount_rial, never querystring
  authority: string;
  merchantId?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

export interface ZarinpalPaymentVerifyResult {
  success: boolean;
  code: number;
  message: string;
  refId?: string;
  cardPan?: string;
  cardHash?: string;
  fee?: number;
  errors?: unknown;
}

/**
 * Verifies a payment authority with ZarinPal v4 REST API.
 * SPEC §5: code 100 settles; 101 = already settled (idempotent - double-verify is never treated as failure).
 */
export async function verifyZarinpalPayment(
  options: ZarinpalPaymentVerifyOptions
): Promise<ZarinpalPaymentVerifyResult> {
  const baseUrl = options.baseUrl || getZarinpalBaseUrl();
  const merchantId = options.merchantId || getZarinpalMerchantId();
  const fetchFn = options.fetchFn || fetch;

  try {
    const res = await fetchFn(`${baseUrl}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        amount: options.amountRial,
        authority: options.authority,
      }),
    });

    const json = await res.json();
    const { code, message, data, errors } = unpackEnvelope(
      json,
      "پرداخت با موفقیت تأیید شد.",
      "خطا در تأیید پرداخت."
    );

    if ((code === 100 || code === 101) && data) {
      return {
        success: true,
        code,
        message,
        refId: data.ref_id != null ? String(data.ref_id) : undefined,
        cardPan: data.card_pan,
        cardHash: data.card_hash,
        fee: data.fee,
      };
    }

    return {
      success: false,
      code,
      message,
      errors,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "خطای ارتباط با سرور درگاه زرین‌پال.";
    return {
      success: false,
      code: -99,
      message,
    };
  }
}

export interface ZarinpalUnverifiedAuthority {
  authority: string;
  amount: number;
  channel?: string;
  date?: string;
}

export interface ZarinpalUnverifiedResult {
  success: boolean;
  code: number;
  message: string;
  authorities: ZarinpalUnverifiedAuthority[];
  errors?: unknown;
}

/**
 * Retrieves list of successful but unverified payments.
 * SPEC §5 & Issue #8: POST /pg/v4/payment/unVerified.json { merchant_id }
 */
export async function getUnverifiedZarinpalPayments(options?: {
  merchantId?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}): Promise<ZarinpalUnverifiedResult> {
  const baseUrl = options?.baseUrl || getZarinpalBaseUrl();
  const merchantId = options?.merchantId || getZarinpalMerchantId();
  const fetchFn = options?.fetchFn || fetch;

  try {
    const res = await fetchFn(`${baseUrl}/pg/v4/payment/unVerified.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
      }),
    });

    const json = await res.json();
    const { code, message, data, errors } = unpackEnvelope(
      json,
      "عملیات با موفقیت انجام شد.",
      "خطا در دریافت لیست تراکنش‌های تاییدنشده."
    );

    if (code === 100 && data) {
      const rawList = Array.isArray(data.authorities) ? data.authorities : [];
      const authorities: ZarinpalUnverifiedAuthority[] = rawList.map(
        (item: { authority?: unknown; amount?: unknown; channel?: unknown; date?: unknown }) => ({
          authority: String(item.authority),
          amount: Number(item.amount),
          channel: item.channel ? String(item.channel) : undefined,
          date: item.date ? String(item.date) : undefined,
        })
      );

      return {
        success: true,
        code,
        message,
        authorities,
      };
    }

    return {
      success: false,
      code,
      message,
      authorities: [],
      errors,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      code: -99,
      message: errorMsg || "خطای ارتباط با سرور درگاه زرین‌پال.",
      authorities: [],
    };
  }
}

export interface ZarinpalInquiryResult {
  success: boolean;
  code: number;
  status?: "VERIFIED" | "PAID" | "IN_BANK" | "FAILED" | "REVERSED" | string;
  message: string;
  errors?: unknown;
}

/**
 * Inquires the status of a payment authority without verifying it.
 * SPEC §5 & Issue #8: POST /pg/v4/payment/inquiry.json { merchant_id, authority }
 * Read-only status check: "از این متد به هیچ عنوان برای تایید و وریفای کردن تراکنش استفاده نکنید".
 */
export async function inquiryZarinpalPayment(options: {
  authority: string;
  merchantId?: string;
  baseUrl?: string;
  fetchFn?: typeof fetch;
}): Promise<ZarinpalInquiryResult> {
  const baseUrl = options.baseUrl || getZarinpalBaseUrl();
  const merchantId = options.merchantId || getZarinpalMerchantId();
  const fetchFn = options.fetchFn || fetch;

  try {
    const res = await fetchFn(`${baseUrl}/pg/v4/payment/inquiry.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        authority: options.authority,
      }),
    });

    const json = await res.json();
    const { code, message, data, errors } = unpackEnvelope(
      json,
      "عملیات با موفقیت انجام شد.",
      "خطا در استعلام وضعیت پرداخت."
    );

    if (code === 100 && data) {
      return {
        success: true,
        code,
        message,
        status: data.status,
      };
    }

    return {
      success: false,
      code,
      message,
      status: data?.status,
      errors,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      code: -99,
      message: errorMsg || "خطای ارتباط با سرور درگاه زرین‌پال.",
    };
  }
}
