import type { Metadata } from "next";
import Image from "next/image";
import { getFeaturedProducts, getImageCredits } from "@/lib/storefront";
import { ProductCard } from "@/components/product/ProductCard";
import { Marquee } from "@/components/motion/Marquee";
import {
  DarkModeToggle,
  MotionKnotDemo,
  InteractiveStatesDemo,
} from "@/components/design-system/DesignSystemInteractive";

export const metadata: Metadata = {
  title: "دیزاین‌سیستم",
  description:
    "مستندات توکن‌ها، تایپوگرافی، فاصله، رنگ، مؤلفه‌ها، حالات و حرکت در فروشگاه گِرِه.",
};

export default function DesignSystemPage() {
  const sampleProducts = getFeaturedProducts(2);
  const credits = getImageCredits();

  return (
    <main id="main">
      <section className="section" style={{ paddingBlock: "var(--spacing-8)" }}>
        <div className="wrap" style={{ maxWidth: "900px" }}>
          <span className="eyebrow reveal">مستندات</span>
          <h1 className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
            دیزاین‌سیستم «گِرِه / بوتیک خاکی»
          </h1>
          <p
            className="lead ink2 reveal leading-relaxed"
            style={{ "--i": 2, maxWidth: "66ch" } as React.CSSProperties}
          >
            همه‌ی مقادیر این صفحه از متغیرها و توکن‌های طراحی خوانده می‌شوند؛ هیچ مقدار تکراری در صفحات
            وب‌سایت hard-code نشده. لایه‌ی ساختار با قوانین انعطاف‌پذیر و لایه‌ی توکن‌ها ظاهر را می‌سازد.
          </p>

          <nav
            className="od-cluster reveal flex-wrap gap-2 mt-5"
            style={{ "--i": 3 } as React.CSSProperties}
            aria-label="فهرست مستندات"
          >
            <a className="chip" href="#pal">پالت</a>
            <a className="chip" href="#type">تایپوگرافی</a>
            <a className="chip" href="#space">فاصله و گوشه</a>
            <a className="chip" href="#shadow">سایه و خط</a>
            <a className="chip" href="#comp">مؤلفه‌ها</a>
            <a className="chip" href="#states">حالات</a>
            <a className="chip" href="#motion">حرکت</a>
            <a className="chip" href="#icons">آیکون</a>
            <a className="chip" href="#media">رسانه</a>
            <a className="chip" href="#credits">منابع و پروانه‌ها</a>
          </nav>
        </div>
      </section>

      {/* 1 — PALETTE */}
      <section
        className="section--t transition-colors"
        id="pal"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap" id="palette-preview">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۱ — پالت رنگ (روشن / تیره)
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            کنتراست متن بدنه در هر دو حالت به‌طور مستقل سنجیده شده: ≥ 4.5:1 برای متن، ≥ 3:1 برای متن درشت و آیکون.
            رنگ «رسی» برای تعامل است و «سِیج» رنگ ساختاری دوم.
          </p>

          <div className="doc-grid mt-5">
            <div className="swatch-doc" style={{ "--v": "var(--color-bg)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-bg</b>
                <span className="muted font-mono text-xs" dir="ltr">#F4F3F0 / #191512</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-surface)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-surface</b>
                <span className="muted font-mono text-xs" dir="ltr">#FBFAF8 / #221D19</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-surface-alt)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-surface-alt</b>
                <span className="muted font-mono text-xs" dir="ltr">#EAE8E2 / #2C2621</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-ink)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-ink</b>
                <span className="muted font-mono text-xs" dir="ltr">#1B1714 / #F1EDE6</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-ink-2)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-ink-2</b>
                <span className="muted font-mono text-xs" dir="ltr">#4A423B / #CFC6BA</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-muted)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-muted</b>
                <span className="muted font-mono text-xs" dir="ltr">#6F665D / #A79C8E</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-accent)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-accent (رسی)</b>
                <span className="muted font-mono text-xs" dir="ltr">#A65A38 / #D98C62</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-accent-2)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-accent-2 (سِیج)</b>
                <span className="muted font-mono text-xs" dir="ltr">#6E7B5E / #96A683</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-line)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-line</b>
                <span className="muted font-mono text-xs" dir="ltr">#DAD5CC / #3A332C</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-success)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-success</b>
                <span className="muted font-mono text-xs" dir="ltr">#4F7146 / #8FB07E</span>
              </div>
            </div>
            <div className="swatch-doc" style={{ "--v": "var(--color-error)" } as React.CSSProperties}>
              <div className="fill" />
              <div className="meta">
                <b>--color-error</b>
                <span className="muted font-mono text-xs" dir="ltr">#9E3B2E / #E0705C</span>
              </div>
            </div>
          </div>

          <div className="od-stack mt-6" style={{ "--od-gap": "16px" } as React.CSSProperties}>
            <DarkModeToggle targetId="palette-preview" />
            <p className="muted text-xs">
              حالت تیره با <code dir="ltr">[data-inverse]</code> روی هر بخش (مانند بخش‌های تیره سایت) اعمال می‌شود — همان توکن‌ها با مقادیر متناسب وارونه.
            </p>
          </div>
        </div>
      </section>

      {/* 2 — TYPOGRAPHY */}
      <section
        className="section--t"
        id="type"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۲ — تایپوگرافی
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            نمایش: <b>Lalezar</b> — متن: <b>Vazirmatn</b> ۳۰۰ تا ۷۰۰؛ هر دو محلی. حداقل متن بدنه ۱۶ پیکسل، ارتفاع خط ۱.۷.
          </p>

          <div className="type-doc mt-5">
            <div className="od-row items-baseline flex-wrap gap-4">
              <span className="font-display text-5xl leading-none">گره</span>
              <span className="muted font-mono text-xs" dir="ltr">60px display — font-display</span>
            </div>
            <div className="od-row items-baseline flex-wrap gap-4">
              <span className="font-display text-2xl">تابلوی دیواری دیده ۸۰</span>
              <span className="muted font-mono text-xs" dir="ltr">32px h3 — font-display</span>
            </div>
            <div className="od-row items-baseline flex-wrap gap-4">
              <span className="text-lg">متن لید — مکرومه ریاضیِ طناب است</span>
              <span className="muted font-mono text-xs" dir="ltr">18px lead</span>
            </div>
            <div className="od-row items-baseline flex-wrap gap-4">
              <span className="text-base leading-relaxed">
                متن بدنه: هر گره، یک تصمیمِ دست است که در فشارِ نخ ثبت می‌شود؛ به همین دلیل هیچ دو کاری عین هم نیست.
              </span>
              <span className="muted font-mono text-xs" dir="ltr">16px body</span>
            </div>
            <div className="od-row items-baseline flex-wrap gap-4">
              <span className="price font-mono text-xl" dir="rtl">
                ۲٬۸۵۰٬۰۰۰ <small className="text-xs">تومان</small>
              </span>
              <span className="muted font-mono text-xs" dir="ltr">digits: U+06F0–U+06F9 · Vazirmatn 700</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — SPACE & RADIUS */}
      <section
        className="section--t"
        id="space"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۳ — فاصله و گوشه
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            واحد پایه ۸ پیکسل؛ مقیاس ۴ تا ۹۶. شعاع گوشه‌ها: xs (2px) / sm (6px) / md (12px) / lg (24px) / full.
          </p>

          <div className="space-doc mt-5">
            {[4, 8, 12, 16, 24, 32, 48, 64, 96].map((sz) => (
              <span key={sz} className="od-stack center items-center gap-1">
                <i style={{ "--h": `${sz}px` } as React.CSSProperties} />
                <small className="muted font-mono">{sz}</small>
              </span>
            ))}
          </div>

          <div className="od-cluster flex-wrap gap-4 mt-6">
            <span className="demo-box" style={{ borderRadius: "var(--radius-xs)", width: "72px", height: "44px" }} />
            <span className="demo-box" style={{ borderRadius: "var(--radius-sm)", width: "72px", height: "44px" }} />
            <span className="demo-box" style={{ borderRadius: "var(--radius-md)", width: "72px", height: "44px" }} />
            <span className="demo-box" style={{ borderRadius: "var(--radius-lg)", width: "72px", height: "44px" }} />
            <span className="demo-box" style={{ borderRadius: "var(--radius-full)", width: "72px", height: "44px" }} />
          </div>
        </div>
      </section>

      {/* 4 — SHADOW & LINE */}
      <section
        className="section--t"
        id="shadow"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۴ — سایه و خط
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            سایه‌ها با رنگ گرم مرکب و خط‌های مرزی ظریف برای تفکیک لایه‌ها.
          </p>

          <div className="od-cluster flex-wrap gap-5 mt-5">
            <span className="demo-box shadow-sm" style={{ width: "110px", height: "64px" }} />
            <span className="demo-box shadow-md" style={{ width: "110px", height: "64px" }} />
            <span className="demo-box shadow-lg" style={{ width: "110px", height: "64px" }} />
            <span className="demo-box shadow-2xl" style={{ width: "110px", height: "64px" }} />
            <span
              style={{
                border: "1.5px solid var(--color-accent-2)",
                width: "110px",
                height: "64px",
                display: "inline-grid",
                placeItems: "center",
                color: "var(--color-accent-2)",
                fontSize: "var(--text-100)",
                fontWeight: 600,
                borderRadius: "var(--radius-md)",
              }}
            >
              خط ۱.۵ پیکسل
            </span>
          </div>
        </div>
      </section>

      {/* 5 — COMPONENTS */}
      <section
        className="section--t"
        id="comp"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۵ — مؤلفه‌ها
          </h2>

          <div className="od-stack mt-6" style={{ "--od-gap": "var(--spacing-7)" } as React.CSSProperties}>
            {/* Buttons */}
            <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
              <span className="muted font-semibold text-sm">دکمه‌ها</span>
              <div className="od-row flex-wrap gap-3">
                <button className="btn btn--primary magnetic" type="button">افزودن به سبد</button>
                <button className="btn btn--dark" type="button">ثبت سفارش</button>
                <button className="btn btn--outline" type="button">راهنمای نصب</button>
                <button className="btn btn--quiet" type="button">مرتب‌سازی</button>
                <button className="btn btn--primary" type="button" disabled>ناموجود</button>
                <button className="btn btn--primary is-loading" type="button">در حال پرداخت</button>
              </div>
            </div>

            {/* Chips, Switches, Swatches */}
            <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
              <span className="muted font-semibold text-sm">چیپ، سوییچ، سوَچ</span>
              <div className="od-row flex-wrap items-center gap-3">
                <button className="chip" type="button" aria-pressed="true">
                  تابلو دیواری <span className="chip__count">۴</span>
                </button>
                <button className="chip" type="button" aria-pressed="false">
                  گل‌آویز <span className="chip__count">۴</span>
                </button>
                <label className="switch">
                  <input type="checkbox" defaultChecked />
                  <span>فقط کالای موجود</span>
                </label>
                <span className="swatch" style={{ "--c": "#6E7B5E" } as React.CSSProperties} aria-hidden="true" />
                <span className="swatch" style={{ "--c": "#A65A38" } as React.CSSProperties} aria-hidden="true" />
              </div>
            </div>

            {/* Form Fields */}
            <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
              <span className="muted font-semibold text-sm">میدان‌های فرم</span>
              <div className="od-grid grid-2 grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                <div className="field od-field">
                  <label htmlFor="d1">نام <span className="req text-accent">*</span></label>
                  <input id="d1" type="text" placeholder="سارا محمدی" defaultValue="" readOnly />
                </div>
                <div className="field od-field is-invalid">
                  <label htmlFor="d2">موبایل <span className="req text-accent">*</span></label>
                  <input
                    id="d2"
                    type="tel"
                    defaultValue="912345"
                    dir="ltr"
                    aria-invalid="true"
                    aria-describedby="d2e"
                    readOnly
                  />
                  <span className="error text-error text-xs mt-1 block" id="d2e" role="alert">
                    شماره موبایل ۱۱ رقمی است و با ۰۹ شروع می‌شود.
                  </span>
                </div>
                <div className="field od-field">
                  <label htmlFor="d3">نوع کار</label>
                  <select id="d3" defaultValue="تابلو دیواری" disabled>
                    <option>تابلو دیواری</option>
                    <option>گل‌آویز</option>
                  </select>
                </div>
                <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
                  <span className="muted font-semibold text-sm">جست‌وجو</span>
                  <div className="search">
                    <input type="search" placeholder="جست‌وجو در محصولات" aria-label="نمونه جست‌وجو" readOnly />
                    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="M16 16l4.5 4.5" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Product Tiles */}
            <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
              <span className="muted font-semibold text-sm">کاشی زنده محصول</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                {sampleProducts.map((p, idx) => (
                  <ProductCard key={p.id} product={p} index={idx} />
                ))}
              </div>
            </div>

            {/* Steps & Summary Table */}
            <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
              <span className="muted font-semibold text-sm">مراحل، جدول جمع، کد سفارش</span>
              <ol className="steps list-none p-0 flex flex-wrap gap-2">
                <li className="is-done">سبد</li>
                <li className="is-active">مشخصات</li>
                <li>تأیید</li>
              </ol>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                <div className="demo-box p-4">
                  <table className="sum-table w-full text-sm">
                    <tbody>
                      <tr>
                        <td className="py-1">جمع کالاها (۳ عدد)</td>
                        <td className="text-left font-mono">۴٬۱۸۰٬۰۰۰ <small>تومان</small></td>
                      </tr>
                      <tr>
                        <td className="py-1">ارسال</td>
                        <td className="text-left font-mono">۹۰٬۰۰۰ <small>تومان</small></td>
                      </tr>
                      <tr className="total font-bold border-t border-line">
                        <td className="py-2">قابل پرداخت</td>
                        <td className="text-left font-mono">۴٬۲۷۰٬۰۰۰ <small>تومان</small></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="demo-box p-4 flex flex-col justify-center items-center">
                  <span className="muted text-xs mb-1">کد پیگیری سفارش نمونه</span>
                  <span className="order-code font-mono text-lg font-bold" dir="ltr">
                    GR-۱۲۳۴۵۶
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — STATES */}
      <section
        className="section--t"
        id="states"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۶ — حالات تعامل
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            default · hover · focus · selected · loading · empty · success · failure · disabled · pressed
          </p>

          <div className="od-stack mt-5 max-w-2xl" style={{ "--od-gap": "16px" } as React.CSSProperties}>
            <InteractiveStatesDemo />

            <div className="summary-box" role="alert">
              <p className="font-semibold text-error mb-2">چند مورد نیاز به اصلاح دارد:</p>
              <ul className="list-disc pr-5 text-sm">
                <li>
                  <a href="#d2" className="underline text-error">
                    موبایل: شماره ۱۱ رقمی است و با ۰۹ شروع می‌شود.
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 7 — MOTION */}
      <section
        className="section--t"
        id="motion"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۷ — حرکت
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            میکرو ۱۵۰–۳۰۰ms · ماکرو ۴۰۰ms · صفحه ۴۲۰ms · استگر ۴۰ms · ورود cubic-bezier(.16,1,.3,1). با prefers-reduced-motion جلوه‌ها ایستا می‌شوند.
          </p>

          <div className="od-stack mt-5 max-w-2xl" style={{ "--od-gap": "24px" } as React.CSSProperties}>
            <MotionKnotDemo />

            <Marquee
              items={[
                "میکرو ۱۸۰ms",
                "ماکرو ۴۰۰ms",
                "استگر ۴۰ms",
                "page ۴۲۰ms",
                "میکرو ۱۸۰ms",
                "ماکرو ۴۰۰ms",
                "استگر ۴۰ms",
                "page ۴۲۰ms",
              ]}
            />

            <div className="od-row flex-wrap gap-4">
              <div className="demo-box reveal-x p-4" style={{ "--rx": "-20px" } as React.CSSProperties}>
                reveal-x هنگام اسکرول
              </div>
              <div className="demo-box reveal-scale p-4">
                reveal-scale
              </div>
              <div className="demo-box p-4">
                <div className="skeleton" style={{ width: "180px", height: "14px" }} />
                <div className="skeleton mt-2" style={{ width: "120px", height: "14px" }} />
                <small className="muted block mt-2 text-xs">skeleton (شاین بدون جابه‌جایی طرح)</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 — ICONS */}
      <section
        className="section--t"
        id="icons"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۸ — خانوادهٔ آیکون
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            تک‌خانواده: گرید ۲۴، استروک ۱.۵ پیکسل، currentColor، سرگرد round — بدون ایموجی‌های کارکردی.
          </p>

          <div className="od-row flex-wrap gap-5 mt-4 items-center">
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
              <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 14l5 2v4a15 15 0 0 1-15-15z" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 8h13v8H3zM16 11h3l2 2v3h-5z" />
              <circle cx="7" cy="17" r="1.6" />
              <circle cx="17.5" cy="17" r="1.6" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" />
              <path d="M12 7v5l3.5 2" />
            </svg>
            <svg className="icon w-6 h-6" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>
        </div>
      </section>

      {/* 9 — MEDIA GEOMETRY */}
      <section
        className="section--t"
        id="media"
        style={{ borderTop: "1px solid var(--color-line)", paddingBlock: "var(--spacing-8)" }}
      >
        <div className="wrap">
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۹ — هندسهٔ رسانه
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            نسبت هر کانتینر از اندازهٔ ذاتی فایل سنجیده‌شده می‌آید؛ تصاویر محتوایی کرپ نمی‌شوند و cover فقط برای موارد تزئینی است.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
            <figure>
              <div className="relative aspect-[1920/1307] rounded-xl overflow-hidden bg-surface-alt">
                <Image
                  src="/assets/img/hanging-plants-porch.jpg"
                  width={1920}
                  height={1307}
                  alt="نسبت واقعی ۱۹۲۰×۱۳۰۷"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="muted text-xs mt-2 font-mono">۱۹۲۰×۱۳۰۷ → ۱٫۴۷</figcaption>
            </figure>
            <figure>
              <div className="relative aspect-[1920/2560] rounded-xl overflow-hidden bg-surface-alt">
                <Image
                  src="/assets/img/macrame-textile-panel.jpg"
                  width={1920}
                  height={2560}
                  alt="نسبت واقعی ۱۹۲۰×۲۵۶۰"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="muted text-xs mt-2 font-mono">۱۹۲۰×۲۵۶۰ → ۰٫۷۵</figcaption>
            </figure>
            <figure>
              <div className="relative aspect-[741/536] rounded-xl overflow-hidden bg-surface-alt">
                <Image
                  src="/assets/img/macrame-owls.jpg"
                  width={741}
                  height={536}
                  alt="نسبت واقعی ۷۴۱×۵۳۶"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <figcaption className="muted text-xs mt-2 font-mono">۷۴۱×۵۳۶ → ۱٫۳۸</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 10 — CREDITS & LICENSES (Dynamic from DB) */}
      <section
        className="section--t"
        id="credits"
        style={{
          borderTop: "1px solid var(--color-line)",
          paddingBlock: "var(--spacing-8) var(--spacing-10)",
        }}
      >
        <div className="wrap" style={{ maxWidth: "900px" }}>
          <h2 style={{ fontSize: "var(--text-400)" }} className="font-display">
            ۱۰ — منابع تصویر و پروانه‌ها
          </h2>
          <p className="muted text-sm leading-relaxed mt-1">
            همه‌ی عکس‌ها واقعی، از{" "}
            <a
              className="underline text-ink hover:text-accent"
              href="https://commons.wikimedia.org"
              rel="license noopener"
              target="_blank"
            >
              ویکیمدیا کامنز
            </a>
            ، محلی‌شده در پروژه با ذکر هنرمند و پروانه.
          </p>

          <div className="overflow-x-auto mt-4">
            <table className="sum-table w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-line text-right">
                  <th className="py-2.5 px-3 font-bold">فایل</th>
                  <th className="py-2.5 px-3 font-bold">هنرمند</th>
                  <th className="py-2.5 px-3 font-bold">پروانه</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((c, i) => (
                  <tr key={i} className="border-b border-line/60 hover:bg-surface-alt/40 transition-colors">
                    <td className="py-2 px-3 font-mono text-xs" dir="ltr">
                      {c.path}
                    </td>
                    <td className="py-2 px-3 text-ink-2">{c.artist}</td>
                    <td className="py-2 px-3 text-muted font-mono text-xs">{c.license}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="muted text-xs mt-4">
            فونت‌ها: Vazirmatn و Lalezar — هر دو آزاد (OFL)، محلی در پروژه.
          </p>
        </div>
      </section>
    </main>
  );
}
