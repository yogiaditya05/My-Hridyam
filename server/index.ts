import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./config/trpc";
// vite.ts is imported dynamically below — it pulls in devDependencies
// (vite, tailwindcss, react plugin) that don't exist in Vercel serverless bundles.
import { apiRouter } from "./routes/api";
import { runMigrations } from "./db/connection";
import { ENV } from "./utils/env";

const app = express();

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : true,
    credentials: true,
  })
);

// Configure body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Mount Uploads and static file server directly to avoid Vite interception
const isVercel = !!process.env.VERCEL;
const uploadsDir = isVercel ? "/tmp/uploads" : path.resolve("./public/uploads");
app.use("/uploads", express.static(uploadsDir));

// Mount REST API endpoints (e.g., S3/local file uploads)
app.use("/api", apiRouter);

// Mount tRPC API endpoint
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  // 1. Initialize Database schemas and run pending migrations
  console.log("[My Hridyam Server] Connecting to database and checking migrations...");
  await runMigrations();

  const server = createServer(app);

  // 5. Build/Serve Frontend SPA (dynamic import to avoid loading devDependencies)
  const { serveStatic, setupVite } = await import("./config/vite");
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 6. Find and bind port listener
  const preferredPort = parseInt(process.env.PORT || "3000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[My Hridyam Server] Port ${preferredPort} is busy, using port ${port} instead.`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`[My Hridyam Server] My Hridyam Companion running at http://0.0.0.0:${port}/`);
  });
}

if (!isVercel) {
  startServer().catch((err) => {
    console.error("[Hridyam Server] Bootstrap crash error:", err);
  });
}

export default app;
