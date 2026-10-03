import { Suspense } from "react";
import type { Metadata } from "next";
import { vazirmatn, lalezar } from "./fonts";
import { SiteHeader, SiteFooter } from "./chrome";
import { getImageCredits } from "@/lib/storefront";
import { RevealObserver } from "@/components/motion/RevealObserver";
import { PageCurtain } from "@/components/motion/PageCurtain";
import { ToastRegion } from "@/components/motion/ToastRegion";
import { Agentation } from "agentation";
import "./globals.css";

const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://gereh.shop").replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
    template: "%s — گِرِه",
  },
  description: "گِرِه: تابلوهای دیواری، گل‌آویز و اکسسوری‌های مکرومه، همه بافته‌ی دست.",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "گِرِه",
    title: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
    description: "گِرِه: تابلوهای دیواری، گل‌آویز و اکسسوری‌های مکرومه، همه بافته‌ی دست.",
    images: [
      {
        url: "/images/macrame-hanger-set.jpg",
        width: 1200,
        height: 630,
        alt: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "گِرِه — فروشگاه مکرومه‌بافی دستبافت",
    description: "گِرِه: تابلوهای دیواری، گل‌آویز و اکسسوری‌های مکرومه، همه بافته‌ی دست.",
    images: ["/images/macrame-hanger-set.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const credits = getImageCredits();

  return (
    <html
      lang="fa"
      dir="rtl"
      data-scroll-behavior="smooth"
      className={`${vazirmatn.variable} ${lalezar.variable}`}
    >
      <body className="min-h-dvh flex flex-col overflow-x-hidden">
        <SiteHeader />

        <div className="flex-1">
          {children}
        </div>

        <SiteFooter credits={credits} />

        <Suspense fallback={null}>
          <PageCurtain />
          <RevealObserver />
        </Suspense>
        <ToastRegion />

        {process.env.NODE_ENV === "development" && (
          <Agentation endpoint="http://localhost:4747" />
        )}
      </body>
    </html>
  );
}
