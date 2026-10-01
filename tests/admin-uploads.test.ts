import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/db/schema";
import { saveUploadedImage, getAdminImagesList } from "@/lib/admin/uploads";
import { GET } from "@/app/uploads/[...path]/route";
import { NextRequest } from "next/server";

describe("Uploads & Image Serving", () => {
  let sqlite: InstanceType<typeof Database>;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  const testUploadDir = path.join(process.cwd(), "tests", "tmp-uploads");

  beforeEach(() => {
    sqlite = new Database(":memory:");
    sqlite.exec(`
      CREATE TABLE images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        alt TEXT NOT NULL,
        artist TEXT,
        license TEXT,
        width INTEGER,
        height INTEGER
      );
    `);
    db = drizzle(sqlite, { schema });

    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  test("saveUploadedImage writes uploads/{ulid}.{ext} and records row in images table with credits", async () => {
    const buffer = Buffer.from("fake-image-bytes");
    const result = await saveUploadedImage(
      {
        buffer,
        filename: "macrame-wall.jpg",
        alt: "دیوارکوب بافته شده",
        artist: "زهرا سلیمانی",
        license: "اختصاصی کارگاه",
        width: 1200,
        height: 800,
      },
      { db, uploadDir: testUploadDir }
    );

    assert.ok(result.id > 0);
    assert.match(result.path, /^\/uploads\/[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}\.jpg$/);
    assert.equal(result.alt, "دیوارکوب بافته شده");
    assert.equal(result.artist, "زهرا سلیمانی");
    assert.equal(result.license, "اختصاصی کارگاه");
    assert.equal(result.width, 1200);
    assert.equal(result.height, 800);

    // Verify file exists on disk
    const savedFilename = path.basename(result.path);
    const diskPath = path.join(testUploadDir, savedFilename);
    assert.ok(fs.existsSync(diskPath));
    assert.equal(fs.readFileSync(diskPath, "utf-8"), "fake-image-bytes");

    // Verify row in DB
    const list = getAdminImagesList({ db });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, result.id);
  });

  test("GET /uploads/[...path] route serves file from disk with proper Content-Type and Cache-Control", async () => {
    const filename = "01ARZ3NDEKTSV4RRFFQ69G5FAV.png";
    const diskPath = path.join(process.cwd(), "uploads", filename);
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    fs.writeFileSync(diskPath, "png-dummy-data");

    try {
      const req = new NextRequest(`http://localhost:3000/uploads/${filename}`);
      const res = await GET(req, { params: Promise.resolve({ path: [filename] }) });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get("content-type"), "image/png");
      assert.match(res.headers.get("cache-control") || "", /public/);
      const text = await res.text();
      assert.equal(text, "png-dummy-data");
    } finally {
      if (fs.existsSync(diskPath)) {
        fs.unlinkSync(diskPath);
      }
    }
  });

  test("GET /uploads/[...path] rejects directory traversal and missing files with 404", async () => {
    const req1 = new NextRequest("http://localhost:3000/uploads/non-existent.jpg");
    const res1 = await GET(req1, { params: Promise.resolve({ path: ["non-existent.jpg"] }) });
    assert.equal(res1.status, 404);

    const req2 = new NextRequest("http://localhost:3000/uploads/../secret.txt");
    const res2 = await GET(req2, { params: Promise.resolve({ path: ["..", "secret.txt"] }) });
    assert.equal(res2.status, 404);
  });
});
