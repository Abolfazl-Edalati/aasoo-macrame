import { eq, desc, asc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";

type DbClient = typeof defaultDb;

export type AdminProductSizeInput = {
  id?: number;
  label: string;
  deltaToman: number;
  sort?: number;
};

export type AdminProductImageInput = {
  imageId: number;
  sort: number;
};

export type AdminProductInput = {
  slug: string;
  name: string;
  subtitle?: string | null;
  collectionId: string;
  priceToman: number;
  compareAtToman?: number | null;
  stock?: number;
  status?: "draft" | "published";
  dimensions?: string | null;
  materials?: string | null;
  care?: string | null;
  weave?: string | null;
  weightKg?: number | null;
  madeIn?: string | null;
  handmade?: boolean;
  isNew?: boolean;
  description: string;
  story?: string | null;
  sort?: number;
  sizes?: AdminProductSizeInput[];
  colorIds?: string[];
  images?: AdminProductImageInput[];
};

export type AdminProductListItem = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  collectionId: string;
  collectionName: string;
  priceToman: number;
  compareAtToman: number | null;
  stock: number;
  status: "draft" | "published";
  isNew: boolean;
  sort: number;
  heroImage: {
    path: string;
    alt: string;
  } | null;
};

export type AdminProductDetail = typeof schema.products.$inferSelect & {
  collection: { id: string; name: string } | null;
  sizes: (typeof schema.productSizes.$inferSelect)[];
  colors: (typeof schema.colors.$inferSelect)[];
  images: {
    imageId: number;
    path: string;
    alt: string;
    artist: string | null;
    license: string | null;
    width: number | null;
    height: number | null;
    sort: number;
  }[];
};

export function getAdminProductsList(
  filters?: { collectionId?: string; status?: string; search?: string },
  options?: { db?: DbClient }
): AdminProductListItem[] {
  const db = options?.db ?? defaultDb;

  const query = db
    .select({
      id: schema.products.id,
      slug: schema.products.slug,
      name: schema.products.name,
      subtitle: schema.products.subtitle,
      collectionId: schema.products.collectionId,
      collectionName: schema.collections.name,
      priceToman: schema.products.priceToman,
      compareAtToman: schema.products.compareAtToman,
      stock: schema.products.stock,
      status: schema.products.status,
      isNew: schema.products.isNew,
      sort: schema.products.sort,
    })
    .from(schema.products)
    .innerJoin(schema.collections, eq(schema.products.collectionId, schema.collections.id))
    .orderBy(asc(schema.products.sort), desc(schema.products.id));

  const rows = query.all();

  // Load hero images for all products (sort = 0)
  const heroRows = db
    .select({
      productId: schema.productImages.productId,
      path: schema.images.path,
      alt: schema.images.alt,
    })
    .from(schema.productImages)
    .innerJoin(schema.images, eq(schema.productImages.imageId, schema.images.id))
    .where(eq(schema.productImages.sort, 0))
    .all();

  const heroMap = new Map<number, { path: string; alt: string }>();
  for (const h of heroRows) {
    heroMap.set(h.productId, { path: h.path, alt: h.alt });
  }

  let list: AdminProductListItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    subtitle: r.subtitle,
    collectionId: r.collectionId,
    collectionName: r.collectionName,
    priceToman: r.priceToman,
    compareAtToman: r.compareAtToman,
    stock: r.stock,
    status: r.status as "draft" | "published",
    isNew: Boolean(r.isNew),
    sort: r.sort,
    heroImage: heroMap.get(r.id) ?? null,
  }));

  if (filters?.collectionId) {
    list = list.filter((p) => p.collectionId === filters.collectionId);
  }
  if (filters?.status) {
    list = list.filter((p) => p.status === filters.status);
  }
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(q))
    );
  }

  return list;
}

export function getAdminProductDetail(
  id: number,
  options?: { db?: DbClient }
): AdminProductDetail | null {
  const db = options?.db ?? defaultDb;

  const product = db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .get();

  if (!product) return null;

  const collection = db
    .select({ id: schema.collections.id, name: schema.collections.name })
    .from(schema.collections)
    .where(eq(schema.collections.id, product.collectionId))
    .get() ?? null;

  const sizes = db
    .select()
    .from(schema.productSizes)
    .where(eq(schema.productSizes.productId, id))
    .orderBy(asc(schema.productSizes.sort), asc(schema.productSizes.id))
    .all();

  const colors = db
    .select({
      id: schema.colors.id,
      label: schema.colors.label,
      hex: schema.colors.hex,
      sort: schema.colors.sort,
    })
    .from(schema.productColors)
    .innerJoin(schema.colors, eq(schema.productColors.colorId, schema.colors.id))
    .where(eq(schema.productColors.productId, id))
    .orderBy(asc(schema.colors.sort))
    .all();

  const images = db
    .select({
      imageId: schema.productImages.imageId,
      path: schema.images.path,
      alt: schema.images.alt,
      artist: schema.images.artist,
      license: schema.images.license,
      width: schema.images.width,
      height: schema.images.height,
      sort: schema.productImages.sort,
    })
    .from(schema.productImages)
    .innerJoin(schema.images, eq(schema.productImages.imageId, schema.images.id))
    .where(eq(schema.productImages.productId, id))
    .orderBy(asc(schema.productImages.sort))
    .all();

  return {
    ...product,
    collection,
    sizes,
    colors,
    images,
  };
}

export function createAdminProduct(
  input: AdminProductInput,
  options?: { db?: DbClient }
): AdminProductDetail {
  const db = options?.db ?? defaultDb;

  const cleanSlug = input.slug.trim().replace(/\s+/g, "-");
  if (!cleanSlug) {
    throw new Error("Slug is required");
  }

  // Check unique slug
  const existing = db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.slug, cleanSlug))
    .get();

  if (existing) {
    throw new Error(`SLUG_ALREADY_EXISTS: Product slug "${cleanSlug}" already exists.`);
  }

  const [created] = db
    .insert(schema.products)
    .values({
      slug: cleanSlug,
      name: input.name.trim(),
      subtitle: input.subtitle?.trim() || null,
      collectionId: input.collectionId,
      priceToman: Math.round(input.priceToman),
      compareAtToman: input.compareAtToman ? Math.round(input.compareAtToman) : null,
      stock: Math.max(0, input.stock ?? 0),
      status: input.status ?? "draft",
      dimensions: input.dimensions?.trim() || null,
      materials: input.materials?.trim() || null,
      care: input.care?.trim() || null,
      weave: input.weave?.trim() || null,
      weightKg: input.weightKg ?? null,
      madeIn: input.madeIn?.trim() || null,
      handmade: input.handmade !== undefined ? Boolean(input.handmade) : true,
      isNew: Boolean(input.isNew),
      description: input.description.trim(),
      story: input.story?.trim() || null,
      sort: input.sort ?? 0,
    })
    .returning()
    .all();

  const productId = created.id;

  // Insert sizes
  if (input.sizes && input.sizes.length > 0) {
    for (let i = 0; i < input.sizes.length; i++) {
      const s = input.sizes[i];
      if (s.label?.trim()) {
        db.insert(schema.productSizes)
          .values({
            productId,
            label: s.label.trim(),
            deltaToman: Math.round(s.deltaToman ?? 0),
            sort: s.sort ?? i + 1,
          })
          .run();
      }
    }
  }

  // Insert colors
  if (input.colorIds && input.colorIds.length > 0) {
    for (const cId of input.colorIds) {
      if (cId?.trim()) {
        db.insert(schema.productColors)
          .values({
            productId,
            colorId: cId.trim(),
          })
          .run();
      }
    }
  }

  // Insert images
  if (input.images && input.images.length > 0) {
    for (const img of input.images) {
      db.insert(schema.productImages)
        .values({
          productId,
          imageId: img.imageId,
          sort: img.sort ?? 0,
        })
        .run();
    }
  }

  return getAdminProductDetail(productId, { db })!;
}

export function updateAdminProduct(
  id: number,
  input: Partial<AdminProductInput>,
  options?: { db?: DbClient }
): AdminProductDetail {
  const db = options?.db ?? defaultDb;

  const current = db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .get();

  if (!current) {
    throw new Error(`Product ${id} not found`);
  }

  const updates: Record<string, string | number | boolean | null> = {};

  if (input.slug !== undefined) {
    const cleanSlug = input.slug.trim().replace(/\s+/g, "-");
    if (!cleanSlug) throw new Error("Slug cannot be empty");

    if (cleanSlug !== current.slug) {
      const existing = db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(eq(schema.products.slug, cleanSlug))
        .get();

      if (existing && existing.id !== id) {
        throw new Error(`SLUG_ALREADY_EXISTS: Product slug "${cleanSlug}" already exists.`);
      }
    }
    updates.slug = cleanSlug;
  }

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.subtitle !== undefined) updates.subtitle = input.subtitle?.trim() || null;
  if (input.collectionId !== undefined) updates.collectionId = input.collectionId;
  if (input.priceToman !== undefined) updates.priceToman = Math.round(input.priceToman);
  if (input.compareAtToman !== undefined) {
    updates.compareAtToman = input.compareAtToman ? Math.round(input.compareAtToman) : null;
  }
  if (input.stock !== undefined) updates.stock = Math.max(0, input.stock);
  if (input.status !== undefined) updates.status = input.status;
  if (input.dimensions !== undefined) updates.dimensions = input.dimensions?.trim() || null;
  if (input.materials !== undefined) updates.materials = input.materials?.trim() || null;
  if (input.care !== undefined) updates.care = input.care?.trim() || null;
  if (input.weave !== undefined) updates.weave = input.weave?.trim() || null;
  if (input.weightKg !== undefined) updates.weightKg = input.weightKg;
  if (input.madeIn !== undefined) updates.madeIn = input.madeIn?.trim() || null;
  if (input.handmade !== undefined) updates.handmade = Boolean(input.handmade);
  if (input.isNew !== undefined) updates.isNew = Boolean(input.isNew);
  if (input.description !== undefined) updates.description = input.description.trim();
  if (input.story !== undefined) updates.story = input.story?.trim() || null;
  if (input.sort !== undefined) updates.sort = input.sort;

  if (Object.keys(updates).length > 0) {
    db.update(schema.products)
      .set(updates)
      .where(eq(schema.products.id, id))
      .run();
  }

  // Sync sizes if provided
  if (input.sizes !== undefined) {
    db.delete(schema.productSizes).where(eq(schema.productSizes.productId, id)).run();
    for (let i = 0; i < input.sizes.length; i++) {
      const s = input.sizes[i];
      if (s.label?.trim()) {
        db.insert(schema.productSizes)
          .values({
            productId: id,
            label: s.label.trim(),
            deltaToman: Math.round(s.deltaToman ?? 0),
            sort: s.sort ?? i + 1,
          })
          .run();
      }
    }
  }

  // Sync colors if provided
  if (input.colorIds !== undefined) {
    db.delete(schema.productColors).where(eq(schema.productColors.productId, id)).run();
    for (const cId of input.colorIds) {
      if (cId?.trim()) {
        db.insert(schema.productColors)
          .values({
            productId: id,
            colorId: cId.trim(),
          })
          .run();
      }
    }
  }

  // Sync images if provided
  if (input.images !== undefined) {
    db.delete(schema.productImages).where(eq(schema.productImages.productId, id)).run();
    for (const img of input.images) {
      db.insert(schema.productImages)
        .values({
          productId: id,
          imageId: img.imageId,
          sort: img.sort ?? 0,
        })
        .run();
    }
  }

  return getAdminProductDetail(id, { db })!;
}

export function deleteAdminProduct(id: number, options?: { db?: DbClient }) {
  const db = options?.db ?? defaultDb;
  // Cascades product_sizes, product_colors, product_images
  db.delete(schema.products).where(eq(schema.products.id, id)).run();
}
