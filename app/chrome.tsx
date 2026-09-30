import { TransitionLink } from "@/components/motion/TransitionLink";
import { CartCountBadge } from "@/components/motion/CartCountBadge";

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
    <header className="site-header">
      <div className="wrap od-row" style={{ "--od-gap": "16px", justifyContent: "space-between" } as React.CSSProperties}>
        <TransitionLink
          href="/"
          aria-label="گِرِه — صفحه اصلی"
          className="brand"
        >
          <svg viewBox="0 0 48 48" aria-hidden="true" className="knot-mark">
            <path
              d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            <path
              d="M10 24h28M24 6v36"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              opacity={0.45}
            />
          </svg>
          <span className="od-row" style={{ "--od-gap": "8px" } as React.CSSProperties}>
            گِرِه <small>مکرومه دستبافت</small>
          </span>
        </TransitionLink>

        <nav aria-label="ناوبری اصلی" className="nav-links">
          {nav.map((item) => (
            <TransitionLink
              key={item.href}
              href={item.href}
            >
              {item.label}
            </TransitionLink>
          ))}
        </nav>

        <div className="od-row" style={{ "--od-gap": "8px" } as React.CSSProperties}>
          <TransitionLink
            href="/account"
            aria-label="حساب کاربری"
            className="icon-btn od-touch"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5.33 0-8 2.67-8 6v1h16v-1c0-3.33-2.67-6-8-6z" />
            </svg>
          </TransitionLink>

          <TransitionLink
            href="/cart"
            aria-label="سبد خرید"
            className="icon-btn od-touch relative"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
              <path d="M5 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 7z" />
              <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
            </svg>
            <CartCountBadge />
          </TransitionLink>

          <details className="group relative md:hidden">
            <summary className="icon-btn nav-toggle od-touch cursor-pointer list-none [&::-webkit-details-marker]:hidden" aria-label="باز کردن منو">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
                <path d="M4 7h16M4 12h16M4 17h10" />
              </svg>
            </summary>
            <nav
              aria-label="ناوبری موبایل"
              className="absolute left-0 top-[calc(var(--header-h)+8px)] flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6 shadow-[var(--shadow-3)] min-w-[200px] z-50"
            >
              {nav.map((item) => (
                <TransitionLink key={item.href} href={item.href} className="text-ink-2 hover:text-accent">
                  {item.label}
                </TransitionLink>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

/* Site footer — ported from `.design/index.html` */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="od-stack" style={{ "--od-gap": "16px" } as React.CSSProperties}>
            <TransitionLink
              href="/"
              className="brand"
            >
              <svg viewBox="0 0 48 48" aria-hidden="true" className="knot-mark">
                <path
                  d="M24 6c-9 6-14 12-14 18s6 12 14 18c8-6 14-12 14-18S33 12 24 6z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.6}
                  strokeLinecap="round"
                />
              </svg>
              <span>گِرِه</span>
            </TransitionLink>
            <p className="muted" style={{ maxWidth: "42ch", margin: 0 }}>
              مکرومه‌بافی دستبافت — کارگاه تهران. نام برند «گِرِه» جای‌نماست و با یک ویرایش در داده عوض می‌شود.
            </p>
          </div>

          <nav aria-label="فهرست سایت">
            <h4>برو به</h4>
            <div className="od-stack" style={{ "--od-gap": "0" } as React.CSSProperties}>
              {[
                { href: "/", label: "خانه" },
                { href: "/shop", label: "فروشگاه" },
                { href: "/cart", label: "سبد خرید" },
                { href: "/account", label: "حساب کاربری" },
                { href: "/about", label: "درباره و آموزش" },
                { href: "/contact", label: "تماس و سفارش" },
                { href: "/design-system", label: "دیزاین‌سیستم" },
              ].map((item) => (
                <TransitionLink
                  key={item.href}
                  href={item.href}
                >
                  {item.label}
                </TransitionLink>
              ))}
            </div>
          </nav>

          <div>
            <h4>تماس</h4>
            <div className="od-stack" style={{ "--od-gap": "8px" } as React.CSSProperties}>
              <a href="tel:09123456789" className="od-nowrap">
                ۰۹۱۲ ۳۴۵ ۶۷۸۹
              </a>
              <p className="muted" style={{ margin: 0 }}>شنبه تا چهارشنبه، ۱۰ تا ۱۸</p>
            </div>
          </div>
        </div>

        <div className="foot-bottom credits">
          <span>© ۱۴۰۳ گِرِه — قیمتها و موجودی نمونه است.</span>
          <span>
            عکس‌ها از{" "}
            <a href="https://commons.wikimedia.org" rel="license noopener" target="_blank">
              ویکیمدیا کامنز
            </a>{" "}
            با پروانه‌های آزاد.
          </span>
        </div>
      </div>
    </footer>
  );
}
