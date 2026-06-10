import app from "../server/index";
import { runMigrations } from "../server/db/connection";

let migrationsPromise: Promise<void> | null = null;

async function ensureMigrations() {
  if (!migrationsPromise) {
    migrationsPromise = runMigrations();
  }
  await migrationsPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureMigrations();
  } catch (err) {
    console.error("[Vercel Serverless] Failed to run database migrations:", err);
  }
  return app(req, res);
}
