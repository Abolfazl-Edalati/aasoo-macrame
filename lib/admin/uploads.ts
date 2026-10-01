import fs from "node:fs";
import path from "node:path";
import { desc } from "drizzle-orm";
import { db as defaultDb } from "@/lib/db";
import * as schema from "@/db/schema";
import { generateUlid } from "@/lib/ulid";

type DbClient = typeof defaultDb;

export type UploadImageInput = {
  buffer: Buffer | Uint8Array;
  filename: string;
  alt: string;
  artist?: string | null;
  license?: string | null;
  width?: number | null;
  height?: number | null;
};

export type AdminImageRecord = typeof schema.images.$inferSelect;

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  avif: "image/avif",
};

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase().replace(/^\./, "");
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

/**
 * Saves uploaded image to uploads/{ulid}.{ext} on persistent disk
 * and captures row in images table with alt text and artist/license credits.
 */
export async function saveUploadedImage(
  input: UploadImageInput,
  options?: { db?: DbClient; uploadDir?: string }
): Promise<AdminImageRecord> {
  const db = options?.db ?? defaultDb;
  const targetDir = options?.uploadDir ?? path.join(process.cwd(), "uploads");

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Extract clean extension (default: webp)
  let ext = path.extname(input.filename).toLowerCase().replace(/^\./, "");
  if (!ext || !MIME_BY_EXT[ext]) {
    ext = "webp";
  }

  const ulid = generateUlid();
  const filename = `${ulid}.${ext}`;
  const diskPath = path.join(targetDir, filename);

  // Write file to persistent disk
  fs.writeFileSync(diskPath, Buffer.from(input.buffer));

  const publicPath = `/uploads/${filename}`;

  const [row] = db
    .insert(schema.images)
    .values({
      path: publicPath,
      alt: input.alt.trim(),
      artist: input.artist?.trim() || null,
      license: input.license?.trim() || null,
      width: input.width ?? null,
      height: input.height ?? null,
    })
    .returning()
    .all();

  return row;
}

export function getAdminImagesList(options?: { db?: DbClient }): AdminImageRecord[] {
  const db = options?.db ?? defaultDb;
  return db.select().from(schema.images).orderBy(desc(schema.images.id)).all();
}
