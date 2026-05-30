import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { ENV } from "../utils/env";
import * as path from "path";
import * as fs from "fs";

// Resolve database path
const dbPath = ENV.databaseUrl.startsWith("mysql:")
  ? path.resolve("./database/hridyam.db")
  : path.resolve(ENV.databaseUrl);

// Ensure directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log("[Database] Initializing SQLite connection at:", dbPath);
export const client = new Database(dbPath);
export const db = drizzle(client);

export async function runMigrations() {
  try {
    const migrationsFolder = path.resolve("./drizzle");
    if (fs.existsSync(migrationsFolder)) {
      console.log("[Database] Running SQLite migrations from:", migrationsFolder);
      await migrate(db, { migrationsFolder });
      console.log("[Database] SQLite migrations applied successfully!");
    } else {
      console.warn("[Database] Migrations folder not found. Skipping auto-migration.");
    }
  } catch (error) {
    console.error("[Database] SQLite migration execution skipped/failed:", error instanceof Error ? error.message : String(error));
  }
}
