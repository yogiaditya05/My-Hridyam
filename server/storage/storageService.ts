import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import { ENV } from "../utils/env";

const UPLOADS_DIR = path.resolve("./public/uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  // Remove leading slashes and any directory traversal attempts
  return relKey.replace(/^\/+/, "").replace(/\.\./g, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomBytes(4).toString("hex");
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

/**
 * Saves a file to local uploads directory and returns its key and local URL.
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const key = appendHashSuffix(normalizeKey(relKey));
  ensureUploadsDir();
  
  const destPath = path.join(UPLOADS_DIR, key);
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  fs.writeFileSync(destPath, buffer);
  
  // Return the public web path served by Express static
  return {
    key,
    url: `/uploads/${key}`,
  };
}

/**
 * Retrieves the local URL for a given file key.
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return {
    key,
    url: `/uploads/${key}`,
  };
}

/**
 * Returns the local URL path for static file access.
 */
export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const key = normalizeKey(relKey);
  return `/uploads/${key}`;
}
