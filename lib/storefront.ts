import { eq, and, sql, desc, asc, like, inArray, notInArray, lte, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  products,
  collections,
  colors,
  productColors,
  productSizes,
  images,
  productImages,
  articles,
  faqItems,
  contactChannels,
  settings,
} from "@/db/schema";

export type ProductWithHeroImage = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  collectionId: string;
  priceToman: number;
  compareAtToman: number | null;
  stock: number;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  heroImage: {
    path: string;
    alt: string;
    width: number | null;
    height: number | null;
  } | null;
};

export type FullProduct = {
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
  dimensions: string | null;
  materials: string | null;
  care: string | null;
  weave: string | null;
  weightKg: number | null;
  madeIn: string | null;
  handmade: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  description: string;
  story: string | null;
  images: {
    id: number;
    path: string;
    alt: string;
    width: number | null;
    height: number | null;
  }[];
  sizes: {
    id: number;
    label: string;
    deltaToman: number;
  }[];
  colors: {
    id: string;
    label: string;
    hex: string;
  }[];
};

/** Get all collections ordered by sort */
export function getCollections() {
  return db.select().from(collections).orderBy(asc(collections.sort)).all();
}

/** Get published product count grouped by collectionId */
export function getCollectionCounts(): Record<string, number> {
  const rows = db
    .select({
      collectionId: products.collectionId,
      count: sql<number>`count(*)`,
    })
    .from(products)
    .where(eq(products.status, "published"))
    .groupBy(products.collectionId)
    .all();

  const counts: Record<string, number> = {};
  for (const r of rows) {
    counts[r.collectionId] = Number(r.count);
  }
  return counts;
}

/** Get all 7 shared palette colors */
export function getAllColors() {
  return db.select().from(colors).orderBy(asc(colors.sort)).all();
}

/** Get featured products for home page: in-stock, published, sorted by isNew desc, rating desc */
export function getFeaturedProducts(limit = 4): ProductWithHeroImage[] {
  const list = db
    .select()
    .from(products)
    .where(and(eq(products.status, "published"), gt(products.stock, 0)))
    .orderBy(desc(products.isNew), desc(products.rating))
    .limit(limit)
    .all();

  return attachHeroImages(list);
}

export type ShopFilterParams = {
  collection?: string;
  color?: string | string[];
  maxPrice?: number;
  minPrice?: number;
  inStock?: boolean;
  sort?: "new" | "cheap" | "exp" | "rate";
  q?: string;
};

/** Filter and sort catalog products driven strictly by URL query parameters */
export function getShopProducts(filters: ShopFilterParams): {
  items: ProductWithHeroImage[];
  totalPublished: number;
} {
  const totalRow = db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(eq(products.status, "published"))
    .get();
  const totalPublished = Number(totalRow?.count ?? 0);

  // If color filter is active, find candidate product IDs
  let allowedProductIds: number[] | null = null;
  if (filters.color) {
    const colorIds = Array.isArray(filters.color) ? filters.color : [filters.color];
    const validColors = colorIds.filter(Boolean);
    if (validColors.length > 0) {
      const matchRows = db
        .select({ productId: productColors.productId })
        .from(productColors)
        .where(inArray(productColors.colorId, validColors))
        .all();
      allowedProductIds = matchRows.map((r) => r.productId);
      if (allowedProductIds.length === 0) {
        return { items: [], totalPublished };
      }
    }
  }

  const conditions = [eq(products.status, "published")];

  if (filters.collection && filters.collection !== "all") {
    conditions.push(eq(products.collectionId, filters.collection));
  }

  if (filters.inStock) {
    conditions.push(gt(products.stock, 0));
  }

  if (filters.maxPrice && filters.maxPrice > 0) {
    conditions.push(lte(products.priceToman, filters.maxPrice));
  }

  if (filters.minPrice && filters.minPrice > 0) {
    conditions.push(sql`${products.priceToman} >= ${filters.minPrice}`);
  }

  if (allowedProductIds !== null) {
    conditions.push(inArray(products.id, allowedProductIds));
  }

  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    conditions.push(
      sql`(${products.name} LIKE ${term} OR ${products.subtitle} LIKE ${term} OR ${products.materials} LIKE ${term} OR ${products.weave} LIKE ${term} OR ${products.description} LIKE ${term})`
    );
  }

  let orderClause = [desc(products.isNew), desc(products.rating), asc(products.sort)];
  if (filters.sort === "cheap") {
    orderClause = [asc(products.priceToman), asc(products.sort)];
  } else if (filters.sort === "exp") {
    orderClause = [desc(products.priceToman), asc(products.sort)];
  } else if (filters.sort === "rate") {
    orderClause = [desc(products.rating), desc(products.reviewCount)];
  }

  const rows = db
    .select()
    .from(products)
    .where(and(...conditions))
    .orderBy(...orderClause)
    .all();

  const items = attachHeroImages(rows);
  return { items, totalPublished };
}

/** Get product by Persian slug with full relations */
export function getProductBySlug(rawSlug: string): FullProduct | null {
  let decoded = rawSlug.trim();
  try {
    decoded = decodeURIComponent(rawSlug).trim();
  } catch {
    // Malformed URI string, use raw
  }

  const product = db
    .select()
    .from(products)
    .where(and(eq(products.status, "published"), eq(products.slug, decoded)))
    .get();

  if (!product) {
    return null;
  }

  const collectionRow = db
    .select()
    .from(collections)
    .where(eq(collections.id, product.collectionId))
    .get();

  const imgRows = db
    .select({
      id: images.id,
      path: images.path,
      alt: images.alt,
      width: images.width,
      height: images.height,
    })
    .from(productImages)
    .innerJoin(images, eq(productImages.imageId, images.id))
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sort))
    .all();

  const sizeRows = db
    .select({
      id: productSizes.id,
      label: productSizes.label,
      deltaToman: productSizes.deltaToman,
    })
    .from(productSizes)
    .where(eq(productSizes.productId, product.id))
    .orderBy(asc(productSizes.sort))
    .all();

  const colorRows = db
    .select({
      id: colors.id,
      label: colors.label,
      hex: colors.hex,
    })
    .from(productColors)
    .innerJoin(colors, eq(productColors.colorId, colors.id))
    .where(eq(productColors.productId, product.id))
    .orderBy(asc(colors.sort))
    .all();

  return {
    ...product,
    collectionName: collectionRow?.name ?? "محصول",
    images: imgRows,
    sizes: sizeRows,
    colors: colorRows,
  };
}

/** Get related products in same collection */
export function getRelatedProducts(
  collectionId: string,
  currentProductId: number,
  limit = 6
): ProductWithHeroImage[] {
  let list = db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, "published"),
        eq(products.collectionId, collectionId),
        sql`${products.id} != ${currentProductId}`
      )
    )
    .orderBy(desc(products.isNew), desc(products.rating))
    .limit(limit)
    .all();

  // If fewer than limit, fill with other published products
  if (list.length < limit) {
    const existingIds = [currentProductId, ...list.map((p) => p.id)];
    const fallback = db
      .select()
      .from(products)
      .where(
        and(
          eq(products.status, "published"),
          notInArray(products.id, existingIds)
        )
      )
      .limit(limit - list.length)
      .all();
    list = [...list, ...fallback];
  }

  return attachHeroImages(list);
}

/** Get latest articles with hero image */
export function getLatestArticles(limit = 3) {
  return db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      tag: articles.tag,
      date: articles.date,
      readMin: articles.readMin,
      imagePath: images.path,
      imageAlt: images.alt,
      imageWidth: images.width,
      imageHeight: images.height,
    })
    .from(articles)
    .leftJoin(images, eq(articles.imageId, images.id))
    .orderBy(asc(articles.sort))
    .limit(limit)
    .all();
}

function attachHeroImages(
  productList: (typeof products.$inferSelect)[]
): ProductWithHeroImage[] {
  if (productList.length === 0) return [];
  const productIds = productList.map((p) => p.id);

  const heroRows = db
    .select({
      productId: productImages.productId,
      path: images.path,
      alt: images.alt,
      width: images.width,
      height: images.height,
    })
    .from(productImages)
    .innerJoin(images, eq(productImages.imageId, images.id))
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sort))
    .all();

  const heroMap = new Map<
    number,
    { path: string; alt: string; width: number | null; height: number | null }
  >();
  for (const r of heroRows) {
    if (!heroMap.has(r.productId)) {
      heroMap.set(r.productId, {
        path: r.path,
        alt: r.alt,
        width: r.width,
        height: r.height,
      });
    }
  }

  return productList.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    collectionId: p.collectionId,
    priceToman: p.priceToman,
    compareAtToman: p.compareAtToman,
    stock: p.stock,
    isNew: p.isNew,
    rating: p.rating,
    reviewCount: p.reviewCount,
    heroImage: heroMap.get(p.id) ?? null,
  }));
}

export type FullArticle = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  tag: string;
  date: string;
  readMin: number;
  image: {
    path: string;
    alt: string;
    width: number | null;
    height: number | null;
  } | null;
};

export type FaqItem = {
  id: number;
  question: string;
  answer: string;
  sort: number;
};

export type ContactChannelItem = {
  id: number;
  type: "phone" | "whatsapp" | "telegram" | "instagram";
  label: string;
  value: string;
  enabled: boolean;
  sort: number;
};

/** Get all articles with full body and hero image ordered by sort */
export function getAllArticles(): FullArticle[] {
  const rows = db
    .select({
      id: articles.id,
      title: articles.title,
      excerpt: articles.excerpt,
      body: articles.body,
      tag: articles.tag,
      date: articles.date,
      readMin: articles.readMin,
      imagePath: images.path,
      imageAlt: images.alt,
      imageWidth: images.width,
      imageHeight: images.height,
    })
    .from(articles)
    .leftJoin(images, eq(articles.imageId, images.id))
    .orderBy(asc(articles.sort))
    .all();

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    body: r.body,
    tag: r.tag,
    date: r.date,
    readMin: r.readMin,
    image: r.imagePath
      ? {
          path: r.imagePath,
          alt: r.imageAlt ?? "",
          width: r.imageWidth,
          height: r.imageHeight,
        }
      : null,
  }));
}

/** Get all FAQ items ordered by sort */
export function getFaqItems(): FaqItem[] {
  return db.select().from(faqItems).orderBy(asc(faqItems.sort)).all();
}

/** Get all enabled contact channels ordered by sort */
export function getContactChannels(): ContactChannelItem[] {
  return db
    .select()
    .from(contactChannels)
    .where(eq(contactChannels.enabled, true))
    .orderBy(asc(contactChannels.sort))
    .all();
}

/** Get all site settings as a key-value record */
export function getSiteSettings(): Record<string, string> {
  const rows = db.select().from(settings).all();
  const map: Record<string, string> = {};
  for (const r of rows) {
    map[r.key] = r.value;
  }
  return map;
}

/** Get all image rows with credits for design system documentation */
export function getImageCredits() {
  return db
    .select({
      path: images.path,
      artist: images.artist,
      license: images.license,
    })
    .from(images)
    .all();
}

