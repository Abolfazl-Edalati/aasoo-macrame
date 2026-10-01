import { eq, desc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";

type DbClient = typeof defaultDb;

export type AdminCustomOrderItem = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  collectionId: string | null;
  collectionName: string | null;
  isBulk: boolean;
  deadline: string | null;
  dimensionsText: string | null;
  description: string;
  wantsSample: boolean;
  archivedAt: number | null;
  createdAt: number;
  colors: {
    id: string;
    label: string;
    hex: string;
  }[];
};

export function getAdminCustomOrdersList(
  filters?: { archivedOnly?: boolean; includeArchived?: boolean; search?: string },
  options?: { db?: DbClient }
): AdminCustomOrderItem[] {
  const db = options?.db ?? defaultDb;

  const rows = db
    .select({
      id: schema.customOrderSubmissions.id,
      name: schema.customOrderSubmissions.name,
      phone: schema.customOrderSubmissions.phone,
      email: schema.customOrderSubmissions.email,
      collectionId: schema.customOrderSubmissions.collectionId,
      collectionName: schema.collections.name,
      isBulk: schema.customOrderSubmissions.isBulk,
      deadline: schema.customOrderSubmissions.deadline,
      dimensionsText: schema.customOrderSubmissions.dimensionsText,
      description: schema.customOrderSubmissions.description,
      wantsSample: schema.customOrderSubmissions.wantsSample,
      archivedAt: schema.customOrderSubmissions.archivedAt,
      createdAt: schema.customOrderSubmissions.createdAt,
    })
    .from(schema.customOrderSubmissions)
    .leftJoin(
      schema.collections,
      eq(schema.customOrderSubmissions.collectionId, schema.collections.id)
    )
    .orderBy(desc(schema.customOrderSubmissions.createdAt))
    .all();

  // Load colors for all submissions
  const submissionIds = rows.map((r) => r.id);
  const colorMap = new Map<number, { id: string; label: string; hex: string }[]>();

  if (submissionIds.length > 0) {
    const colorRows = db
      .select({
        submissionId: schema.submissionColors.submissionId,
        id: schema.colors.id,
        label: schema.colors.label,
        hex: schema.colors.hex,
      })
      .from(schema.submissionColors)
      .innerJoin(
        schema.colors,
        eq(schema.submissionColors.colorId, schema.colors.id)
      )
      .all();

    for (const c of colorRows) {
      const list = colorMap.get(c.submissionId) ?? [];
      list.push({ id: c.id, label: c.label, hex: c.hex });
      colorMap.set(c.submissionId, list);
    }
  }

  let list: AdminCustomOrderItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    collectionId: r.collectionId,
    collectionName: r.collectionName,
    isBulk: Boolean(r.isBulk),
    deadline: r.deadline,
    dimensionsText: r.dimensionsText,
    description: r.description,
    wantsSample: Boolean(r.wantsSample),
    archivedAt: r.archivedAt,
    createdAt: r.createdAt,
    colors: colorMap.get(r.id) ?? [],
  }));

  // Filtering:
  // If search provided (e.g. phone), search across all rows (active AND archived)
  if (filters?.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (item) =>
        item.phone.includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    );
  } else if (filters?.archivedOnly) {
    list = list.filter((item) => item.archivedAt !== null);
  } else if (!filters?.includeArchived) {
    list = list.filter((item) => item.archivedAt === null);
  }

  return list;
}

export function adminArchiveCustomOrder(
  id: number,
  archive: boolean,
  options?: { db?: DbClient }
) {
  const db = options?.db ?? defaultDb;
  const now = Math.floor(Date.now() / 1000);

  db.update(schema.customOrderSubmissions)
    .set({
      archivedAt: archive ? now : null,
    })
    .where(eq(schema.customOrderSubmissions.id, id))
    .run();
}

export function adminDeleteCustomOrder(id: number, options?: { db?: DbClient }) {
  const db = options?.db ?? defaultDb;
  db.delete(schema.customOrderSubmissions)
    .where(eq(schema.customOrderSubmissions.id, id))
    .run();
}
