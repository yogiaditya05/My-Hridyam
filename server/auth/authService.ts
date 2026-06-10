import crypto from "crypto";
import { ENV } from "../utils/env";
import { ONE_YEAR_MS } from "../../shared/const";

const getSecretKey = () => new TextEncoder().encode(ENV.cookieSecret);

/**
 * Creates a JWT session token for a given user openId and name.
 */
export async function createSessionToken(openId: string, name: string): Promise<string> {
  const { SignJWT } = await import("jose");
  const secretKey = getSecretKey();
  const issuedAt = Date.now();
  const expirationSeconds = Math.floor((issuedAt + ONE_YEAR_MS) / 1000);

  return new SignJWT({ openId, name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expirationSeconds)
    .sign(secretKey);
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 */
export async function verifySession(token: string): Promise<{ openId: string; name: string } | null> {
  try {
    const { jwtVerify } = await import("jose");
    const secretKey = getSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    const { openId, name } = payload as Record<string, unknown>;
    
    if (typeof openId === "string" && typeof name === "string") {
      return { openId, name };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Hashes a plaintext password using salted PBKDF2.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifies a password against a stored salted PBKDF2 hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  const salt = parts[0];
  const hash = parts[1];
  
  if (!salt || !hash) return false;
  
  const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === computedHash;
}
