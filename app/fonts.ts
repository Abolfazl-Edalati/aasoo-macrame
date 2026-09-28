import localFont from "next/font/local";

/* Lalezar + Vazirmatn, self-hosted — zero external font requests (ADR-0001, §8).

   The `.design` prototype served these as hand-written @font-face rules with
   per-subset unicode-range (arabic / latin / latin-ext). next/font/local only
   supports `declarations` at the top level (uniform across all sources), so
   per-subset unicode-range cannot be expressed. All three subsets are loaded for
   each weight; the extra ~56 KB per weight is acceptable for a Persian-primary
   shop. If subsetting becomes a perf concern, drop the latin-ext files and serve
   latin-only as a fallback.

   Turbopack statically evaluates this module — every value must be an explicit
   literal (no spread, no `.flat()`, no template-literal paths, no hoisted consts). */

type FontSource = {
  path: string;
  weight: string;
  style: "normal";
};

/** Vazirmatn — body text, weights 300/400/500/600/700, 3 subsets each (§2.2). */
export const vazirmatn = localFont({
  src: [
    {
      path: "./assets/fonts/vazirmatn-arabic-300.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./assets/fonts/vazirmatn-latin-300.woff2",
      weight: "300",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-ext-300.woff2",
      weight: "300",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-arabic-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-ext-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-arabic-500.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-500.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-ext-500.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-arabic-600.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-600.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-ext-600.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-arabic-700.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-700.woff2",
      weight: "700",
      style: "normal"
    },
    {
      path: "./assets/fonts/vazirmatn-latin-ext-700.woff2",
      weight: "700",
      style: "normal"
    },
  ] satisfies FontSource[],
  display: "swap",
  variable: "--font-text",
  fallback: ["sans-serif"],
});

/** Lalezar — display/headings only, weight 400, 3 subsets (§2.2). */
export const lalezar = localFont({
  src: [
    {
      path: "./assets/fonts/lalezar-arabic-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./assets/fonts/lalezar-latin-400.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "./assets/fonts/lalezar-latin-ext-400.woff2",
      weight: "400",
      style: "normal"
    },
  ] satisfies FontSource[],
  display: "swap",
  variable: "--font-display",
  fallback: ["sans-serif"],
});
