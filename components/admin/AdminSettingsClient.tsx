"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminSettingsData,
  AdminContactChannelInput,
} from "@/lib/admin/settings";
import { saveAdminSettingsAction } from "@/app/admin/settings/actions";
import { formatTomanDigits } from "@/lib/format";

export type AdminSettingsClientProps = {
  initialSettings: AdminSettingsData;
};

export function AdminSettingsClient({
  initialSettings,
}: AdminSettingsClientProps) {
  const router = useRouter();

  // Shipping
  const [shippingFlatToman, setShippingFlatToman] = useState<number | string>(
    initialSettings.shippingFlatToman
  );
  const [shippingFreeFromToman, setShippingFreeFromToman] = useState<
    number | string
  >(initialSettings.shippingFreeFromToman);

  // Promo code (one active code)
  const [hasPromo, setHasPromo] = useState(Boolean(initialSettings.promo));
  const [promoCode, setPromoCode] = useState(
    initialSettings.promo?.code ?? "GEREH10"
  );
  const [promoPercent, setPromoPercent] = useState<number | string>(
    initialSettings.promo?.percent ?? 10
  );
  const [promoEnabled, setPromoEnabled] = useState(
    initialSettings.promo?.enabled ?? true
  );

  // Contact Channels
  const [channels, setChannels] = useState<AdminContactChannelInput[]>(
    initialSettings.channels.map((c) => ({
      id: c.id,
      type: c.type as "phone" | "whatsapp" | "telegram" | "instagram",
      label: c.label,
      value: c.value,
      enabled: Boolean(c.enabled),
      sort: c.sort,
    }))
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddChannel = () => {
    setChannels((prev) => [
      ...prev,
      {
        type: "phone",
        label: "",
        value: "",
        enabled: true,
        sort: prev.length + 1,
      },
    ]);
  };

  const handleUpdateChannel = (
    index: number,
    field: keyof AdminContactChannelInput,
    val: string | number | boolean
  ) => {
    setChannels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleRemoveChannel = (index: number) => {
    setChannels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    const flat = Number(shippingFlatToman);
    const freeFrom = Number(shippingFreeFromToman);

    if (isNaN(flat) || flat < 0) {
      setErrorMsg("هزینه ارسال باید یک عدد معتبر باشد.");
      setSaving(false);
      return;
    }

    if (isNaN(freeFrom) || freeFrom < 0) {
      setErrorMsg("سقف ارسال رایگان باید یک عدد معتبر باشد.");
      setSaving(false);
      return;
    }

    let promoPayload = null;
    if (hasPromo) {
      if (!promoCode.trim()) {
        setErrorMsg("کد تخفیف نمی‌تواند خالی باشد.");
        setSaving(false);
        return;
      }
      const pct = Number(promoPercent);
      if (isNaN(pct) || pct < 1 || pct > 100) {
        setErrorMsg("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد.");
        setSaving(false);
        return;
      }
      promoPayload = {
        code: promoCode.trim().toUpperCase(),
        percent: pct,
        enabled: promoEnabled,
      };
    }

    // Validate channels
    for (const ch of channels) {
      if (!ch.label.trim() || !ch.value.trim()) {
        setErrorMsg("برچسب و مقدار تمام راه‌های ارتباطی باید پر شود.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await saveAdminSettingsAction({
        shippingFlatToman: flat,
        shippingFreeFromToman: freeFrom,
        promo: promoPayload,
        channels: channels.map((c, idx) => ({
          ...c,
          sort: idx + 1,
        })),
      });

      if (res.success) {
        setSuccessMsg("تمام تنظیمات و راه‌های ارتباطی با موفقیت ذخیره شدند.");
        router.refresh();
      } else {
        setErrorMsg(res.error || "خطا در ذخیره تنظیمات.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "خطای ناشناخته رخ داد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface p-4 rounded-xl border border-line sticky top-16 z-20 shadow-xs">
        <div>
          <h1 className="font-display text-2xl text-ink">تنظیمات فروشگاه</h1>
          <p className="text-xs text-ink-3 mt-1">
            تنظیمات کلی فروشگاه، هزینه ارسال، کد تخفیف فعال و راه‌های ارتباطی (ذخیره یکپارچه).
          </p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn--primary text-sm min-w-36 cursor-pointer"
        >
          {saving ? "در حال ذخیره…" : "ذخیره یکپارچه تنظیمات"}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Shipping Rules */}
        <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <div className="border-b border-line pb-2">
            <h2 className="font-bold text-ink text-base">
              هزینه و شرایط ارسال سفارش
            </h2>
            <p className="text-xs text-ink-3">
              محاسبه هزینه پست پیشتاز در سراسر کشور (بدون لیست استانی).
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              هزینه ارسال ثابت کشوری (تومان) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              value={shippingFlatToman}
              onChange={(e) => setShippingFlatToman(e.target.value)}
              placeholder="مثال: 90000"
              className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
              dir="ltr"
            />
            {shippingFlatToman ? (
              <span className="text-[11px] text-ink-3 mt-1 block">
                معادل: {formatTomanDigits(Number(shippingFlatToman))} تومان
              </span>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">
              آستانه خرید برای ارسال رایگان (تومان) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              value={shippingFreeFromToman}
              onChange={(e) => setShippingFreeFromToman(e.target.value)}
              placeholder="مثال: 300000"
              className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
              dir="ltr"
            />
            {shippingFreeFromToman ? (
              <span className="text-[11px] text-ink-3 mt-1 block">
                معادل: {formatTomanDigits(Number(shippingFreeFromToman))} تومان
              </span>
            ) : null}
          </div>
        </div>

        {/* Section 2: Promo Code (One active code max) */}
        <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-line pb-2">
            <div>
              <h2 className="font-bold text-ink text-base">
                کد تخفیف اختصاصی
              </h2>
              <p className="text-xs text-ink-3">
                طبق قوانین سیستم، حداکثر یک کد تخفیف فعال در هر زمان وجود دارد.
              </p>
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={hasPromo}
                onChange={(e) => setHasPromo(e.target.checked)}
                className="rounded border-line text-accent focus:ring-accent"
              />
              <span className="text-ink font-medium">فعال‌سازی سیستم تخفیف</span>
            </label>
          </div>

          {hasPromo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    کد تخفیف (حروف انگلیسی یا عدد) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required={hasPromo}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="GEREH10"
                    className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">
                    درصد تخفیف (۱ تا ۱۰۰) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required={hasPromo}
                    value={promoPercent}
                    onChange={(e) => setPromoPercent(e.target.value)}
                    placeholder="10"
                    className="w-full h-10 px-3 rounded-lg border border-line bg-bg text-ink text-sm font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={promoEnabled}
                    onChange={(e) => setPromoEnabled(e.target.checked)}
                    className="rounded border-line text-accent focus:ring-accent"
                  />
                  <span className="text-xs text-ink">
                    کد فعال است و در سبد خرید اعمال شود
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-3 py-6 text-center">
              در حال حاضر کد تخفیفی فعال نیست. مشتریان بدون کد تخفیف خرید خواهند کرد.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Contact Channels */}
      <div className="bg-surface rounded-xl border border-line p-5 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-line pb-2">
          <div>
            <h2 className="font-bold text-ink text-base">
              راه‌های ارتباطی کارگاه (Contact Channels)
            </h2>
            <p className="text-xs text-ink-3">
              مسیرهای پاسخگویی به مشتریان (تلفن، واتساپ، تلگرام، اینستاگرام)؛ ایمیل پشتیبانی نمی‌شود.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddChannel}
            className="btn btn--outline btn--sm text-xs cursor-pointer"
          >
            + افزودن راه ارتباطی
          </button>
        </div>

        {channels.length === 0 ? (
          <p className="text-xs text-ink-3 py-6 text-center">
            هیچ راه ارتباطی ثبت نشده است.
          </p>
        ) : (
          <div className="space-y-3">
            {channels.map((ch, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center gap-3 p-3.5 bg-bg rounded-lg border border-line"
              >
                {/* Type select */}
                <div className="w-full sm:w-36">
                  <label className="block text-[11px] text-ink-3 mb-1">نوع کانال</label>
                  <select
                    value={ch.type}
                    onChange={(e) =>
                      handleUpdateChannel(idx, "type", e.target.value)
                    }
                    className="w-full h-9 px-2 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                  >
                    <option value="phone">تلفن / تماس</option>
                    <option value="whatsapp">واتساپ</option>
                    <option value="telegram">تلگرام</option>
                    <option value="instagram">اینستاگرام</option>
                  </select>
                </div>

                {/* Display Label */}
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] text-ink-3 mb-1">
                    برچسب نمایشی به مشتری
                  </label>
                  <input
                    type="text"
                    required
                    value={ch.label}
                    onChange={(e) =>
                      handleUpdateChannel(idx, "label", e.target.value)
                    }
                    placeholder="مثال: تماس مستقیم با کارگاه"
                    className="w-full h-9 px-3 rounded border border-line bg-surface text-ink text-xs focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Value / Link */}
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] text-ink-3 mb-1">
                    شماره یا آیدی
                  </label>
                  <input
                    type="text"
                    required
                    value={ch.value}
                    onChange={(e) =>
                      handleUpdateChannel(idx, "value", e.target.value)
                    }
                    placeholder="مثال: 09121112233 یا @gereh_macrame"
                    className="w-full h-9 px-3 rounded border border-line bg-surface text-ink text-xs font-mono focus:outline-none focus:border-accent"
                    dir="ltr"
                  />
                </div>

                {/* Enabled Toggle */}
                <div className="pt-3 sm:pt-4 flex items-center gap-1.5 shrink-0">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={ch.enabled}
                      onChange={(e) =>
                        handleUpdateChannel(idx, "enabled", e.target.checked)
                      }
                      className="rounded border-line text-accent focus:ring-accent"
                    />
                    <span className="text-ink-2 text-xs">فعال</span>
                  </label>
                </div>

                {/* Remove button */}
                <div className="pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveChannel(idx)}
                    className="text-xs text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                    title="حذف"
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
