export default async function handler(req: any, res: any) {
  try {
    const { default: app } = await import("../server/index");
    const { runMigrations } = await import("../server/db/connection");
    try {
      await runMigrations();
    } catch (err) {
      console.error("[Vercel Serverless] Failed to run database migrations:", err);
    }
    return app(req, res);
  } catch (err: any) {
    console.error("FATAL ERROR IN SERVERLESS FUNCTION:", err);
    res.status(500).json({
      error: "FATAL ERROR IN SERVERLESS FUNCTION",
      message: err.message,
      stack: err.stack
    });
  }
}
