"use client";

import { useState, useTransition } from "react";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { submitCustomOrderAction } from "@/app/contact/actions";
import { validateIranianPhone } from "@/lib/phone";
import { toFa } from "@/lib/format";

export type CollectionOption = {
  id: string;
  name: string;
};

export type ColorOption = {
  id: string;
  label: string;
  hex: string;
};

export function CustomOrderForm({
  collections,
  colors,
}: {
  collections: CollectionOption[];
  colors: ColorOption[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [isBulk, setIsBulk] = useState(false);
  const [dimensions, setDimensions] = useState("");
  const [deadline, setDeadline] = useState("عجله ندارم");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [wantsSample, setWantsSample] = useState(true);
  const [honeypot, setHoneypot] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleColor(colorId: string) {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  }

  function resetForm() {
    setName("");
    setPhone("");
    setCollectionId("");
    setIsBulk(false);
    setDimensions("");
    setDeadline("عجله ندارم");
    setSelectedColors([]);
    setDescription("");
    setWantsSample(true);
    setHoneypot("");
    setFieldErrors({});
    setGlobalError(null);
    setIsSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = "لطفاً نام و نام خانوادگی خود را وارد کنید (حداقل ۲ حرف).";
    }

    const phoneValidation = validateIranianPhone(phone);
    if (!phoneValidation.valid) {
      errors.phone = phoneValidation.error;
    }

    if (!description.trim()) {
      errors.description = "لطفاً مشخصات یا توضیح کار را وارد کنید.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGlobalError("چند مورد نیاز به اصلاح دارد. لطفاً خطاهای زیر را بررسی کنید.");
      return;
    }

    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await submitCustomOrderAction({
          name: name.trim(),
          phone: phoneValidation.valid ? phoneValidation.phone : phone.trim(),
          collectionId: collectionId.trim() || null,
          isBulk,
          deadline,
          dimensionsText: dimensions.trim() || null,
          colors: selectedColors,
          description: description.trim(),
          wantsSample,
          honeypot: honeypot.trim() || null,
        });

        if (result.success) {
          setIsSubmitted(true);
        } else {
          setGlobalError(result.error);
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
        }
      } catch {
        setGlobalError("خطایی در ارتباط با سرور رخ داد. لطفاً کمی بعد دوباره تلاش کنید.");
      }
    });
  }

  if (isSubmitted) {
    return (
      <div id="order-done" className="success-panel text-center py-8">
        <div className="success-ring mx-auto mb-4">
          <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        </div>
        <h2 style={{ fontSize: "var(--text-400)", margin: 0 }} className="font-display">
          درخواست شما ثبت شد
        </h2>
        <p className="ink2 leading-relaxed mx-auto my-3" style={{ maxWidth: "44ch" }}>
          کمتر از یک روز کاری — پیش‌فاکتور و نمونهٔ طرح را برایتان می‌فرستم. بعد از تأیید شما، بافت در نوبت قرار می‌گیرد.
        </p>
        <div
          className="od-row"
          style={{
            "--od-gap": "12px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "var(--spacing-6)",
          } as React.CSSProperties}
        >
          <button className="btn btn--outline" type="button" onClick={resetForm}>
            ثبت درخواست دیگر
          </button>
          <TransitionLink className="btn btn--quiet" href="/shop">
            دیدن کارهای آماده
          </TransitionLink>
        </div>
      </div>
    );
  }

  return (
    <form id="order-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot field for anti-spam bots (never stored in DB) */}
      <div style={{ display: "none" }} aria-hidden="true">
        <label htmlFor="b_hp_field">لطفاً این فیلد را خالی بگذارید</label>
        <input
          id="b_hp_field"
          type="text"
          name="b_hp_field"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {globalError && (
        <div className="summary-box mb-6" role="alert" tabIndex={-1}>
          <p className="font-semibold text-error mb-2">{globalError}</p>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="list-disc pr-5 text-sm space-y-1">
              {Object.entries(fieldErrors).map(([key, msg]) => (
                <li key={key}>
                  <a href={`#o-${key}`} className="underline text-error">
                    {msg}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Row 1: Name & Phone */}
      <div
        className="od-grid grid-2 grid-cols-1 md:grid-cols-2"
        style={{ "--od-gap": "24px" } as React.CSSProperties}
      >
        <div className={`field od-field ${fieldErrors.name ? "is-invalid" : ""}`}>
          <label htmlFor="o-name">
            نام <span className="req text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="o-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="نام و نام خانوادگی"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "err-o-name" : undefined}
          />
          {fieldErrors.name && (
            <span className="error text-error text-xs mt-1 block" id="err-o-name" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </div>

        <div className={`field od-field ${fieldErrors.phone ? "is-invalid" : ""}`}>
          <label htmlFor="o-phone">
            موبایل <span className="req text-accent" aria-hidden="true">*</span>
          </label>
          <input
            id="o-phone"
            name="phone"
            type="tel"
            dir="ltr"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="09123456789"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "err-o-phone" : undefined}
          />
          {fieldErrors.phone && (
            <span className="error text-error text-xs mt-1 block" id="err-o-phone" role="alert">
              {fieldErrors.phone}
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Collection & Bulk */}
      <div
        className="od-grid grid-2 grid-cols-1 md:grid-cols-2 mt-6"
        style={{ "--od-gap": "24px" } as React.CSSProperties}
      >
        <div className="field od-field">
          <label htmlFor="o-collection">
            نوع کار <span className="muted font-normal text-xs">(اختیاری)</span>
          </label>
          <select
            id="o-collection"
            name="collection"
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
          >
            <option value="">انتخاب نوع کار…</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field od-field">
          <span className="label">
            حجم سفارش <span className="muted font-normal text-xs">(اختیاری)</span>
          </span>
          <label className={`switch-card ${isBulk ? "is-active" : ""}`}>
            <span className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
              <b className="text-sm">سفارش عمده</b>
              <span className="muted text-xs">کافه، رستوران، هتل یا هدایای سازمانی</span>
            </span>
            <span className="switch shrink-0">
              <input
                id="o-bulk"
                name="isBulk"
                type="checkbox"
                role="switch"
                aria-checked={isBulk}
                checked={isBulk}
                onChange={(e) => setIsBulk(e.target.checked)}
              />
            </span>
          </label>
        </div>
      </div>

      {/* Row 3: Dimensions & Deadline */}
      <div
        className="od-grid grid-2 grid-cols-1 md:grid-cols-2 mt-6"
        style={{ "--od-gap": "24px" } as React.CSSProperties}
      >
        <div className="field od-field">
          <label htmlFor="o-dim">
            ابعاد دلخواه <span className="muted font-normal text-xs">(مثلاً ۸۰×۱۲۰)</span>
          </label>
          <input
            id="o-dim"
            name="dim"
            type="text"
            placeholder="قد × عرض به سانتی‌متر"
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value)}
            aria-describedby="dim-help"
          />
          <span className="help text-xs text-muted mt-1 block" id="dim-help">
            اگر قد دیوار را می‌دانید ولی اندازهٔ کار را نه، همان را بنویسید؛ خودم پیشنهاد می‌دهم.
          </span>
        </div>

        <div className="field od-field">
          <label htmlFor="o-deadline">مهلت تحویل</label>
          <select
            id="o-deadline"
            name="deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          >
            <option value="عجله ندارم">عجله ندارم</option>
            <option value="تا دو هفته">تا دو هفته</option>
            <option value="تا یک ماه">تا یک ماه</option>
            <option value="برای تاریخ مشخص (در توضیح می‌نویسم)">
              برای تاریخ مشخص (در توضیح می‌نویسم)
            </option>
          </select>
        </div>
      </div>

      {/* Row 4: Thread Colors */}
      <div className="od-stack mt-6" style={{ "--od-gap": "12px" } as React.CSSProperties}>
        <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
          <span className="font-semibold text-sm">
            رنگ نخ <span className="muted font-normal text-xs">(یکی یا چندتا)</span>
          </span>
          <div
            className="od-row flex-wrap gap-2"
            role="group"
            aria-label="گزینش رنگ نخ"
          >
            {colors.map((c) => {
              const isSelected = selectedColors.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleColor(c.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                    isSelected
                      ? "border-accent bg-accent/10 font-semibold text-ink shadow-sm"
                      : "border-line bg-surface hover:border-muted text-ink-2"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden="true"
                  />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 5: Description */}
      <div
        className={`field od-field mt-6 ${fieldErrors.description ? "is-invalid" : ""}`}
      >
        <label htmlFor="o-desc">
          توضیح کار <span className="req text-accent" aria-hidden="true">*</span>
        </label>
        <textarea
          id="o-desc"
          name="desc"
          required
          maxLength={600}
          rows={4}
          placeholder="کجا نصب می‌شود؟ چه حسّی از فضا می‌خواهید؟ عکس مرجع دارید؟ هرچه بیشتر بنویسید، پیش‌نمایش دقیق‌تر است."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-describedby="desc-count err-o-desc"
          aria-invalid={Boolean(fieldErrors.description)}
        />
        <div className="flex items-center justify-between mt-1 text-xs">
          {fieldErrors.description ? (
            <span className="error text-error" id="err-o-desc" role="alert">
              {fieldErrors.description}
            </span>
          ) : (
            <span className="text-muted">مشخصات فضا و ایده مدنظرتان</span>
          )}
          <span className="muted font-mono" id="desc-count" dir="rtl">
            {toFa(description.length)}/۶۰۰
          </span>
        </div>
      </div>

      {/* Row 6: Sample swatch switch */}
      <div className="mt-6">
        <label className={`switch-card ${wantsSample ? "is-active" : ""}`}>
          <span className="od-stack" style={{ "--od-gap": "2px" } as React.CSSProperties}>
            <b className="text-sm">نمونهٔ نخ می‌خواهم</b>
            <span className="muted text-xs">
              قبل از بافت، تیکهٔ نخِ رنگ انتخابی با پست برایتان می‌آید.
            </span>
          </span>
          <span className="switch shrink-0">
            <input
              id="o-sample"
              name="wantsSample"
              type="checkbox"
              role="switch"
              aria-checked={wantsSample}
              checked={wantsSample}
              onChange={(e) => setWantsSample(e.target.checked)}
            />
          </span>
        </label>
      </div>

      {/* Submit buttons */}
      <div
        className="od-row flex-wrap items-center mt-7 gap-4"
        style={{ "--od-gap": "16px" } as React.CSSProperties}
      >
        <button
          className="btn btn--primary btn--lg magnetic w-full sm:w-auto"
          type="submit"
          id="order-btn"
          disabled={isPending}
        >
          {isPending ? (
            <span>در حال ثبت…</span>
          ) : (
            <>
              <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12l6 6L20 6" />
              </svg>
              ارسال درخواست
            </>
          )}
        </button>
        <TransitionLink className="btn btn--quiet" href="/about#knots">
          اول گره‌ها را ببینم
        </TransitionLink>
      </div>
    </form>
  );
}
