import localFont from "next/font/local";

/* Lalezar + Vazirmatn, self-hosted — zero external font requests (ADR-0001, §8).
   The `.design` prototype served these as hand-written @font-face rules, three
   subsets per weight (arabic / latin / latin-ext, each with its own unicode-range).
   next/font generates those @font-face rules instead; `declarations` carries the
   unicode-range over so the subset split survives the port.

   Written without spread syntax: Turbopack (Next 16's default bundler) evaluates
   this module in its own transform context and chokes on `...spread`. */

const ARABIC = "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE7F,U+FE80-FEFC";
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02AF,U+0304,U+0308,U+0329,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

type FontSource = {
  path: string;
  weight: string;
  style: "normal";
  declarations: Array<{ prop: string; value: string }>;
};

/** Vazirmatn — body text, weights 300/400/500/600/700 (§2.2). */
export const vazirmatn = localFont({
  src: [300, 400, 500, 600, 700].map((weight) =>
    (["arabic", "latin", "latin-ext"] as const).map((subset) => {
      const source: FontSource = {
        path: `./assets/fonts/vazirmatn-${subset}-${weight}.woff2`,
        weight: String(weight),
        style: "normal",
        declarations: [
          {
            prop: "unicode-range",
            value: subset === "arabic" ? ARABIC : subset === "latin" ? LATIN : LATIN_EXT,
          },
        ],
      };
      return source;
    }),
  ).flat(),
  display: "swap",
  variable: "--font-text",
  fallback: ["sans-serif"],
});

/** Lalezar — display/headings only, weight 400 (§2.2). */
export const lalezar = localFont({
  src: (["arabic", "latin", "latin-ext"] as const).map((subset) => {
    const source: FontSource = {
      path: `./assets/fonts/lalezar-${subset}-400.woff2`,
      weight: "400",
      style: "normal",
      declarations: [
        {
          prop: "unicode-range",
          value: subset === "arabic" ? ARABIC : subset === "latin" ? LATIN : LATIN_EXT,
        },
      ],
    };
    return source;
  }),
  display: "swap",
  variable: "--font-display",
  fallback: ["sans-serif"],
});
