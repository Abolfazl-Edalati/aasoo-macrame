import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import * as schema from "@/db/schema";

export const DATABASE_PATH = resolve(
  process.env.DATABASE_PATH ?? "gereh.db",
);

const globalForDb = globalThis as typeof globalThis & {
  __gerehDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function createClient() {
  // The DB file may sit on persistent disk outside the app dir; make sure the
  // parent directory exists before better-sqlite3 opens it.
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  const sqlite = new Database(DATABASE_PATH);
  sqlite.pragma("journal_mode = WAL"); // ADR-0003: SQLite file in WAL mode
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
}

export const db = globalForDb.__gerehDb ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.__gerehDb = db;
