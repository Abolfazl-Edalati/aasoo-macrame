import { eq, sql, asc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";

type DbClient = typeof defaultDb;

export type AdminCollectionItem = {
  id: string;
  name: string;
  desc: string | null;
  sort: number;
  productCount: number;
};

export type AdminColorItem = {
  id: string;
  label: string;
  hex: string;
  sort: number;
  usageCount: number;
};

/* -------------------------------------------------------------------------- */
/* Collections CRUD                                                           */
/* -------------------------------------------------------------------------- */

export function getAdminCollections(options?: { db?: DbClient }): AdminCollectionItem[] {
  const db = options?.db ?? defaultDb;

  const rows = db.select().from(schema.collections).orderBy(asc(schema.collections.sort)).all();
  const prodCounts = db
    .select({
      collectionId: schema.products.collectionId,
      count: sql<number>`count(*)`,
    })
    .from(schema.products)
    .groupBy(schema.products.collectionId)
    .all();

  const countMap = new Map<string, number>();
  for (const p of prodCounts) {
    countMap.set(p.collectionId, Number(p.count));
  }

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    desc: r.desc,
    sort: r.sort,
    productCount: countMap.get(r.id) ?? 0,
  }));
}

export function createAdminCollection(
  data: { id: string; name: string; desc?: string | null; sort?: number },
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;
  const id = data.id.trim().toLowerCase();
  const name = data.name.trim();

  if (!id || !name) {
    throw new Error("ID and name are required for collection");
  }

  db.insert(schema.collections)
    .values({
      id,
      name,
      desc: data.desc?.trim() || null,
      sort: data.sort ?? 0,
    })
    .run();
}

export function updateAdminCollection(
  id: string,
  data: { name?: string; desc?: string | null; sort?: number },
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;
  const updates: Record<string, string | number | null> = {};

  if (data.name !== undefined) updates.name = data.name.trim();
  if (data.desc !== undefined) updates.desc = data.desc?.trim() || null;
  if (data.sort !== undefined) updates.sort = data.sort;

  if (Object.keys(updates).length > 0) {
    db.update(schema.collections)
      .set(updates)
      .where(eq(schema.collections.id, id))
      .run();
  }
}

export function deleteAdminCollection(id: string, options?: { db?: DbClient }) {
  const db = options?.db ?? defaultDb;

  // Check if any products reference this collection
  const prod = db
    .select({ id: schema.products.id })
    .from(schema.products)
    .where(eq(schema.products.collectionId, id))
    .limit(1)
    .all();

  if (prod.length > 0) {
    throw new Error(`COLLECTION_IN_USE: Collection "${id}" has products assigned to it.`);
  }

  db.delete(schema.collections).where(eq(schema.collections.id, id)).run();
}

/* -------------------------------------------------------------------------- */
/* Colors CRUD & Reassign-Before-Delete                                       */
/* -------------------------------------------------------------------------- */

export function getAdminColors(options?: { db?: DbClient }): AdminColorItem[] {
  const db = options?.db ?? defaultDb;

  const rows = db.select().from(schema.colors).orderBy(asc(schema.colors.sort)).all();

  const prodCounts = db
    .select({
      colorId: schema.productColors.colorId,
      count: sql<number>`count(*)`,
    })
    .from(schema.productColors)
    .groupBy(schema.productColors.colorId)
    .all();

  const subCounts = db
    .select({
      colorId: schema.submissionColors.colorId,
      count: sql<number>`count(*)`,
    })
    .from(schema.submissionColors)
    .groupBy(schema.submissionColors.colorId)
    .all();

  const usageMap = new Map<string, number>();
  for (const p of prodCounts) {
    usageMap.set(p.colorId, (usageMap.get(p.colorId) ?? 0) + Number(p.count));
  }
  for (const s of subCounts) {
    usageMap.set(s.colorId, (usageMap.get(s.colorId) ?? 0) + Number(s.count));
  }

  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    hex: r.hex,
    sort: r.sort,
    usageCount: usageMap.get(r.id) ?? 0,
  }));
}

export function createAdminColor(
  data: { id: string; label: string; hex: string; sort?: number },
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;
  const id = data.id.trim().toLowerCase();
  const label = data.label.trim();
  const hex = data.hex.trim();

  if (!id || !label || !hex) {
    throw new Error("ID, label, and hex are required for color");
  }

  db.insert(schema.colors)
    .values({
      id,
      label,
      hex,
      sort: data.sort ?? 0,
    })
    .run();
}

export function updateAdminColor(
  id: string,
  data: { label?: string; hex?: string; sort?: number },
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;
  const updates: Record<string, string | number> = {};

  if (data.label !== undefined) updates.label = data.label.trim();
  if (data.hex !== undefined) updates.hex = data.hex.trim();
  if (data.sort !== undefined) updates.sort = data.sort;

  if (Object.keys(updates).length > 0) {
    db.update(schema.colors)
      .set(updates)
      .where(eq(schema.colors.id, id))
      .run();
  }
}

export function checkColorInUse(
  id: string,
  options?: { db?: DbClient }
): { inUse: boolean; productCount: number; submissionCount: number; totalCount: number } {
  const db = options?.db ?? defaultDb;

  const prodRow = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.productColors)
    .where(eq(schema.productColors.colorId, id))
    .get();

  const subRow = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.submissionColors)
    .where(eq(schema.submissionColors.colorId, id))
    .get();

  const productCount = Number(prodRow?.count ?? 0);
  const submissionCount = Number(subRow?.count ?? 0);
  const totalCount = productCount + submissionCount;

  return {
    inUse: totalCount > 0,
    productCount,
    submissionCount,
    totalCount,
  };
}

/**
 * Reassign-before-delete UX: deleting an in-use color offers reassignment, never cascades.
 * If in-use and replacementColorId not provided, throws COLOR_IN_USE.
 */
export function deleteAdminColor(
  id: string,
  options?: { db?: DbClient; replacementColorId?: string }
) {
  const db = options?.db ?? defaultDb;
  const usage = checkColorInUse(id, { db });

  if (usage.inUse) {
    const replacementId = options?.replacementColorId?.trim().toLowerCase();
    if (!replacementId) {
      throw new Error(
        `COLOR_IN_USE: Color "${id}" is in use (${usage.productCount} products, ${usage.submissionCount} inquiries) and requires reassignment before deletion.`
      );
    }

    if (replacementId === id) {
      throw new Error("Replacement color cannot be the same color being deleted.");
    }

    // Verify replacement color exists
    const replacement = db
      .select({ id: schema.colors.id })
      .from(schema.colors)
      .where(eq(schema.colors.id, replacementId))
      .get();

    if (!replacement) {
      throw new Error(`Replacement color "${replacementId}" not found.`);
    }

    // 1. Reassign product colors
    const existingProdRows = db
      .select()
      .from(schema.productColors)
      .where(eq(schema.productColors.colorId, id))
      .all();

    for (const row of existingProdRows) {
      // Check if product already has replacement color
      const alreadyHas = db
        .select()
        .from(schema.productColors)
        .where(
          sql`${schema.productColors.productId} = ${row.productId} AND ${schema.productColors.colorId} = ${replacementId}`
        )
        .get();

      if (alreadyHas) {
        db.delete(schema.productColors)
          .where(
            sql`${schema.productColors.productId} = ${row.productId} AND ${schema.productColors.colorId} = ${id}`
          )
          .run();
      } else {
        db.update(schema.productColors)
          .set({ colorId: replacementId })
          .where(
            sql`${schema.productColors.productId} = ${row.productId} AND ${schema.productColors.colorId} = ${id}`
          )
          .run();
      }
    }

    // 2. Reassign submission colors
    const existingSubRows = db
      .select()
      .from(schema.submissionColors)
      .where(eq(schema.submissionColors.colorId, id))
      .all();

    for (const row of existingSubRows) {
      const alreadyHas = db
        .select()
        .from(schema.submissionColors)
        .where(
          sql`${schema.submissionColors.submissionId} = ${row.submissionId} AND ${schema.submissionColors.colorId} = ${replacementId}`
        )
        .get();

      if (alreadyHas) {
        db.delete(schema.submissionColors)
          .where(
            sql`${schema.submissionColors.submissionId} = ${row.submissionId} AND ${schema.submissionColors.colorId} = ${id}`
          )
          .run();
      } else {
        db.update(schema.submissionColors)
          .set({ colorId: replacementId })
          .where(
            sql`${schema.submissionColors.submissionId} = ${row.submissionId} AND ${schema.submissionColors.colorId} = ${id}`
          )
          .run();
      }
    }
  }

  // Delete color row
  db.delete(schema.colors).where(eq(schema.colors.id, id)).run();
}
