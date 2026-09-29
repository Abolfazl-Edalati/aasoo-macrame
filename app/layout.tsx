import { Suspense } from "react";
import type { Metadata } from "next";
import { vazirmatn, lalezar } from "./fonts";
import { SiteHeader, SiteFooter } from "./chrome";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { PageCurtain } from "@/components/motion/PageCurtain";
import { ToastRegion } from "@/components/motion/ToastRegion";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
    template: "%s — گِرِه",
  },
  description: "گِرِه: تابلوهای دیواری، گل‌آویز و اکسسوری‌های مکرومه، همه بافته‌ی دست.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          className="skip-link"
        >
          پرش به محتوای اصلی
        </a>

        <SiteHeader />

        <div className="flex-1">
          {children}
        </div>

        <SiteFooter />

        <Suspense fallback={null}>
          <PageCurtain />
          <RevealObserver />
        </Suspense>
        <ToastRegion />
      </body>
    </html>
  );
}
