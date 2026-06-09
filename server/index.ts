import "dotenv/config";
import express from "express";
import { createServer } from "http";
import cors from "cors";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./routers";
import { createContext } from "./config/trpc";
import { serveStatic, setupVite } from "./config/vite";
import { apiRouter } from "./routes/api";
import { runMigrations } from "./db/connection";
import { ENV } from "./utils/env";

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
  // 1. Initialize MySQL Database schemas and run pending migrations
  console.log("[My Hridyam Server] Connecting to database and checking migrations...");
  await runMigrations();

  const app = express();
  const server = createServer(app);

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

  // 2. Mount Uploads and static file server directly to avoid Vite interception
  const uploadsDir = path.resolve("./public/uploads");
  app.use("/uploads", express.static(uploadsDir));

  // 3. Mount REST API endpoints (e.g., S3/local file uploads)
  app.use("/api", apiRouter);

  // 4. Mount tRPC API endpoint
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // 5. Build/Serve Frontend SPA
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

  server.listen(port, () => {
    console.log(`[My Hridyam Server] My Hridyam Companion running at http://localhost:${port}/`);
  });
}

startServer().catch((err) => {
  console.error("[Hridyam Server] Bootstrap crash error:", err);
});
