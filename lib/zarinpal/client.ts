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

function unpackEnvelope(
  json: any,
  defaultSuccessMessage: string,
  defaultErrorMessage: string
): { code: number; message: string; data: any; errors: any } {
  const code = json?.data?.code ?? json?.errors?.code ?? -1;
  const message =
    json?.data?.message ??
    json?.errors?.message ??
    (code === 100 || code === 101 ? defaultSuccessMessage : defaultErrorMessage);
  return { code, message, data: json?.data, errors: json?.errors };
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
  } catch (err: any) {
    return {
      success: false,
      code: -99,
      message: err?.message || "خطای ارتباط با درگاه پرداخت زرین‌پال.",
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
  } catch (err: any) {
    return {
      success: false,
      code: -99,
      message: err?.message || "خطای ارتباط با سرور درگاه زرین‌پال.",
    };
  }
}
