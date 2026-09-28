const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Convert Latin digits in number or string to Persian digits. */
export function toFa(n: number | string): string {
  return String(n).replace(/\d/g, (d) => FA_DIGITS[+d]);
}

/** Group thousands with Persian thousands separator (٬). */
export function groupNum(n: number | string): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
}

/** Format an integer Toman amount: e.g. "۱٬۲۰۰٬۰۰۰ تومان". */
export function formatToman(toman: number): string {
  return `${toFa(groupNum(Math.round(toman)))} تومان`;
}

/** Format integer Toman digits only: e.g. "۱٬۲۰۰٬۰۰۰". */
export function formatTomanDigits(toman: number): string {
  return toFa(groupNum(Math.round(toman)));
}

/** Slugify Persian product name for URL matching. */
export function slugify(name: string): string {
  return name.trim().replace(/\s+/g, "-");
}
