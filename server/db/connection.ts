import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { ENV } from "../utils/env";
import * as path from "path";
import * as fs from "fs";
import dns from "dns";

// Force IPv4 resolution to prevent ENETUNREACH issues on environments with disabled IPv6 (like Render)
dns.setDefaultResultOrder("ipv4first");

console.log("[Database] Initializing PostgreSQL connection...");

const dbUrl = ENV.databaseUrl || "";
if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
  console.error("\n==========================================================================");
  console.error("[Database Error] DATABASE_URL must be a valid PostgreSQL connection string!");
  console.error("Expected prefix: postgres:// or postgresql://");
  console.error("Current value:  ", dbUrl);
  console.error("Please update your DATABASE_URL environment variable in your host settings.");
  console.error("==========================================================================\n");
  process.exit(1);
}

// Configure SSL based on Supabase or require options
const isSslRequired = dbUrl.includes("supabase.co") || 
                       dbUrl.includes("sslmode=require") || 
                       dbUrl.includes("supabase.net");

export const client = postgres(dbUrl, {
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
