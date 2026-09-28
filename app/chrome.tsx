import Link from "next/link";

const nav = [
  { href: "/", label: "خانه" },
  { href: "/shop", label: "فروشگاه" },
  { href: "/about", label: "درباره و آموزش" },
  { href: "/contact", label: "سفارش اختصاصی" },
] as const;

/* Site header — ported from `.design/index.html`. Sticky, blurred over content;
   mobile nav is a CSS-only disclosure (no JS, matches §8's "additive client JS"). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/88 backdrop-blur">
      <div className="wrap flex min-h-[var(--width-header)] items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="گِرِه — صفحه اصلی"
          className="flex items-center gap-3 font-display text-[var(--text-400)] text-ink"
        >
          <svg viewBox="0 0 48 48" aria-hidden="true" className="h-9 w-9 text-accent">
            <path
              d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          </svg>
          <span className="flex items-center gap-2">
            گِرِه
            <small className="font-sans text-[var(--text-100)] font-normal text-muted">
              مکرومه دستبافت
            </small>
          </span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden md:flex items-center gap-8">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative py-2 text-[var(--text-100)] font-medium text-ink-2 transition-colors duration-[var(--duration-micro)] ease-[var(--ease-enter)] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:scale-x-0 after:bg-accent after:transition-transform after:duration-[var(--duration-micro)] after:ease-[var(--ease-enter)] hover:text-ink hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label="سبد خرید"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition-colors duration-[var(--duration-micro)] ease-[var(--ease-enter)] hover:bg-surface-alt"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 stroke-ink fill-none stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]">
              <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
              <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
            </svg>
          </Link>

          <details className="group relative md:hidden">
            <summary className="inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-line text-ink [&::-webkit-details-marker]:hidden">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
              <span className="sr-only">باز کردن منو</span>
            </summary>
            <nav
              aria-label="ناوبری موبایل"
              className="absolute inset-x-4 top-[calc(var(--width-header)+8px)] flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-3)]"
            >
              {nav.map((item) => (
                <Link key={item.href} href={item.href} className="text-ink-2 hover:text-accent">
                  {item.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/* Site footer — ported from `.design/index.html` (the email row is dropped:
   ADR-0005 — no inbox, and SPEC §6 says it appears nowhere on the built site). */
export function SiteFooter() {
  return (
    <footer className="mt-32 border-t border-line bg-surface">
      <div className="wrap">
        <div className="grid gap-8 py-24 pb-12 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-3 font-display text-[var(--text-400)] text-ink"
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="h-9 w-9 text-accent">
                <path
                  d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
              </svg>
              <span>گِرِه</span>
            </Link>
            <p className="max-w-[42ch] text-muted">
              مکرومه‌بافی دستبافت — کارگاه تهران. نام برند «گِرِه» جای‌نماست.
            </p>
          </div>

          <nav aria-label="فهرست سایت">
            <h4 className="mb-3 font-sans text-[var(--text-100)] font-bold text-muted">
              برو به
            </h4>
            <div className="flex flex-col gap-1">
              {[
                { href: "/", label: "خانه" },
                { href: "/shop", label: "فروشگاه" },
                { href: "/cart", label: "سبد خرید" },
                { href: "/about", label: "درباره و آموزش" },
                { href: "/design-system", label: "دیزاین‌سیستم" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-block py-1 text-ink-2 transition-colors duration-[var(--duration-micro)] hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h4 className="mb-3 font-sans text-[var(--text-100)] font-bold text-muted">
              تماس
            </h4>
            <div className="flex flex-col gap-2">
              <a href="tel:+989123456789" dir="ltr" className="whitespace-nowrap text-ink-2">
                ۰۹۱۲ ۳۴۵ ۶۷۸۹
              </a>
              <p className="text-muted">شنبه تا چهارشنبه، ۱۰ تا ۱۸</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-4 border-t border-line py-5 text-muted">
          <span>© ۱۴۰۳ گِرِه — قیمت‌ها و موجودی نمونه است.</span>
          <span>
            عکس‌ها از{" "}
            <a
              href="https://commons.wikimedia.org"
              rel="license noopener"
              className="text-ink-2 underline underline-offset-2"
            >
              ویکییمدیا کامنز
            </a>{" "}
            با پروانه‌های آزاد.
          </span>
        </div>
      </div>
    </footer>
  );
}
