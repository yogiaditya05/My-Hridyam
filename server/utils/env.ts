import "dotenv/config";

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "hridyam-app",
  cookieSecret: process.env.JWT_SECRET ?? "hridyam-default-secret-key-change-me",
  databaseUrl: process.env.DATABASE_URL ?? "./database/hridyam.db",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "http://localhost:3000",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "admin",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  geminiApiKey: process.env.Gemini_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
};

