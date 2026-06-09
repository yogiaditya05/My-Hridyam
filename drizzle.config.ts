import { defineConfig } from "drizzle-kit";
import { ENV } from "./server/utils/env";

export default defineConfig({
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: ENV.databaseUrl,
  },
});