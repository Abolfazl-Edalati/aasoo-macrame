/* scripts/seed.ts — bring a fresh SQLite DB to life (SPEC §3, §8).
 *
 * Idempotent: skips when products already exist. Maps `.design/assets/data.js` to the
 * DB with every SPEC §8 fix applied *in code* (single collection axis, new `sets`
 * collection, 7-color palette after the ink+charcoal merge, 12 products, article +
 * FAQ bodies pulled out of about.html, contact info into settings + contact_channels,
 * GEREH10 and flat shipping as settings values).
 *
 * The `.design` tree is never imported by the app (DESIGN.md §9); data.js is an IIFE
 * that assigns window.GEREH_DATA, so it is evaluated with a window stub instead.
 *
 * Run with: pnpm db:seed
 */
import "dotenv/config";
import Database from "better-sqlite3";
import { resolve } from "node:path";
import { cpSync, readFileSync } from "node:fs";

import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  collections,
  colors,
  products,
  productColors,
  productSizes,
  images,
  productImages,
  articles,
  faqItems,
  settings,
  contactChannels,
  staffUsers,
} from "@/db/schema";
import { hash } from "@node-rs/argon2";

// ────────────────────────────── the seed data, fixed in code ────────────────────

/** SPEC §8 fix: 8 raw colors − the ink/charcoal merge = 7. */
const INK_CHARCOAL_MERGED_ID = "ink";

const PALETTE: { id: string; label: string; hex: string }[] = [
  { id: "cream", label: "کرم", hex: "#E8E0D2" },
  { id: "sand", label: "شنی", hex: "#C9B493" },
  { id: "natural", label: "طبیعی", hex: "#D6C6A8" },
  { id: "olive", label: "زیتونی", hex: "#6E7B5E" },
  { id: "walnut", label: "گردویی", hex: "#5C4632" },
  { id: "clay", label: "رسی", hex: "#A65A38" },
  { id: INK_CHARCOAL_MERGED_ID, label: "قهوه‌ای", hex: "#3B2F26" },
];

/**
 * SPEC §8 fix: single `collection_id` axis.
 * - `rostam-hanger` → plant (it is a hanger, not a wall piece)
 * - `set-khat` → sets (new collection)
 * The prototype also carried a `category` field; it is dropped, not ported.
 */
const COLLECTION_REMAP: Record<string, string> = {
  "rostam-hanger": "plant",
  "set-khat": "sets",
};

const COLLECTIONS: { id: string; name: string; desc: string }[] = [
  { id: "wall", name: "تابلو دیواری", desc: "بافت‌های بزرگ برای مرکز دیوار" },
  { id: "plant", name: "گل‌آویز", desc: "آویز گلدان با گره‌های موج‌دار" },
  { id: "decor", name: "اکسسوری", desc: "قطعه‌های کوچک دکوری و گردن‌آویز" },
  { id: "textile", name: "منسوج دیواری", desc: "پنل‌های بافته‌شده برای فضا" },
  { id: "sets", name: "ست", desc: "تابلو و گل‌آویز هم‌رنگ، بافت یک‌جا" },
];

// ──────────────────────────── FAQ, lifted out of about.html ────────────────────
// SPEC §8: article + FAQ bodies are pulled out of about.html's page script into tables.

const FAQ: { question: string; answer: string }[] = [
  {
    question: "آیا کار دقیقاً مثل عکس است؟",
    answer:
      "نقش و ابعاد بله؛ اما چون همه‌ی گره‌ها دستی‌اند، فشار نخ و دهانه‌ی منگوله‌ها کمی فرق می‌کند. اگر کار را در خانه‌ی خودتان می‌بینید، قبل از پرداخت عکس همان قطعه را می‌فرستم.",
  },
  {
    question: "برای فضای مرطوب مثل آشپزخانه مناسب است؟",
    answer:
      "پنبه و کنف رطوبت مستقیم را دوست ندارند. اگر دیوار شما کنار اجاق یا سینک است، نخ آکرولیک پیشنهاد می‌کنم که قابل شست‌وشو است و رنگش در برابر بخار ثبات بهتری دارد.",
  },
  {
    question: "چطور نصب کنم که کج نشود؟",
    answer:
      "برای کارهای زیر دو کیلو، یک پیچ و ریل کافی است. برای کارهای سنگین‌تر، دو پیچ در دو سر میچو بزنید و با تراز لیزری یا یک لیوان آب روی میز، افقی بودن را چک کنید. کارتنگی نصب داخل بسته هست.",
  },
  {
    question: "مدت تحویل چقدر است؟",
    answer:
      "کارهای آماده: ۲ تا ۵ روز کاری. سفارش اختصاصی با ابعاد دلخواه: بسته به اندازه، بین ۱۰ تا ۲۵ روز کاری — بعد از تأیید طرح و پیش‌پرداخت، در نوبت بافت قرار می‌گیرید.",
  },
  {
    question: "امکان مرجوعی هست؟",
    answer:
      "کارهای آماده تا ۷ روز، در صورتی که استفاده نشده و بسته‌بندی سالم باشد. سفارش اختصاصی چون برای اندازه و رنگ دلخواه شما بافته می‌شود، مرجوعی ندارد — مگر در نقص بافت.",
  },
];

/** Article bodies — the `FULL` map in about.html's inline script, now table rows. */
const ARTICLE_BODIES: Record<string, string> = {
  "knot-7":
    "هفت گره‌ای که همه‌چیز از آن‌ها شروع می‌شود: کوله‌پشتی (Lark's head)، گره مربعی (Square)، نیم‌گره (Half)، مارپیچ (Spiral)، گره تار (Wrapping)، گره دوتایی (Double half hitch) و جوزفین. برای هر کدام در شکل روبرو، تعداد نخ و جهت گره نوشته شده. نکته‌ای که در کلاس‌ها تکرار می‌کنم: فشار دست را ثابت نگه دارید — نصف قبحِ کار به همین مربوط است، نه به نوع گره.",
  "choose-thread":
    "نخ ۳ میلی‌متر برای گردن‌آویز و کارهای ظریف؛ ۴ میلی‌متر برای گل‌آویز و تابلوی متوسط؛ ۵ میلی‌متر و بالاتر برای تابلوی درشت و پنل‌های عایق صوت. نخ پنبه نرم‌تر است و منگوله‌ی پُرتر می‌دهد؛ کنف زبرتر، مات‌تر، و برای سبک بوهو خاکی مناسب‌تر. اگر تازه‌کارید، پنبهٔ ۴ میلی را انتخاب کنید که خطا را می‌بخشد.",
  "wall-map":
    "اول قدِ واقعی دیوار را اندازه بگیرید، نه فاصلهٔ بین دو چیز دیگر. برای تابلو بالای مبل، پایین کار باید ۱۵ تا ۲۰ سانتی‌متر بالای پشتی مبل باشد. برای گل‌آویز کنار پنجره، گلدان نباید نور را بگیرد. اگر سقف بلند است، کار بلند کوتاه نمی‌خواند — در اتاق با سقف ۲۴۰، تابلوی ۱۹۰ سانتی فضا را خفه می‌کند.",
  "wash-care":
    "هر دو هفته یک بار، گردگیری با دستمال خشک یا سشوار روی بادِ سرد. اگر لکه شد، فقط همان نقطه با آب سرد و صابون خیلی رقیق، بدون مالش؛ بعد آویزان کردن تا خودش خشک شود. هرگز در ماشین ناندازید و هرگز رول نکنید؛ گره‌ها شکل خودشان را از دست می‌دهند. آفتاب مستقیمِ طولانی، نخ کرم را زرد می‌کند.",
};

/** Custom-order form options that lived in contact.html's markup, now seed rows. */
const FORM_OPTIONS = {
  collection: [
    "تابلو دیواری",
    "گل‌آویز",
    "منسوج دیواری / پنل",
    "اکسسوری (گردن‌آویز، توربچه)",
    "سفارش عمده (کافه / هتل / هدیه)",
  ],
  deadline: ["عجله ندارم", "تا دو هفته", "تا یک ماه", "برای تاریخ مشخص (در توضیح می‌نویسم)"],
} as const;

/** Contact channels — SPEC §8: hand-written contact.html info → settings + rows. */
const CHANNELS: { type: "phone" | "whatsapp" | "telegram" | "instagram"; label: string; value: string }[] = [
  { type: "phone", label: "تلفن و واتساپ", value: "09123456789" },
  { type: "instagram", label: "اینستاگرام", value: "gereh.makrame" },
];

/** SPEC §8: `GEREH10` and flat 90,000 shipping are settings values, not code. */
const SITE_SETTINGS = {
  name: "گِرِه",
  tagline: "گره‌هایی که خانه را گرم می‌کنند",
  phone: "۰۹۱۲ ۳۴۵ ۶۷۸۹",
  address: "تهران، خیابان شریعتی، کوچه‌ی گلستان، پلاک ۱۲",
  hours: "شنبه تا چهارشنبه، ۱۰ تا ۱۸",
  shippingFlatToman: "90000",
  shippingFreeFromToman: "300000",
  promoCode: "GEREH10",
  promoPercent: "10",
  promoEnabled: "true",
  customOrderCollection: JSON.stringify(FORM_OPTIONS.collection),
  customOrderDeadline: JSON.stringify(FORM_OPTIONS.deadline),
} as const;

type SeedImage = { src: string; w: number; h: number; alt: string };
type SeedProduct = {
  id: string;
  name: string;
  subtitle: string;
  priceTomans: number;
  compareAtTomans: number;
  collection: string;
  sizes: { id: string; label: string; delta: number }[];
  colors: { id: string; label: string; hex: string }[];
  stock: number;
  materials: string;
  care: string;
  weave: string;
  weightKg: number;
  dimensions: string;
  madeIn: string;
  handmade: boolean;
  isNew: boolean;
  description: string;
  story: string;
  rating: number;
  reviews: number;
  images: SeedImage[];
};
type SeedArticle = {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readMin: number;
  image: SeedImage;
  tag: string;
};
type SeedData = {
  products: SeedProduct[];
  collections: { id: string; name: string; desc: string }[];
  articles: SeedArticle[];
  site: Record<string, unknown> & {
    credits: { file: string; artist: string; license: string }[];
  };
};

/**
 * Load `.design/assets/data.js` without importing the prototype into the app
 * (DESIGN.md §9). It is an IIFE assigning `window.GEREH_DATA`; a `window` stub makes
 * it evaluable in Node.
 */
function loadSeedData(): SeedData {
  const dataJs = readFileSync(
    resolve(process.cwd(), ".design/assets/data.js"),
    "utf8",
  );
  const sandbox: { window: Record<string, unknown> } = { window: {} };
  new Function("window", `"use strict";${dataJs}`)(sandbox.window);
  return sandbox.window.GEREH_DATA as SeedData;
}

/** Persian slug from the product name; the prototype's latin ids stay internal. */
function slugify(name: string): string {
  return name.trim().replace(/\s+/g, "-");
}

async function main() {
  const data = loadSeedData();
  const sqlite = new Database(resolve(process.env.DATABASE_PATH ?? "gereh.db"));
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite);

  // Bring the schema up first: a fresh file has no tables. `migrate` is itself
  // idempotent (it tracks applied steps in the migrations journal), so running it
  // against an already-current DB is a no-op.
  migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("seed: schema applied");

  // Idempotent — the catalog is already there, so nothing is rewritten (SPEC §3).
  const existing = db.select().from(products).limit(1).all();
  if (existing.length > 0) {
    console.log("seed: products already exist — nothing to do.");
    sqlite.close();
    return;
  }

  console.log("seed: starting full seed…");

  // 1) collections + the shared palette
  db.insert(collections)
    .values(COLLECTIONS)
    .run();
  db.insert(colors)
    .values(
      PALETTE.map((c, i) => ({ ...c, sort: i })),
    )
    .run();

  // 2) copy the 13 images + credits.json into public/images (SPEC §10 item 6)
  const imgSrc = resolve(process.cwd(), ".design/assets/img");
  const imgDst = resolve(process.cwd(), "public/images");
  cpSync(imgSrc, imgDst, { recursive: true });
  const credits = JSON.parse(
    readFileSync(resolve(imgDst, "credits.json"), "utf8"),
  ) as Record<string, { artist: string; license: string }>;

  const imageIds = new Map<string, number>();
  const imageRows = Object.keys(credits).map((file, i) => {
    const dims = data.products
      .flatMap((p) => p.images)
      .find((img) => img.src.endsWith(file));
    const row = {
      path: `/images/${file}`,
      alt: dims?.alt ?? file,
      artist: credits[file].artist,
      license: credits[file].license,
      width: dims?.w ?? null,
      height: dims?.h ?? null,
    };
    imageIds.set(file, i + 1);
    return row;
  });
  db.insert(images).values(imageRows).run();

  // 3) products — with every SPEC §8 fix applied
  // SPEC §8 asserts data.js holds 12 products, but it holds 13; the file is truth and
  // the spec needs an amendment (flagged on the ticket).
  console.log(`seed: writing ${data.products.length} products`);
  let sort = 0;
  for (const p of data.products) {
    const collectionId = COLLECTION_REMAP[p.id] ?? p.collection;

    const [product] = db
      .insert(products)
      .values({
        slug: slugify(p.name),
        name: p.name,
        subtitle: p.subtitle,
        collectionId,
        priceToman: p.priceTomans,
        compareAtToman: p.compareAtTomans || null,
        stock: p.stock,
        status: "published",
        dimensions: p.dimensions,
        materials: p.materials,
        care: p.care,
        weave: p.weave,
        weightKg: p.weightKg,
        madeIn: p.madeIn,
        handmade: p.handmade,
        isNew: p.isNew,
        rating: p.rating,
        reviewCount: p.reviews,
        description: p.description,
        story: p.story,
        sort: sort++,
      })
      .returning({ id: products.id })
      .all();

    // colors — the palette is shared, so only the ids are stored and charcoal folds
    // into ink (SPEC §8).
    db.insert(productColors)
      .values(
        [...new Set(p.colors.map((c) => c.id))]
          .filter((id) => id === "charcoal" || PALETTE.some((p2) => p2.id === id))
          .map((colorId) => ({
            productId: product.id,
            colorId: colorId === "charcoal" ? INK_CHARCOAL_MERGED_ID : colorId,
          })),
      )
      .run();

    db.insert(productSizes)
      .values(
        p.sizes.map((s, i) => ({
          productId: product.id,
          label: s.label,
          deltaToman: s.delta,
          sort: i,
        })),
      )
      .run();

    db.insert(productImages)
      .values(
        p.images.map((img, i) => {
          const file = img.src.slice(img.src.lastIndexOf("/") + 1);
          return {
            productId: product.id,
            imageId: imageIds.get(file)!,
            sort: i, // first = hero
          };
        }),
      )
      .run();
  }

  // 4) articles + FAQ — bodies pulled out of about.html (SPEC §8)
  db.insert(articles)
    .values(
      data.articles.map((a, i) => {
        const file = a.image.src.slice(a.image.src.lastIndexOf("/") + 1);
        return {
          id: a.id,
          title: a.title,
          excerpt: a.excerpt,
          body: ARTICLE_BODIES[a.id] ?? "",
          tag: a.tag,
          date: a.date,
          readMin: a.readMin,
          imageId: imageIds.get(file)!,
          sort: i,
        };
      }),
    )
    .run();

  db.insert(faqItems)
    .values(FAQ.map((f, i) => ({ ...f, sort: i })))
    .run();

  // 5) settings + contact channels (SPEC §8)
  db.insert(settings)
    .values(
      Object.entries(SITE_SETTINGS).map(([key, value]) => ({ key, value: String(value) })),
    )
    .run();
  db.insert(contactChannels)
    .values(CHANNELS.map((c, i) => ({ ...c, sort: i })))
    .run();

  // 6) first staff user (SPEC §3)
  const username = process.env.SEED_ADMIN_USERNAME;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error(
      "seed: SEED_ADMIN_USERNAME / SEED_ADMIN_PASSWORD must be set (see .env.example)",
    );
  }
  const passwordHash = await hash(password);
  db.insert(staffUsers)
    .values({ username, passwordHash, displayName: "کارگاه" })
    .run();

  console.log("seed: done.");
  sqlite.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

