import type { Metadata } from "next";
import Image from "next/image";
import { getAllArticles, getFaqItems } from "@/lib/storefront";
import { LivingKnot } from "@/components/motion/LivingKnot";
import { TransitionLink } from "@/components/motion/TransitionLink";
import { ArticleCard } from "@/components/about/ArticleCard";

export const metadata: Metadata = {
  title: "درباره و آموزش",
  description:
    "کارگاه گِرِه، روش بافت، و آموزش‌های مکرومه از گره پایه تا نصب روی دیوار.",
};

export default function AboutPage() {
  const articles = getAllArticles();
  const faqList = getFaqItems();

  return (
    <main id="main">
      {/* ABOUT HERO & STORY */}
      <section className="section" style={{ paddingBlock: "var(--spacing-9)" }}>
        <div className="wrap">
          <div className="split">
            <div>
              <span className="eyebrow reveal">درباره‌ی کارگاه</span>
              <h1 className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
                هر گره، یک<br />تصمیم دست
              </h1>
              <div className="od-stack" style={{ "--od-gap": "16px", maxWidth: "62ch" } as React.CSSProperties}>
                <p className="lead ink2 reveal" style={{ "--i": 2 } as React.CSSProperties}>
                  گِرِه یک کارگاه تک‌نفره در تهران است. همه‌ی کارها — از انتخاب نخ تا آخرین گره و منگوله‌چینی — با همان دست انجام می‌شود؛ به‌همین دلیل تعداد کارها در ماه محدود است.
                </p>
                <p className="ink2 reveal" style={{ "--i": 3 } as React.CSSProperties}>
                  مکرومه در برابر بافتنی، ریاضیِ طناب است: تکرارِ منظمِ چند نوع گره، که با تغییر فشار و فاصله، نقش می‌سازد. کارهای این مجموعه بیشتر بر پایهٔ گره مربعی و نیم‌گره است، با کمی گره جوزفین برای سطح‌های گرد.
                </p>
                <p className="ink2 reveal" style={{ "--i": 4 } as React.CSSProperties}>
                  نخ‌ها پنبه‌ای و کنفی‌اند؛ میچوی‌ها از چوب گردو یا بامبوی خشک‌شده. چیزی که در عکس‌ها می‌بینید، همان چیزی است که بافته می‌شود — فقط نور کارگاه با نور خانهٔ شما فرق دارد.
                </p>
              </div>
              <div className="od-cluster reveal" style={{ "--i": 5, "--od-gap": "12px", marginTop: "var(--spacing-6)" } as React.CSSProperties}>
                <TransitionLink className="btn btn--primary magnetic" href="/shop">
                  دیدن کارها
                </TransitionLink>
                <TransitionLink className="btn btn--outline" href="/contact#order">
                  ثبت سفارش اختصاصی
                </TransitionLink>
              </div>
            </div>
            <figure className="reveal-scale" style={{ "--i": 2 } as React.CSSProperties}>
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-surface-alt">
                <Image
                  src="/assets/img/macrame-materials.jpg"
                  width={1920}
                  height={1440}
                  alt="کلاف‌های نخ پنبه و کنف روی میز کارگاه"
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <figcaption className="muted" style={{ marginTop: "var(--spacing-3)" }}>
                میز کار و کلاف‌های نخ — قبل از هر سفارش، رنگ روی چوب تست می‌شود.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="section--t" style={{ borderBlock: "1px solid var(--color-line)", background: "var(--color-surface)", paddingBlock: "var(--spacing-7)" }}>
        <div className="wrap">
          <div className="stat-strip">
            <div className="od-stat reveal" style={{ "--i": 0 } as React.CSSProperties}>
              <span className="stat__n">۴</span>
              <span className="stat__l">سال بافت مداوم</span>
            </div>
            <div className="od-stat reveal" style={{ "--i": 1 } as React.CSSProperties}>
              <span className="stat__n">۷</span>
              <span className="stat__l">گرهٔ پایه در مجموعه</span>
            </div>
            <div className="od-stat reveal" style={{ "--i": 2 } as React.CSSProperties}>
              <span className="stat__n">۵</span>
              <span className="stat__l">رنگ نخ همیشگی</span>
            </div>
            <div className="od-stat reveal" style={{ "--i": 3 } as React.CSSProperties}>
              <span className="stat__n">۱۲</span>
              <span className="stat__l">قطعهٔ آماده در فروشگاه</span>
            </div>
          </div>
          <p className="muted" style={{ margin: "var(--spacing-5) 0 0", fontSize: "var(--text-100)" }}>
            این اعداد توصیف کارگاه است، نه آمار فروش — در محیط واقعی از دادهٔ خودتان جایگزین کنید.
          </p>
        </div>
      </section>

      {/* KNOT GRAMMAR (#knots) */}
      <section className="section band-dark" data-inverse id="knots" style={{ paddingBlock: "var(--spacing-9)" }}>
        <div className="wrap">
          <div className="od-row" style={{ justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", "--od-gap": "24px", marginBottom: "var(--spacing-7)" } as React.CSSProperties}>
            <div>
              <span className="eyebrow reveal">دانشگاه گره</span>
              <h2 id="knots-h" className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
                دست‌خطِ کارگاه
              </h2>
            </div>
            <p className="ink2 reveal" style={{ "--i": 2, maxWidth: "44ch", margin: 0 } as React.CSSProperties}>
              گره‌هایی که بیشتر استفاده می‌کنم. مسیرها با اسکرول «بسته» می‌شوند — همان‌طور که در بافت بسته می‌شوند.
            </p>
          </div>

          <div className="od-grid grid-2 sm:grid-cols-2 lg:grid-cols-4" style={{ "--od-cols": 4, "--od-gap": "24px" } as React.CSSProperties} id="knots-grid">
            {/* Square Knot */}
            <div className="od-stack reveal" style={{ "--od-gap": "16px", "--i": 0 } as React.CSSProperties}>
              <LivingKnot className="knot" viewBox="0 0 120 120" ariaLabel="نقش گره مربعی">
                <path className="rope" d="M20 30c30 0 50 20 80 20M100 30c-30 0-50 20-80 20M20 70c30 0 50 20 80 20M100 70c-30 0-50 20-80 20" />
              </LivingKnot>
              <div className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                <b style={{ fontSize: "var(--text-200)" }}>گره مربعی</b>
                <span className="muted">ستون فقرات بافت؛ محکم و متقارن</span>
              </div>
            </div>

            {/* Half Knot */}
            <div className="od-stack reveal" style={{ "--od-gap": "16px", "--i": 1 } as React.CSSProperties}>
              <LivingKnot className="knot" viewBox="0 0 120 120" ariaLabel="نقش نیم‌گره">
                <path className="rope" d="M24 24c48 12 24 36 72 48M24 48c48 12 24 36 72 48M24 72c48 12 24 24 72 24" />
              </LivingKnot>
              <div className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                <b style={{ fontSize: "var(--text-200)" }}>نیم‌گره</b>
                <span className="muted">موج و مارپیچ از تکرار همین ساخته می‌شود</span>
              </div>
            </div>

            {/* Lark's Head Knot */}
            <div className="od-stack reveal" style={{ "--od-gap": "16px", "--i": 2 } as React.CSSProperties}>
              <LivingKnot className="knot" viewBox="0 0 120 120" ariaLabel="نقش گره کوله‌پشتی">
                <path className="rope" d="M60 16v88M30 34c20 8 40 8 60 0M30 58c20 8 40 8 60 0M30 82c20 8 40 8 60 0" />
              </LivingKnot>
              <div className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                <b style={{ fontSize: "var(--text-200)" }}>کوله‌پشتی</b>
                <span className="muted">پایهٔ گل‌آویز؛ نخ را دور میچو می‌پیچد</span>
              </div>
            </div>

            {/* Josephine Knot */}
            <div className="od-stack reveal" style={{ "--od-gap": "16px", "--i": 3 } as React.CSSProperties}>
              <LivingKnot className="knot" viewBox="0 0 120 120" ariaLabel="نقش گره جوزفین">
                <circle className="rope" cx="45" cy="45" r="22" />
                <circle className="rope" cx="75" cy="45" r="22" />
                <circle className="rope" cx="45" cy="75" r="22" />
                <circle className="rope" cx="75" cy="75" r="22" />
              </LivingKnot>
              <div className="od-stack" style={{ "--od-gap": "4px" } as React.CSSProperties}>
                <b style={{ fontSize: "var(--text-200)" }}>جوزفین</b>
                <span className="muted">برای حلقه‌های تزئینی و توربچهٔ مشبک</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS STEPS (#process) */}
      <section className="section" id="process" style={{ paddingBlock: "var(--spacing-9)" }}>
        <div className="wrap">
          <span className="eyebrow reveal">مراحل</span>
          <h2 className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
            یک تابلو از نخ تا دیوار
          </h2>

          <div className="od-stack" style={{ "--od-gap": "var(--spacing-8)", marginTop: "var(--spacing-7)" } as React.CSSProperties}>
            {/* Step 1 */}
            <div className="split">
              <figure className="reveal-x" style={{ "--rx": "-32px" } as React.CSSProperties}>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-alt">
                  <Image
                    src="/assets/img/macrame-basic-knots.jpg"
                    width={1920}
                    height={1440}
                    alt="نمای نزدیک گره‌های پایه روی تارهای نخ"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="muted" style={{ marginTop: "var(--spacing-3)" }}>
                  ۰۱ — برآورد نخ: برای هر تابلو ۸ تا ۱۰ برابر قدِ کار نخ لازم است.
                </figcaption>
              </figure>
              <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                <h3 style={{ fontSize: "var(--text-400)" }} className="font-display">
                  برش و آویزان کردن تارها
                </h3>
                <p className="ink2 leading-relaxed mt-2">
                  نخ‌ها روی میچوی چوبی آویزان می‌شوند؛ ارتفاع میچو روی دیوارِ مقصد علامت می‌خورد تا قد کار دقیق دربیاید. اگر قد را اشتباه بگیرم، اصلاحش یعنی باز کردن چند صد گره.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="split split--media-first">
              <div className="reveal">
                <h3 style={{ fontSize: "var(--text-400)" }} className="font-display">
                  بافت بدنه
                </h3>
                <p className="ink2 leading-relaxed mt-2">
                  یک تابلوی ۸۰ سانتی حدود ۳۰ ساعت کار خالص می‌برد. هر ده ردیف، کار از میچو باز می‌شود تا فشار گره‌ها یکدست بماند — وگرنه پایین کار کج می‌ایستد.
                </p>
              </div>
              <figure className="reveal-x" style={{ "--rx": "32px" } as React.CSSProperties}>
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-alt">
                  <Image
                    src="/assets/img/macrame-knots-diagram-a.jpg"
                    width={1920}
                    height={1440}
                    alt="نقشهٔ گره‌ها روی کاغذ کنار بافت در جریان"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="muted" style={{ marginTop: "var(--spacing-3)" }}>
                  ۰۲ — نقشهٔ گره: قبل از شروع روی کاغذ کشیده می‌شود.
                </figcaption>
              </figure>
            </div>

            {/* Step 3 */}
            <div className="split">
              <figure className="reveal-x" style={{ "--rx": "-32px" } as React.CSSProperties}>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-surface-alt">
                  <Image
                    src="/assets/img/macrame-knots-diagram-b.jpg"
                    width={1920}
                    height={1440}
                    alt="شانه‌کاری و مرتب کردن نخ‌های پایانی"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <figcaption className="muted" style={{ marginTop: "var(--spacing-3)" }}>
                  ۰۳ — شانه‌کاری: نخ‌های اضافی چین می‌خورند و منگوله شکل می‌گیرد.
                </figcaption>
              </figure>
              <div className="reveal" style={{ "--i": 1 } as React.CSSProperties}>
                <h3 style={{ fontSize: "var(--text-400)" }} className="font-display">
                  شانه‌کاری و تحویل
                </h3>
                <p className="ink2 leading-relaxed mt-2">
                  آخرین مرحله، شانه کردن منگوله‌ها و قیچی‌ی هم‌تراز است. کار رول‌نشده و آویزان ارسال می‌شود تا گره‌ها له نشوند؛ کارتنگی نصب و نگهداری هم داخل بسته است.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNAL (#journal) — Strictly no /journal routes in v1, articles disclose inline */}
      <section
        className="section"
        id="journal"
        style={{
          background: "var(--color-surface)",
          borderTop: "1px solid var(--color-line)",
          paddingBlock: "var(--spacing-9)",
        }}
      >
        <div className="wrap">
          <div
            className="od-row"
            style={
              {
                justifyContent: "space-between",
                alignItems: "flex-end",
                flexWrap: "wrap",
                "--od-gap": "24px",
                marginBottom: "var(--spacing-6)",
              } as React.CSSProperties
            }
          >
            <div>
              <span className="eyebrow reveal">آموزش و وبلاگ</span>
              <h2 id="journal-h" className="reveal font-display" style={{ "--i": 1 } as React.CSSProperties}>
                نوشته‌های کارگاه
              </h2>
            </div>
            <p className="muted reveal" style={{ "--i": 2, margin: 0, maxWidth: "40ch" } as React.CSSProperties}>
              نوشته‌ها همان چیزی است که در کلاس‌های حضوری می‌گویم؛ کوتاه و عملی.
            </p>
          </div>

          <div
            className="od-grid grid-2 grid-cols-1 md:grid-cols-2"
            style={{ "--od-gap": "24px" } as React.CSSProperties}
            id="journal-grid"
          >
            {articles.map((article, idx) => (
              <ArticleCard key={article.id} article={article} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (#faq) */}
      <section className="section" id="faq" style={{ paddingBlock: "var(--spacing-9)" }}>
        <div className="wrap" style={{ maxWidth: "820px" }}>
          <span className="eyebrow reveal">سؤالهای پرتکرار</span>
          <h2 className="reveal font-display" style={{ "--i": 1, marginBottom: "var(--spacing-6)" } as React.CSSProperties}>
            قبل از سفارش
          </h2>
          <div className="od-stack acc-strip">
            {faqList.map((item, idx) => (
              <details
                key={item.id}
                className="acc reveal"
                style={{ "--i": idx } as React.CSSProperties}
              >
                <summary>
                  {item.question}
                  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <div className="acc-body">
                  <p style={{ margin: 0 }}>{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="section section--t band-dark text-center"
        data-inverse
        style={{ paddingBlock: "var(--spacing-9)" }}
      >
        <div className="wrap">
          <div className="flex justify-center mb-5">
            <LivingKnot className="knot" viewBox="0 0 120 60" ariaLabel="گره تزئینی">
              <path className="rope" d="M6 30c24-24 42 24 66 0s24-24 42-6" />
            </LivingKnot>
          </div>
          <h2
            className="reveal font-display"
            style={
              {
                fontSize: "clamp(var(--text-400), 5vw, var(--text-600))",
                marginBottom: "var(--spacing-4)",
              } as React.CSSProperties
            }
          >
            دیوار شما، نقش خودتان
          </h2>
          <p
            className="ink2 reveal mx-auto leading-relaxed"
            style={{ "--i": 1, maxWidth: "52ch" } as React.CSSProperties}
          >
            قد و عرض، رنگ نخ، نوع منگوله — هر سه را با هم تصمیم می‌گیریم.
          </p>
          <div className="mt-6 flex justify-center">
            <TransitionLink
              className="btn btn--primary btn--lg magnetic reveal"
              style={{ "--i": 2 } as React.CSSProperties}
              href="/contact#order"
            >
              شروع سفارش اختصاصی
            </TransitionLink>
          </div>
        </div>
      </section>
    </main>
  );
}
