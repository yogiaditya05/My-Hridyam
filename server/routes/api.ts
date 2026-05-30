import { Router } from "express";
import multer from "multer";
import { storagePut, storageGet } from "../storage/storageService";

export const apiRouter = Router();

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB limit matching Whisper Whisper upload limits
  },
});

/**
 * POST /api/storage/upload
 * Handles multi-part file uploads (primarily voice recording clips)
 */
apiRouter.post("/storage/upload", upload.single("file"), async (req: any, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    const key = req.body.key || `uploads/${Date.now()}-${req.file.originalname}`;
    const contentType = req.body.contentType || req.file.mimetype || "application/octet-stream";

    const { url } = await storagePut(key, req.file.buffer, contentType);
    
    return res.json({ key, url });
  } catch (error) {
    console.error("[REST Upload API] Error saving file:", error);
    return res.status(500).json({ error: "File upload execution failed." });
  }
});

/**
 * GET /api/storage/get
 * Retrieves file path mappings
 */
apiRouter.get("/storage/get", async (req, res) => {
  try {
    const key = req.query.key as string;
    if (!key) {
      return res.status(400).json({ error: "Parameter 'key' is required." });
    }

    const { url } = await storageGet(key);
    return res.json({ key, url });
  } catch (error) {
    console.error("[REST Upload API] Error getting file URL:", error);
    return res.status(500).json({ error: "File url retrieval failed." });
  }
});
