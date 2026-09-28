import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* گِرِه — Drizzle schema (SPEC §3).
   SQLite has no native enums: every constrained column is TEXT + a CHECK constraint,
   mirrored as a TS union so app code cannot spell an illegal state (ADR-0003).
   Money is integer Toman everywhere internal (SPEC §1); rial exists only at the
   gateway boundary.

   `customers` is declared before `orders` because orders carries a forward reference
   to it; the rest follow the SPEC §3 group order. */

/** Catalog collections — wall · plant · decor · textile · **sets** (SPEC §8). */
export const collections = sqliteTable("collections", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  desc: text("desc"),
  sort: integer("sort").notNull().default(0),
});

/** Shared color palette — 7 after the ink+charcoal merge (SPEC §8). */
export const colors = sqliteTable("colors", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  hex: text("hex").notNull(),
  sort: integer("sort").notNull().default(0),
});

/**
 * Products. `slug` is the Persian public URL name — unique, seed-generated,
 * staff-editable (CONTEXT.md). `rating`/`review_count` are decorative: there are no
 * reviews in v1.
 */
export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  subtitle: text("subtitle"),
  collectionId: text("collection_id").notNull().references(() => collections.id),

  // SPEC §1: money columns are integer Toman.
  priceToman: integer("price_toman").notNull(),
  compareAtToman: integer("compare_at_toman"),
  stock: integer("stock").notNull().default(0),

  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  dimensions: text("dimensions"),
  materials: text("materials"),
  care: text("care"),
  weave: text("weave"),
  weightKg: real("weight_kg"),
  madeIn: text("made_in"),
  handmade: integer("handmade", { mode: "boolean" }).notNull().default(true),
  isNew: integer("is_new", { mode: "boolean" }).notNull().default(false),

  // decorative — no reviews in v1
  rating: real("rating").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(0),

  description: text("description").notNull(),
  story: text("story"),
  sort: integer("sort").notNull().default(0),
});

/* ---- colors / sizes / images ------------------------------------------- */

/** product ↔ color — color never holds stock (SPEC §3). */
export const productColors = sqliteTable("product_colors", {
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  colorId: text("color_id").notNull().references(() => colors.id, { onDelete: "restrict" }),
});

/** product ↔ size — flat, label + delta; no variant matrix (SPEC §3). */
export const productSizes = sqliteTable("product_sizes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  deltaToman: integer("delta_toman").notNull().default(0),
  sort: integer("sort").notNull().default(0),
});

/**
 * Images. Path + alt + artist/license credits — attribution renders from these rows
 * (SPEC §10 item 6). 13 seed files land under `public/images` by the seed script.
 */
export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  path: text("path").notNull(),
  alt: text("alt").notNull(),
  artist: text("artist"),
  license: text("license"),
  width: integer("width"),
  height: integer("height"),
});

/** product ↔ image, sorted — first row is the hero (SPEC §3). */
export const productImages = sqliteTable("product_images", {
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  imageId: integer("image_id").notNull().references(() => images.id, { onDelete: "cascade" }),
  sort: integer("sort").notNull().default(0),
});

/* ---- people/auth ------------------------------------------------------- */
// Declared first: `orders` references `customers`.

/** Customers — phone-verified accounts. Phone unique `^09\d{9}$`. No deletion in v1. */
export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull().unique(),
  name: text("name"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/* ---- orders ------------------------------------------------------------ */

export const ORDER_STATUS = [
  "awaiting-payment",
  "paid",
  "in-progress",
  "shipped",
  "delivered",
  "cancelled",
  "cancelled-refunded",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 6-char random confusable-free code (no O/0/I/1), DB-checked, never id-derived.
  code: text("code").notNull().unique(),

  customerId: integer("customer_id").notNull().references(() => customers.id),
  status: text("status", { enum: ORDER_STATUS }).notNull().default("awaiting-payment"),

  // address snapshot — the address book row may change; the order must not.
  recipientName: text("recipient_name").notNull(),
  addressText: text("address_text").notNull(),
  postalCode: text("postal_code"),

  // SPEC §1: integer Toman.
  subtotalToman: integer("subtotal_toman").notNull(),
  shippingToman: integer("shipping_toman").notNull(),
  discountToman: integer("discount_toman").notNull().default(0),
  totalToman: integer("total_toman").notNull(),

  // promo snapshot — a later settings edit must not rewrite history.
  promoCode: text("promo_code"),
  promoPercent: integer("promo_percent"),

  trackingCode: text("tracking_code"),
  note: text("note"),

  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
});

/**
 * Order lines — soft FK `product_id` ON DELETE SET NULL plus frozen name/size/color/
 * price snapshots: a catalog edit must not silently rewrite a committed order.
 */
export const orderLines = sqliteTable("order_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),

  // frozen at order time
  name: text("name").notNull(),
  sizeLabel: text("size_label"),
  colorLabel: text("color_label"),
  unitPriceToman: integer("unit_price_toman").notNull(),
  qty: integer("qty").notNull(),
});

/* Payments — 1↔1 with the order (SPEC §3). Two paths (ADR-0004), so the card-to-card
   columns (last4 / trace / reject / staff note / declared_at / approved_at) live
   beside the gateway columns (authority / ref_id). */
export const PAYMENT_PATH = ["gateway", "card"] as const;
export type PaymentPath = (typeof PAYMENT_PATH)[number];

export const PAYMENT_STATUS = ["pending", "verified", "expired", "undeclared", "declared", "approved", "rejected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().unique().references(() => orders.id, { onDelete: "cascade" }),

  path: text("path", { enum: PAYMENT_PATH }).notNull(),
  status: text("status", { enum: PAYMENT_STATUS }).notNull(),

  // gateway (SPEC §5): authority stored on request, ref_id on verify.
  // amount is RIAL — the gateway boundary is the only place rial exists.
  authority: text("authority"),
  amountRial: integer("amount_rial"),
  refId: text("ref_id"),

  // card-to-card (SPEC §5): last 4 digits of the source card + bank trace code.
  last4: text("last4"),
  traceCode: text("trace_code"),
  rejectReason: text("reject_reason"),
  staffNote: text("staff_note"),
  declaredAt: integer("declared_at"),
  approvedAt: integer("approved_at"),
});

/** Declarations — full history including rejected attempts (CONTEXT.md). */
export const declarations = sqliteTable("declarations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  last4: text("last4").notNull(),
  traceCode: text("trace_code"),
  rejectedReason: text("rejected_reason"),
  rejectedAt: integer("rejected_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/* ---- custom orders ----------------------------------------------------- */
// A request to make a piece — captured and filed for staff, nothing more: no status,
// no customer-facing tracking, no on-site payment (CONTEXT.md, ADR-0004).

export const customOrderSubmissions = sqliteTable("custom_order_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  collectionId: text("collection_id").references(() => collections.id),
  isBulk: integer("is_bulk", { mode: "boolean" }).notNull().default(false),
  deadline: text("deadline"),
  dimensionsText: text("dimensions_text"),
  description: text("description").notNull(),
  wantsSample: integer("wants_sample", { mode: "boolean" }).notNull().default(false),
  ip: text("ip"),
  // the only lifecycle field (SPEC §6): archive keeps it searchable by phone.
  archivedAt: integer("archived_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

export const submissionColors = sqliteTable("submission_colors", {
  submissionId: integer("submission_id").notNull().references(() => customOrderSubmissions.id, { onDelete: "cascade" }),
  colorId: text("color_id").notNull().references(() => colors.id, { onDelete: "restrict" }),
});

/* ---- auth (SPEC §4) ---------------------------------------------------- */

/** Address book — capped at 5 in app code, no default (SPEC §3). */
export const customerAddresses = sqliteTable("customer_addresses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  recipientName: text("recipient_name").notNull(),
  text: text("text").notNull(),
  postalCode: text("postal_code"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/**
 * OTP codes. `phone` is TEXT, deliberately *not* an FK: the code precedes the
 * Customer row (implicit signup — SPEC §4). All throttle counters derive by counting
 * recent rows; there are no counter tables.
 */
export const otpCodes = sqliteTable("otp_codes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  codeSha256: text("code_sha256").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  ip: text("ip"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/** Staff — username + argon2id hash. No role column (SPEC §3). */
export const staffUsers = sqliteTable("staff_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/**
 * Sessions — one table, one cookie, one active identity per browser. Opaque 256-bit
 * token, hashed at rest; 30-day absolute expiry, no sliding; logout deletes the row.
 * Staff login replaces the customer identity on that browser.
 */
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenSha256: text("token_sha256").notNull().unique(),
  subjectType: text("subject_type", { enum: ["customer", "staff"] }).notNull(),
  subjectId: integer("subject_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
});

/* ---- content (SPEC §3) ------------------------------------------------- */
// Article bodies are pulled out of `.design/about.html`'s inline script at seed.

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body").notNull(),
  tag: text("tag").notNull(),
  date: text("date").notNull(),
  readMin: integer("read_min").notNull().default(5),
  imageId: integer("image_id").references(() => images.id, { onDelete: "set null" }),
  sort: integer("sort").notNull().default(0),
});

export const faqItems = sqliteTable("faq_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  sort: integer("sort").notNull().default(0),
});

/**
 * Site settings — JSON key→value, written wholesale by the admin. Values that were
 * hard-coded in the prototype (GEREH10 promo, flat shipping) live here instead, so
 * the owner edits them from the panel and never in code (SPEC §8).
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

/**
 * Contact channels — the shop's reachable lines (CONTEXT.md). `type` has no enum
 * namespace so the label below is the only authority on what a row means.
 * Type `phone|whatsapp|telegram|instagram`; label shown to customers.
 */
export const contactChannels = sqliteTable("contact_channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ["phone", "whatsapp", "telegram", "instagram"] }).notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  sort: integer("sort").notNull().default(0),
});
