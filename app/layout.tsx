import type { Metadata } from "next";
import { vazirmatn, lalezar } from "./fonts";
import { SiteHeader, SiteFooter } from "./chrome";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
    template: "%s — گِرِه",
  },
  description: "گِرِه: تابلوهای دیواری، گل‌آویز و اکسسوری‌های مکرومه، همه بافته‌ی دست.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${vazirmatn.variable} ${lalezar.variable}`}
    >
      <body className="min-h-dvh flex flex-col overflow-x-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only fixed top-4 z-90 rounded bg-ink px-6 py-3 text-bg"
        >
          پرش به محتوای اصلی
        </a>

        <SiteHeader />

        <main id="main" className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
