import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ENV } from "../utils/env";
import * as path from "path";
import * as fs from "fs";

console.log("[Database] Initializing PostgreSQL connection...");

// Configure SSL based on Supabase or require options
const isSslRequired = ENV.databaseUrl.includes("supabase.co") || 
                       ENV.databaseUrl.includes("sslmode=require") || 
                       ENV.databaseUrl.includes("supabase.net");

export const client = postgres(ENV.databaseUrl, {
  ssl: isSslRequired ? "require" : undefined,
});

export const db = drizzle(client);

export async function runMigrations() {
  try {
    const migrationsFolder = path.resolve("./drizzle");
    if (fs.existsSync(migrationsFolder)) {
      console.log("[Database] Running PostgreSQL migrations from:", migrationsFolder);
      await migrate(db, { migrationsFolder });
      console.log("[Database] PostgreSQL migrations applied successfully!");
    } else {
      console.warn("[Database] Migrations folder not found. Skipping auto-migration.");
    }
  } catch (error) {
    console.error(
      "[Database] PostgreSQL migration execution skipped/failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
