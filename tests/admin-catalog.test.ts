import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "@/db/schema";
import { generateUlid } from "@/lib/ulid";
import {
  getAdminCollections,
  createAdminCollection,
  updateAdminCollection,
  deleteAdminCollection,
  getAdminColors,
  createAdminColor,
  updateAdminColor,
  checkColorInUse,
  deleteAdminColor,
} from "@/lib/admin/taxonomy";
import {
  getAdminProductsList,
  getAdminProductDetail,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "@/lib/admin/products";
import {
  getAdminCustomersList,
  getAdminCustomerDetail,
} from "@/lib/admin/customers";
import {
  getAdminCustomOrdersList,
  adminArchiveCustomOrder,
  adminDeleteCustomOrder,
} from "@/lib/admin/custom-orders";
import {
  getAdminSettings,
  saveAdminSettingsWholesale,
} from "@/lib/admin/settings";

describe("Admin Catalog, Taxonomy, Customers, Inquiries & Settings", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeEach(() => {
    sqlite = new Database(":memory:");
    const migrationSql = fs.readFileSync(
      path.join(process.cwd(), "drizzle", "0000_robust_iceman.sql"),
      "utf-8"
    );
    const statements = migrationSql.split("--> statement-breakpoint");
    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        sqlite.exec(trimmed);
      }
    }
    sqlite.pragma("foreign_keys = ON");
    db = drizzle(sqlite, { schema });

    // Seed test collections
    db.insert(schema.collections)
      .values([
        { id: "wall", name: "دیوارکوب", desc: "دیوارکوب‌های گره‌بافت", sort: 1 },
        { id: "plant", name: "آویز گلدان", desc: "آویز گلدان مکرومه", sort: 2 },
      ])
      .run();

    // Seed test colors
    db.insert(schema.colors)
      .values([
        { id: "cream", label: "کرم طبیعی", hex: "#F4F0EA", sort: 1 },
        { id: "sage", label: "سبز مریم‌گلی", hex: "#8A9A86", sort: 2 },
        { id: "clay", label: "خاک رس", hex: "#C47B62", sort: 3 },
      ])
      .run();

    // Seed test image
    db.insert(schema.images)
      .values([
        {
          id: 1,
          path: "/images/seed-1.webp",
          alt: "تصویر تست مکرومه",
          artist: "استودیو گره",
          license: "اختصاصی",
          width: 800,
          height: 600,
        },
      ])
      .run();
  });

  /* ------------------------------------------------------------------------ */
  /* ULID generator                                                           */
  /* ------------------------------------------------------------------------ */
  describe("ULID Generator", () => {
    test("generates 26-character Crockford Base32 strings", () => {
      const id1 = generateUlid();
      const id2 = generateUlid();
      assert.equal(id1.length, 26);
      assert.equal(id2.length, 26);
      assert.match(id1, /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/);
      assert.notEqual(id1, id2);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Collections CRUD                                                         */
  /* ------------------------------------------------------------------------ */
  describe("Collections CRUD", () => {
    test("lists collections with product counts", () => {
      const list = getAdminCollections({ db });
      assert.equal(list.length, 2);
      assert.equal(list[0].id, "wall");
      assert.equal(list[0].productCount, 0);
    });

    test("creates and updates a collection", () => {
      createAdminCollection(
        { id: "decor", name: "تزیینات", desc: "آویز و تزیینات", sort: 3 },
        { db }
      );
      let list = getAdminCollections({ db });
      assert.equal(list.length, 3);
      const decor = list.find((c) => c.id === "decor");
      assert.ok(decor);
      assert.equal(decor.name, "تزیینات");

      updateAdminCollection("decor", { name: "دکوراسیون خانه", sort: 5 }, { db });
      list = getAdminCollections({ db });
      const updated = list.find((c) => c.id === "decor");
      assert.equal(updated?.name, "دکوراسیون خانه");
      assert.equal(updated?.sort, 5);
    });

    test("deletes an unused collection", () => {
      createAdminCollection({ id: "sets", name: "ست‌ها", sort: 4 }, { db });
      deleteAdminCollection("sets", { db });
      const list = getAdminCollections({ db });
      assert.equal(list.find((c) => c.id === "sets"), undefined);
    });

    test("refuses to delete a collection when in use by products", () => {
      db.insert(schema.products)
        .values({
          id: 1,
          slug: "test-product",
          name: "محصول تست",
          collectionId: "wall",
          priceToman: 100000,
          description: "توضیح",
          status: "published",
        })
        .run();

      assert.throws(
        () => deleteAdminCollection("wall", { db }),
        /COLLECTION_IN_USE/
      );
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Color Management & Reassign-Before-Delete                                */
  /* ------------------------------------------------------------------------ */
  describe("Color Management with Reassign-Before-Delete UX", () => {
    test("creates and updates a color in shared palette", () => {
      createAdminColor(
        { id: "mustard", label: "خردلی", hex: "#D4A373", sort: 4 },
        { db }
      );
      let colors = getAdminColors({ db });
      const mustard = colors.find((c) => c.id === "mustard");
      assert.ok(mustard);
      assert.equal(mustard.label, "خردلی");

      updateAdminColor("mustard", { label: "خردلی روشن", hex: "#E9C46A" }, { db });
      colors = getAdminColors({ db });
      const updated = colors.find((c) => c.id === "mustard");
      assert.equal(updated?.label, "خردلی روشن");
      assert.equal(updated?.hex, "#E9C46A");
    });

    test("lists colors with accurate usage counts across products and inquiries", () => {
      // Create product referencing 'cream'
      db.insert(schema.products)
        .values({
          id: 1,
          slug: "test-wall",
          name: "دیوارکوب",
          collectionId: "wall",
          priceToman: 150000,
          description: "توضیح",
        })
        .run();
      db.insert(schema.productColors)
        .values({ productId: 1, colorId: "cream" })
        .run();

      // Create custom order submission referencing 'cream'
      db.insert(schema.customOrderSubmissions)
        .values({
          id: 1,
          name: "مشتری تست",
          phone: "09121111111",
          description: "سفارش سفارشی",
        })
        .run();
      db.insert(schema.submissionColors)
        .values({ submissionId: 1, colorId: "cream" })
        .run();

      const colors = getAdminColors({ db });
      const cream = colors.find((c) => c.id === "cream");
      const sage = colors.find((c) => c.id === "sage");
      assert.equal(cream?.usageCount, 2);
      assert.equal(sage?.usageCount, 0);

      const usage = checkColorInUse("cream", { db });
      assert.equal(usage.inUse, true);
      assert.equal(usage.productCount, 1);
      assert.equal(usage.submissionCount, 1);
    });

    test("deletes an unused color directly", () => {
      deleteAdminColor("clay", { db });
      const colors = getAdminColors({ db });
      assert.equal(colors.find((c) => c.id === "clay"), undefined);
    });

    test("refuses to delete an in-use color when no replacement is specified", () => {
      db.insert(schema.products)
        .values({
          id: 1,
          slug: "wall-item",
          name: "دیوارکوب تست",
          collectionId: "wall",
          priceToman: 150000,
          description: "توضیح",
        })
        .run();
      db.insert(schema.productColors)
        .values({ productId: 1, colorId: "cream" })
        .run();

      assert.throws(
        () => deleteAdminColor("cream", { db }),
        /COLOR_IN_USE/
      );
    });

    test("reassigns products and submissions before deleting in-use color without cascades", () => {
      db.insert(schema.products)
        .values({
          id: 1,
          slug: "wall-item",
          name: "دیوارکوب تست",
          collectionId: "wall",
          priceToman: 150000,
          description: "توضیح",
        })
        .run();
      db.insert(schema.productColors)
        .values({ productId: 1, colorId: "cream" })
        .run();

      db.insert(schema.customOrderSubmissions)
        .values({
          id: 1,
          name: "مشتری تست",
          phone: "09121111111",
          description: "سفارش سفارشی",
        })
        .run();
      db.insert(schema.submissionColors)
        .values({ submissionId: 1, colorId: "cream" })
        .run();

      // Delete 'cream' with reassignment to 'sage'
      deleteAdminColor("cream", { db, replacementColorId: "sage" });

      // Cream should be gone
      const colors = getAdminColors({ db });
      assert.equal(colors.find((c) => c.id === "cream"), undefined);

      // Product 1 should now reference 'sage'
      const prodColors = db
        .select()
        .from(schema.productColors)
        .where(eq(schema.productColors.productId, 1))
        .all();
      assert.equal(prodColors.length, 1);
      assert.equal(prodColors[0].colorId, "sage");

      // Submission 1 should now reference 'sage'
      const subColors = db
        .select()
        .from(schema.submissionColors)
        .where(eq(schema.submissionColors.submissionId, 1))
        .all();
      assert.equal(subColors.length, 1);
      assert.equal(subColors[0].colorId, "sage");
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Products CRUD & Details                                                  */
  /* ------------------------------------------------------------------------ */
  describe("Products CRUD & Editor Data", () => {
    test("creates product with draft status, Persian slug, sizes with delta_toman, colors and images", () => {
      const created = createAdminProduct(
        {
          name: "آویز دیواری پر سیمرغ",
          slug: "آویز-دیواری-پر-سیمرغ",
          subtitle: "بافت لطیف با نخ طبیعی پنبه",
          collectionId: "wall",
          priceToman: 650000,
          compareAtToman: 750000,
          stock: 8,
          status: "draft",
          dimensions: "عرض ۶۰ سانتیمتر، طول ۹۰ سانتیمتر",
          materials: "نخ پنبه ۱۰۰٪ ارگانیک، چوب گردو",
          care: "گردگیری ملایم با برس نرم",
          weave: "گره مربعی و خفت",
          weightKg: 1.2,
          madeIn: "کارگاه گره اصفهان",
          handmade: true,
          isNew: true,
          description: "توضیح کامل محصول و نحوه بافت",
          story: "داستان الهام‌بخش این اثر از نقوش اسلیمی",
          sizes: [
            { label: "استاندارد (۶۰×۹۰)", deltaToman: 0, sort: 1 },
            { label: "بزرگ (۸۰×۱۲۰)", deltaToman: 200000, sort: 2 },
          ],
          colorIds: ["cream", "sage"],
          images: [{ imageId: 1, sort: 0 }],
        },
        { db }
      );

      assert.ok(created.id > 0);
      assert.equal(created.slug, "آویز-دیواری-پر-سیمرغ");
      assert.equal(created.status, "draft");
      assert.equal(created.isNew, true);

      // Verify product detail
      const detail = getAdminProductDetail(created.id, { db });
      assert.ok(detail);
      assert.equal(detail.name, "آویز دیواری پر سیمرغ");
      assert.equal(detail.dimensions, "عرض ۶۰ سانتیمتر، طول ۹۰ سانتیمتر");
      assert.equal(detail.priceToman, 650000);
      assert.equal(detail.compareAtToman, 750000);
      assert.equal(detail.sizes.length, 2);
      assert.equal(detail.sizes[1].deltaToman, 200000);
      assert.equal(detail.colors.length, 2);
      assert.equal(detail.images.length, 1);
      assert.equal(detail.images[0].path, "/images/seed-1.webp");
    });

    test("enforces Persian slug uniqueness", () => {
      createAdminProduct(
        {
          name: "محصول ۱",
          slug: "محصول-یکتا",
          collectionId: "wall",
          priceToman: 100000,
          description: "توضیح",
          status: "published",
        },
        { db }
      );

      assert.throws(
        () =>
          createAdminProduct(
            {
              name: "محصول ۲",
              slug: "محصول-یکتا",
              collectionId: "wall",
              priceToman: 120000,
              description: "توضیح دیگر",
              status: "draft",
            },
            { db }
          ),
        /SLUG_ALREADY_EXISTS/
      );
    });

    test("updates product status from draft to published, modifies sizes, and updates hero image", () => {
      // Add second image
      db.insert(schema.images)
        .values({
          id: 2,
          path: "/images/seed-2.webp",
          alt: "تصویر دوم",
        })
        .run();

      const created = createAdminProduct(
        {
          name: "آویز گلدان ساده",
          slug: "آویز-گلدان-ساده",
          collectionId: "plant",
          priceToman: 250000,
          stock: 4,
          status: "draft",
          description: "توضیح اولیه",
          sizes: [{ label: "کوچک", deltaToman: 0, sort: 1 }],
          colorIds: ["cream"],
          images: [{ imageId: 1, sort: 0 }],
        },
        { db }
      );

      // Publish product and make image 2 the hero
      updateAdminProduct(
        created.id,
        {
          name: "آویز گلدان ساده تک‌رشته",
          slug: "آویز-گلدان-تک‌رشته",
          collectionId: "plant",
          priceToman: 280000,
          stock: 10,
          status: "published",
          description: "توضیح ویراسته‌شده",
          sizes: [
            { label: "کوچک (۵۰ سانت)", deltaToman: 0, sort: 1 },
            { label: "بلند (۱۰۰ سانت)", deltaToman: 50000, sort: 2 },
          ],
          colorIds: ["sage"],
          images: [
            { imageId: 2, sort: 0 }, // hero
            { imageId: 1, sort: 1 },
          ],
        },
        { db }
      );

      const updated = getAdminProductDetail(created.id, { db });
      assert.ok(updated);
      assert.equal(updated.name, "آویز گلدان ساده تک‌رشته");
      assert.equal(updated.status, "published");
      assert.equal(updated.stock, 10);
      assert.equal(updated.sizes.length, 2);
      assert.equal(updated.sizes[1].label, "بلند (۱۰۰ سانت)");
      assert.equal(updated.colors.length, 1);
      assert.equal(updated.colors[0].id, "sage");
      assert.equal(updated.images[0].imageId, 2); // Hero is now image 2
      assert.equal(updated.images[1].imageId, 1);
    });

    test("filters products list by collection, status and search query", () => {
      createAdminProduct(
        {
          name: "دیوارکوب ماندالا",
          slug: "دیوارکوب-ماندالا",
          collectionId: "wall",
          priceToman: 500000,
          stock: 3,
          status: "published",
          description: "توضیح",
        },
        { db }
      );
      createAdminProduct(
        {
          name: "آویز گیاهی مدرن",
          slug: "آویز-گیاهی-مدرن",
          collectionId: "plant",
          priceToman: 300000,
          stock: 0,
          status: "draft",
          description: "توضیح",
        },
        { db }
      );

      const all = getAdminProductsList({}, { db });
      assert.equal(all.length, 2);

      const wallOnly = getAdminProductsList({ collectionId: "wall" }, { db });
      assert.equal(wallOnly.length, 1);
      assert.equal(wallOnly[0].slug, "دیوارکوب-ماندالا");

      const draftOnly = getAdminProductsList({ status: "draft" }, { db });
      assert.equal(draftOnly.length, 1);
      assert.equal(draftOnly[0].slug, "آویز-گیاهی-مدرن");

      const searched = getAdminProductsList({ search: "ماندالا" }, { db });
      assert.equal(searched.length, 1);
      assert.equal(searched[0].name, "دیوارکوب ماندالا");
    });

    test("deletes product and its size/color associations cleanly", () => {
      const created = createAdminProduct(
        {
          name: "محصول حذفی",
          slug: "محصول-حذفی",
          collectionId: "wall",
          priceToman: 100000,
          stock: 1,
          description: "توضیح",
          sizes: [{ label: "تک‌سایز", deltaToman: 0, sort: 1 }],
          colorIds: ["cream"],
        },
        { db }
      );

      deleteAdminProduct(created.id, { db });
      const detail = getAdminProductDetail(created.id, { db });
      assert.equal(detail, null);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Customers & Order History                                                */
  /* ------------------------------------------------------------------------ */
  describe("Customers Profile & Orders List", () => {
    test("lists customers with order count and total spent, with phone search", () => {
      db.insert(schema.customers)
        .values([
          { id: 1, phone: "09123456789", name: "مریم میرزاخانی" },
          { id: 2, phone: "09359876543", name: "پروین اعتصامی" },
        ])
        .run();

      db.insert(schema.orders)
        .values([
          {
            id: 101,
            code: "ORD101",
            customerId: 1,
            status: "paid",
            recipientName: "مریم",
            addressText: "تهران خیابان آزادی پلاک ۱",
            subtotalToman: 300000,
            shippingToman: 0,
            totalToman: 300000,
          },
          {
            id: 102,
            code: "ORD102",
            customerId: 1,
            status: "delivered",
            recipientName: "مریم",
            addressText: "تهران خیابان آزادی پلاک ۱",
            subtotalToman: 200000,
            shippingToman: 0,
            totalToman: 200000,
          },
        ])
        .run();

      const customers = getAdminCustomersList({}, { db });
      assert.equal(customers.length, 2);

      const maryam = customers.find((c) => c.id === 1);
      assert.ok(maryam);
      assert.equal(maryam.ordersCount, 2);
      assert.equal(maryam.totalSpentToman, 500000);

      const parvin = customers.find((c) => c.id === 2);
      assert.equal(parvin?.ordersCount, 0);
      assert.equal(parvin?.totalSpentToman, 0);

      // Search by phone
      const searched = getAdminCustomersList({ search: "0935" }, { db });
      assert.equal(searched.length, 1);
      assert.equal(searched[0].id, 2);
    });

    test("retrieves customer detail with addresses and order history", () => {
      db.insert(schema.customers)
        .values({ id: 1, phone: "09123456789", name: "سارا حسینی" })
        .run();

      db.insert(schema.customerAddresses)
        .values({
          id: 1,
          customerId: 1,
          label: "منزل",
          recipientName: "سارا حسینی",
          text: "تهران، میدان ونک، خیابان ملاصدرا پلاک ۵",
          postalCode: "1991234567",
        })
        .run();

      db.insert(schema.orders)
        .values({
          id: 101,
          code: "ORD101",
          customerId: 1,
          status: "in-progress",
          recipientName: "سارا حسینی",
          addressText: "تهران، میدان ونک، خیابان ملاصدرا پلاک ۵",
          subtotalToman: 450000,
          shippingToman: 0,
          totalToman: 450000,
        })
        .run();

      const detail = getAdminCustomerDetail(1, { db });
      assert.ok(detail);
      assert.equal(detail.name, "سارا حسینی");
      assert.equal(detail.phone, "09123456789");
      assert.equal(detail.addresses.length, 1);
      assert.equal(detail.addresses[0].label, "منزل");
      assert.equal(detail.orders.length, 1);
      assert.equal(detail.orders[0].code, "ORD101");
      assert.equal(detail.orders[0].status, "in-progress");
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Custom Orders Inquiry Inbox                                              */
  /* ------------------------------------------------------------------------ */
  describe("Custom Orders Inquiry Inbox", () => {
    test("lists active inquiries by default, and supports archived filter", () => {
      const now = Math.floor(Date.now() / 1000);
      db.insert(schema.customOrderSubmissions)
        .values([
          {
            id: 1,
            name: "مهسا احمدی",
            phone: "09121234567",
            collectionId: "wall",
            isBulk: false,
            description: "دیوارکوب ۱ متری برای بالای تخت",
            archivedAt: null,
            createdAt: now - 3600,
          },
          {
            id: 2,
            name: "علی کریمی",
            phone: "09987654321",
            collectionId: "plant",
            isBulk: true,
            description: "۲۰ عدد آویز گلدان برای کافه",
            archivedAt: now - 7200,
            createdAt: now - 8000,
          },
        ])
        .run();

      // Active only (default)
      const active = getAdminCustomOrdersList({}, { db });
      assert.equal(active.length, 1);
      assert.equal(active[0].id, 1);
      assert.equal(active[0].archivedAt, null);

      // Archived only
      const archived = getAdminCustomOrdersList({ archivedOnly: true }, { db });
      assert.equal(archived.length, 1);
      assert.equal(archived[0].id, 2);
      assert.ok(archived[0].archivedAt !== null);

      // Search by phone searches both active and archived rows
      const searched = getAdminCustomOrdersList({ search: "099876" }, { db });
      assert.equal(searched.length, 1);
      assert.equal(searched[0].id, 2);
    });

    test("archives, unarchives, and deletes inquiries", () => {
      db.insert(schema.customOrderSubmissions)
        .values({
          id: 1,
          name: "زهرا نوری",
          phone: "09128889900",
          description: "سفارش تابلو",
        })
        .run();

      // Archive inquiry
      adminArchiveCustomOrder(1, true, { db });
      let active = getAdminCustomOrdersList({}, { db });
      assert.equal(active.length, 0);

      const archived = getAdminCustomOrdersList({ archivedOnly: true }, { db });
      assert.equal(archived.length, 1);

      // Unarchive inquiry
      adminArchiveCustomOrder(1, false, { db });
      active = getAdminCustomOrdersList({}, { db });
      assert.equal(active.length, 1);

      // Delete inquiry
      adminDeleteCustomOrder(1, { db });
      const all = getAdminCustomOrdersList({ includeArchived: true }, { db });
      assert.equal(all.length, 0);
    });
  });

  /* ------------------------------------------------------------------------ */
  /* Settings & Wholesale Write                                               */
  /* ------------------------------------------------------------------------ */
  describe("Settings & Contact Channels Wholesale Write", () => {
    test("loads defaults when no settings exist", () => {
      const cfg = getAdminSettings({ db });
      assert.equal(cfg.shippingFlatToman, 90000);
      assert.equal(cfg.shippingFreeFromToman, 300000);
      assert.equal(cfg.promo, null);
      assert.equal(cfg.channels.length, 0);
    });

    test("wholesale saves shipping flat, free-from threshold, single promo code, and contact channels", () => {
      saveAdminSettingsWholesale(
        {
          shippingFlatToman: 110000,
          shippingFreeFromToman: 450000,
          promo: {
            code: "SPRING20",
            percent: 20,
            enabled: true,
          },
          channels: [
            {
              type: "phone",
              label: "تماس تلفنی",
              value: "09120000000",
              enabled: true,
              sort: 1,
            },
            {
              type: "telegram",
              label: "پشتیبانی تلگرام",
              value: "@gereh_support",
              enabled: true,
              sort: 2,
            },
          ],
        },
        { db }
      );

      const cfg = getAdminSettings({ db });
      assert.equal(cfg.shippingFlatToman, 110000);
      assert.equal(cfg.shippingFreeFromToman, 450000);
      assert.ok(cfg.promo);
      assert.equal(cfg.promo.code, "SPRING20");
      assert.equal(cfg.promo.percent, 20);
      assert.equal(cfg.promo.enabled, true);

      assert.equal(cfg.channels.length, 2);
      assert.equal(cfg.channels[0].type, "phone");
      assert.equal(cfg.channels[1].type, "telegram");

      // Verify contact_channels sync updates and removes correctly
      saveAdminSettingsWholesale(
        {
          shippingFlatToman: 120000,
          shippingFreeFromToman: 500000,
          promo: null,
          channels: [
            {
              id: cfg.channels[0].id,
              type: "phone",
              label: "شماره مستقیم کارگاه",
              value: "09121112233",
              enabled: false,
              sort: 1,
            },
            {
              type: "instagram",
              label: "اینستاگرام کارگاه",
              value: "@gereh.macrame",
              enabled: true,
              sort: 2,
            },
          ],
        },
        { db }
      );

      const updated = getAdminSettings({ db });
      assert.equal(updated.shippingFlatToman, 120000);
      assert.equal(updated.shippingFreeFromToman, 500000);
      assert.equal(updated.promo, null);
      assert.equal(updated.channels.length, 2);
      assert.equal(updated.channels[0].label, "شماره مستقیم کارگاه");
      assert.equal(updated.channels[0].enabled, false);
      assert.equal(updated.channels[1].type, "instagram");
    });
  });
});
