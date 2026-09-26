// PROTOTYPE data — mirrors the locked schema from wayfinder ticket #5
// (orders/payments/declarations, snapshots, Toman integers, 7-color palette,
// collections incl. `sets`, draft/published, inquiries w/ archived_at,
// settings KV, ordered channels, one promo). Fake values, in memory only.

export type OrderStatus =
  | "awaiting-payment" | "paid" | "in-progress" | "shipped" | "delivered"
  | "cancelled" | "cancelled-refunded";

export type PayPath = "gateway" | "card";
export type PayStatus =
  | "pending" | "verified" | "expired"          // gateway
  | "undeclared" | "declared" | "approved" | "rejected"; // card

export const fa = (n: number) => n.toLocaleString("fa-IR");
export const toman = (n: number) => `${fa(n)} تومان`;

export const STATUS_FA: Record<OrderStatus, string> = {
  "awaiting-payment": "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  "in-progress": "در حال بافت",
  shipped: "ارسال‌شده",
  delivered: "تحویل‌شده",
  cancelled: "لغوشده",
  "cancelled-refunded": "لغو و مسترد",
};
export const PAY_FA: Record<PayStatus, string> = {
  pending: "در جریان",
  verified: "تأییدشده",
  expired: "منقضی",
  undeclared: "اعلام‌نکرده",
  declared: "اعلام‌شده",
  approved: "تأیید پرداخت",
  rejected: "ردشده",
};

export interface Declaration { last4: string; trace?: string; at: string; outcome: "pending" | "approved" | "rejected"; reason?: string }
export interface Line { name: string; size: string; color: string; qty: number; unit: number }
export interface Order {
  code: string; customerName: string; phone: string;
  status: OrderStatus; createdAt: string;
  path: PayPath; payStatus: PayStatus;
  declaredAt?: string; authority?: string; refId?: string;
  lines: Line[]; subtotal: number; shipping: number; discount: number; total: number;
  promo?: { code: string; percent: number };
  address: { label: string; recipient: string; text: string; postal?: string };
  declarations?: Declaration[];
  tracking?: string; staffNote?: string;
}

// stale is COMPUTED from declaredAt — prototype fakes "now" = ۱۴۰۵/۰۷/۰۴ ۱۲:۰۰
export const NOW = new Date("2026-09-26T12:00:00+03:30");
export const isStale = (o: Order) =>
  o.path === "card" && o.payStatus === "declared" && !!o.declaredAt &&
  NOW.getTime() - new Date(o.declaredAt).getTime() > 72 * 3600 * 1000;

export const orders: Order[] = [
  {
    code: "GR7K2M", customerName: "مریم رستمی", phone: "09123456789",
    status: "awaiting-payment", createdAt: "1405/07/04 ۱۱:۳۱",
    path: "gateway", payStatus: "pending", authority: "A-8841…F2",
    lines: [{ name: "گلبار", size: "دو طبقه", color: "کرم", qty: 1, unit: 980000 }],
    subtotal: 980000, shipping: 90000, discount: 0, total: 1070000,
    address: { label: "خانه", recipient: "مریم رستمی", text: "تهران، ونک، خیابان ملاصدرا، پلاک ۴۲، واحد ۹", postal: "15046-12345" },
  },
  {
    code: "P9C4ZD", customerName: "سینا کاظمی", phone: "09351112233",
    status: "awaiting-payment", createdAt: "1405/07/04 ۰۹:۰۲",
    path: "card", payStatus: "declared", declaredAt: "2026-09-26T09:00:00+03:30",
    lines: [{ name: "دیده ۸۰", size: "۸۰ سانتی", color: "زیتونی", qty: 1, unit: 2850000 }],
    subtotal: 2850000, shipping: 0, discount: 285000, total: 2565000,
    promo: { code: "GEREH10", percent: 10 },
    declarations: [
      { last4: "5424", trace: "۱۲۳۴۵۶۷۸۹۰۱۲", at: "1405/07/03 ۱۸:۴۰", outcome: "rejected", reason: "مبلغ و چهاررقم با هیچ واریزی مطابقت نداشت" },
      { last4: "7138", trace: "۹۸۷۶۵۴۳۲۱۰۹۸", at: "1405/07/04 ۰۹:۰۲", outcome: "pending" },
    ],
    address: { label: "اداری", recipient: "سینا کاظمی", text: "کرج، مهستان، بلوار طالقانی، پل ۷، طبقه ۲" },
  },
  {
    code: "T3X8HN", customerName: "زهرا علوی", phone: "09122223333",
    status: "awaiting-payment", createdAt: "1405/07/01 ۱۴:۲۰",
    path: "card", payStatus: "declared", declaredAt: "2026-09-23T20:00:00+03:30", // 90h → STALE
    lines: [{ name: "سیسال ۱۱۰", size: "۱۱۰ سانتی", color: "گردویی", qty: 1, unit: 3900000 }],
    subtotal: 3900000, shipping: 0, discount: 0, total: 3900000,
    declarations: [{ last4: "9012", at: "1405/07/01 ۱۴:۲۰", outcome: "pending" }],
    address: { label: "خانه", recipient: "زهرا علوی", text: "تهران، سعادت‌آباد، میدان سرخ، پلاک ۱۵" },
    staffNote: "دوبار پیام داده؛ فردا چک کنم.",
  },
  {
    code: "K5M2VQ", customerName: "امیر نوری", phone: "09309998877",
    status: "paid", createdAt: "1405/07/03 ۱۰:۱۱",
    path: "gateway", payStatus: "verified", refId: "1122334455",
    lines: [
      { name: "پروانه", size: "۶۰ سانتی", color: "رسی", qty: 1, unit: 1870000 },
      { name: "گردنبند خاک", size: "بلند ۶۵", color: "ذغالی", qty: 2, unit: 820000 },
    ],
    subtotal: 3510000, shipping: 0, discount: 0, total: 3510000,
    address: { label: "خانه", recipient: "امیر نوری", text: "اصفهان، مرداویخ، کوچه یاس ۳، پلاک ۱۸" },
  },
  {
    code: "B8R4WD", customerName: "نگار شریفی", phone: "09126667788",
    status: "in-progress", createdAt: "1405/06/29 ۰۸:۵۰",
    path: "card", payStatus: "approved", declaredAt: "2026-09-19T08:50:00+03:30",
    lines: [{ name: "ست استثنا", size: "بزرگ", color: "کرم", qty: 1, unit: 5800000 }],
    subtotal: 5800000, shipping: 0, discount: 0, total: 5800000,
    declarations: [{ last4: "4471", trace: "۵۵۶۶۷۷۸۸۹۹۰۰۱۱", at: "1405/06/29 ۰۸:۵۰", outcome: "approved" }],
    address: { label: "خانه", recipient: "نگار شریفی", text: "شیراز، معالی‌آباد، بلوار زندگی، پلاک ۹۰" },
  },
  {
    code: "F2N7LX", customerName: "طاها مرادی", phone: "09193334455",
    status: "shipped", createdAt: "1405/06/22 ۱۷:۰۵",
    path: "gateway", payStatus: "verified", refId: "9988776655",
    lines: [{ name: "بند ۳تایی", size: "بلند", color: "شنی", qty: 1, unit: 2900000 }],
    subtotal: 2900000, shipping: 0, discount: 0, total: 2900000,
    tracking: "۱۲۳۴۵۶۷۸۹۰۱۲۳",
    address: { label: "خانه", recipient: "طاها مرادی", text: "تهران، نارمک، ۱۴ شرقی، پلاک ۲۲۰" },
  },
  {
    code: "V6Q9TB", customerName: "شیدا احمدی", phone: "09365556677",
    status: "cancelled", createdAt: "1405/07/02 ۲۳:۱۴",
    path: "gateway", payStatus: "expired", authority: "A-7710…C9",
    lines: [{ name: "جوجهکوکب", size: "متوسط ۲۲", color: "طبیعی", qty: 1, unit: 720000 }],
    subtotal: 720000, shipping: 90000, discount: 0, total: 810000,
    address: { label: "خانه", recipient: "شیدا احمدی", text: "تبریز، ولیعصر، روبروی پارک، پلاک ۷" },
  },
];

export interface Product {
  slug: string; name: string; subtitle: string; collection: string;
  price: number; compareAt?: number; stock: number;
  colors: string[]; sizes: { label: string; delta: number }[];
  status: "draft" | "published"; isNew: boolean; weightKg: number;
  image: string;
}
export const products: Product[] = [
  { slug: "dideh-80", name: "دیده ۸۰", subtitle: "تابلو دیواری هشتاد سانتی با بدنه موجی", collection: "wall", price: 2850000, compareAt: 3400000, stock: 6, colors: ["cream", "sand", "olive"], sizes: [{ label: "۶۰ سانتی", delta: -650000 }, { label: "۸۰ سانتی", delta: 0 }, { label: "۱۱۰ سانتی", delta: 980000 }], status: "published", isNew: true, weightKg: 1.2, image: "macrame-goa-large.jpg" },
  { slug: "golbar", name: "گلبار", subtitle: "گلآویز دو طبقه برای گلدان ۲۰", collection: "plant", price: 980000, stock: 18, colors: ["cream", "olive", "charcoal"], sizes: [{ label: "تکطبقه", delta: -320000 }, { label: "دو طبقه", delta: 0 }], status: "published", isNew: true, weightKg: 0.4, image: "hanging-plants-porch.jpg" },
  { slug: "set-khat", name: "ست استثنا", subtitle: "تابلو + دو گلآویز همرنگ، ست کامل", collection: "sets", price: 4700000, compareAt: 5600000, stock: 2, colors: ["cream", "clay"], sizes: [{ label: "استاندارد", delta: 0 }, { label: "بزرگ", delta: 1100000 }], status: "published", isNew: false, weightKg: 2.0, image: "macrame-hanger-set.jpg" },
  { slug: "safar-torbe", name: "سفر", subtitle: "توربچه گرهی با بند بلندی", collection: "decor", price: 1150000, stock: 0, colors: ["natural", "olive", "walnut"], sizes: [{ label: "کوچک", delta: 0 }, { label: "استاندارد", delta: 240000 }], status: "published", isNew: false, weightKg: 0.3, image: "macrame-collar-detail-a.jpg" },
  { slug: "panel-roudbar", name: "پنل رودبار", subtitle: "نمونهٔ پیش‌نویس — در انتظار عکس", collection: "textile", price: 3400000, stock: 0, colors: ["walnut"], sizes: [{ label: "۹۰×۹۰", delta: 0 }], status: "draft", isNew: false, weightKg: 2.6, image: "macrame-textile-panel.jpg" },
];

export const collections = [
  { slug: "wall", name: "تابلو دیواری", count: 3 },
  { slug: "plant", name: "گلآویز", count: 3 },
  { slug: "decor", name: "اکسسوری", count: 4 },
  { slug: "textile", name: "منسوج دیواری", count: 2 },
  { slug: "sets", name: "ست‌ها", count: 1 },
];
export const palette = [
  { slug: "cream", label: "کرم", hex: "#E8E0D2", count: 5 },
  { slug: "sand", label: "شنی", hex: "#C9B493", count: 1 },
  { slug: "olive", label: "زیتونی", hex: "#6E7B5E", count: 4 },
  { slug: "clay", label: "رسی", hex: "#A65A38", count: 2 },
  { slug: "natural", label: "طبیعی", hex: "#D6C6A8", count: 3 },
  { slug: "walnut", label: "گردویی", hex: "#5C4632", count: 3 },
  { slug: "charcoal", label: "ذغالی", hex: "#3B3936", count: 2 }, // merged with ink at seed
];

export const customers = [
  { name: "مریم رستمی", phone: "09123456789", orders: 1, spend: 1070000, last: "1405/07/04" },
  { name: "سینا کاظمی", phone: "09351112233", orders: 2, spend: 5400000, last: "1405/07/04" },
  { name: "امیر نوری", phone: "09309998877", orders: 1, spend: 3510000, last: "1405/07/03" },
  { name: "— (بی‌نام)", phone: "09122223333", orders: 1, spend: 3900000, last: "1405/07/01" },
];

export interface Inquiry {
  id: number; name: string; phone: string; email?: string;
  collection?: string; isBulk: boolean; deadline: string;
  dims?: string; colors: string[]; desc: string; sample: boolean;
  at: string; archivedAt?: string;
}
export const inquiries: Inquiry[] = [
  { id: 1, name: "پریا محمدی", phone: "09127778899", email: "priya@example.com", collection: "wall", isBulk: false, deadline: "تا دو هفته", dims: "قد دیوار ۲۴۰", colors: ["cream", "clay"], desc: "برای دیوار پشت مبل صورتمی می‌خوام، ارتفاعش تا ۱۴۰ باشه کافیه. عکس مرجع دارم، تو واتساپ می‌فرستم.", sample: true, at: "1405/07/04 ۱۰:۱۵" },
  { id: 2, name: "کافه رها", phone: "09301112233", isBulk: true, deadline: "برای تاریخ مشخص (در توضیح می‌نویسم)", colors: ["natural"], desc: "برای شعبه جدید ۱۲ تا گلآویز یک‌شکل نیاز داریم؛ تحویل تا ۱۵ آذر.", sample: false, at: "1405/07/03 ۱۶:۴۰" },
  { id: 3, name: "هدیه مرادی", phone: "09368887766", collection: "decor", isBulk: false, deadline: "عجله ندارم", colors: ["walnut", "olive"], desc: "ست گردنآویز دو تکه به عنوان هدیه؛ رنگ خاص مدنظرم تو فهرست نیست.", sample: false, at: "1405/07/02 ۰۹:۳۰" },
  { id: 4, name: "سمیرا تهرانی", phone: "09124445566", isBulk: false, deadline: "تا یک ماه", colors: ["cream"], desc: "تابلو برای سالن انتظار مطب دندانپزشکی؛ ابعاد ۱۶۰×۹۰.", sample: true, at: "1405/06/28 ۱۳:۰۰", archivedAt: "1405/07/01" },
];

export const articles = [
  { id: "knot-7", title: "هفت گرهای که همهچیز از آنها شروع میشود", tag: "آموزش", date: "1403/05/21" },
  { id: "choose-thread", title: "نخ ۳ یا ۵ میلی؟ راهنمای انتخاب نخ", tag: "متریال", date: "1403/06/02" },
  { id: "wall-map", title: "قبل از بافت، دیوار را اندازه بگیرید", tag: "نصب", date: "1403/06/18" },
  { id: "wash-care", title: "مکرومه را چطور تمیز نگه داریم", tag: "نگهداری", date: "1403/07/01" },
];
export const faqs = [
  "آیا نقش و ابعاد دقیقاً مثل عکس نمونه در می‌آید؟",
  "اگر دیوارم کنار اجاق باشد، چه نخ پیشنهاد می‌کنید؟",
  "نصب تابلو روی دیوار گچی چگونه است؟",
  "سفارش اختصاصی چقدر طول می‌کشد؟",
];

export const channels = [
  { type: "whatsapp", label: "واتساپ", value: "۰۹۱۲ ۳۴۵ ۶۷۸۹", enabled: true },
  { type: "telegram", label: "تلگرام", value: "@gereh_shop", enabled: true },
  { type: "phone", label: "تلفن", value: "۰۲۱ ۹۱۰۰ ۰۰۰۰", enabled: true },
  { type: "instagram", label: "اینستاگرام", value: "gereh.makrame", enabled: false },
];
export const settingsKv = [
  { key: "site.name", val: "گِرِه" },
  { key: "site.tagline", val: "گرههایی که خانه را گرم میکنند" },
  { key: "site.address", val: "تهران، شریعتی، کوچه گلستان، پلاک ۱۲" },
  { key: "site.hours", val: "شنبه تا چهارشنبه، ۱۰ تا ۱۸" },
  { key: "shipping.flat", val: "90000" },
  { key: "shipping.freeFrom", val: "300000" },
  { key: "promo", val: "GEREH10 · ۱۰٪ · فعال" },
];

export const NAV = [
  { key: "orders", fa: "سفارش‌ها", n: orders.length },
  { key: "inquiries", fa: "درخواست‌های بافت", n: inquiries.filter(i => !i.archivedAt).length },
  { key: "products", fa: "محصولات", n: products.length },
  { key: "taxonomy", fa: "دسته و رنگ", n: collections.length + palette.length },
  { key: "customers", fa: "مشتری‌ها", n: customers.length },
  { key: "content", fa: "مجله و پرسش‌ها", n: articles.length },
  { key: "settings", fa: "تنظیمات", n: channels.length },
] as const;
export type NavKey = (typeof NAV)[number]["key"] | "order";
