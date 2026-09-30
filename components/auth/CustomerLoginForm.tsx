"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOtpAction, verifyOtpAction } from "@/app/login/actions";
import { validateIranianPhone } from "@/lib/phone";
import { toFa } from "@/lib/format";
import type { ContactChannelItem } from "@/lib/storefront";

interface CustomerLoginFormProps {
  nextUrl?: string;
  contactChannels: ContactChannelItem[];
}

export function CustomerLoginForm({
  nextUrl,
  contactChannels,
}: CustomerLoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [canonicalPhone, setCanonicalPhone] = useState("");
  const [code, setCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [hourlyLockCountdown, setHourlyLockCountdown] = useState(0);
  const [isDailyLock, setIsDailyLock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 60-second resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Hourly lock countdown timer
  useEffect(() => {
    if (hourlyLockCountdown <= 0) return;
    const interval = setInterval(() => {
      setHourlyLockCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [hourlyLockCountdown]);

  function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setError(null);
    setIsDailyLock(false);

    const validation = validateIranianPhone(phone);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    startTransition(async () => {
      const res = await requestOtpAction(validation.phone);
      if (res.success) {
        setCanonicalPhone(validation.phone);
        setStep("code");
        setCountdown(res.cooldownSeconds);
        setError(null);
      } else {
        setError(res.error);
        if (res.isDailyLock) {
          setIsDailyLock(true);
        }
        if (res.unlockInSeconds) {
          setHourlyLockCountdown(res.unlockInSeconds);
        }
        if (res.waitSeconds) {
          setCountdown(res.waitSeconds);
        }
      }
    });
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError("کد تأیید ۶ رقمی را وارد کنید.");
      return;
    }

    startTransition(async () => {
      const res = await verifyOtpAction(canonicalPhone, trimmedCode);
      if (res.success) {
        const target =
          nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
            ? nextUrl
            : "/account";
        router.push(target);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="card p-6 sm:p-8 max-w-md mx-auto bg-surface border border-line rounded-2xl shadow-[var(--shadow-2)]">
      <div className="text-center mb-6">
        <h1 className="font-display text-2xl mb-2 text-ink">ورود به حساب کاربری</h1>
        <p className="text-sm text-ink-2 leading-relaxed">
          {step === "phone"
            ? "برای ورود یا ساخت حساب، شماره موبایل خود را وارد کنید."
            : `کد ۶ رقمی پیامک‌شده به شماره ${canonicalPhone} را وارد کنید.`}
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm leading-relaxed"
        >
          <p className="font-semibold">{error}</p>

          {/* Countdown display for hourly lock */}
          {hourlyLockCountdown > 0 && (
            <p className="mt-2 text-xs">
              زمان باقی‌مانده تا رفع محدودیت:{" "}
              <span className="font-mono font-bold">
                {toFa(Math.floor(hourlyLockCountdown / 60))}:
                {toFa(
                  String(hourlyLockCountdown % 60).padStart(2, "0")
                )}
              </span>
            </p>
          )}

          {/* Inline contact channels for daily lock (SPEC §4) */}
          {isDailyLock && contactChannels.length > 0 && (
            <div className="mt-4 pt-3 border-t border-error/20">
              <p className="text-xs font-semibold mb-2 text-ink">
                راه‌های ارتباط با کارگاه گِرِه:
              </p>
              <div className="flex flex-wrap gap-2">
                {contactChannels.map((ch) => (
                  <a
                    key={ch.id}
                    href={ch.type === "phone" ? `tel:${ch.value}` : ch.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-xs font-medium text-ink hover:text-accent transition-colors"
                  >
                    <span>{ch.label}</span>
                    <span dir="ltr" className="text-muted">
                      {ch.value}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="phone-input"
              className="block text-sm font-semibold text-ink mb-1.5"
            >
              شماره موبایل
            </label>
            <input
              id="phone-input"
              type="tel"
              dir="ltr"
              autoComplete="tel"
              placeholder="۰۹۱۲۳۴۵۶۷۸۹"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-left placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-1)] cursor-pointer"
          >
            {isPending ? "در حال ارسال..." : "دریافت کد تأیید"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="otp-input"
                className="text-sm font-semibold text-ink"
              >
                کد تأیید ۶ رقمی
              </label>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setCode("");
                  setError(null);
                }}
                className="text-xs text-accent hover:underline cursor-pointer"
              >
                ویرایش شماره
              </button>
            </div>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              dir="ltr"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink text-center tracking-[0.5em] text-xl font-mono placeholder:tracking-normal placeholder:text-muted focus:border-accent focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 px-4 rounded-xl bg-accent text-white font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-1)] cursor-pointer"
          >
            {isPending ? "در حال بررسی..." : "تأیید و ورود"}
          </button>

          <div className="text-center pt-2">
            {countdown > 0 ? (
              <span className="text-xs text-muted">
                ارسال مجدد کد تا{" "}
                <span className="font-mono font-medium text-ink">
                  {toFa(countdown)}
                </span>{" "}
                ثانیه دیگر
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={isPending}
                className="text-xs font-semibold text-accent hover:underline cursor-pointer disabled:opacity-50"
              >
                ارسال مجدد کد پیامکی
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
