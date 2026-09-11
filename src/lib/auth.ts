import { cookies } from "next/headers";
import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE = "rawchat_session";
const SESSION_TTL_MS = 30 * 24 * 3600 * 1000; // 30 days
const REFRESH_WINDOW_MS = 7 * 24 * 3600 * 1000; // extend when < 7 days left

export interface AuthUser {
  id: string;
  email: string;
  createdAt: Date;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Validate signup/login input. Returns an error message or null when valid. */
export function validateCredentials(
  email: unknown,
  password: unknown,
): string | null {
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "Enter a valid email address.";
  }
  if (email.trim().length > 255) return "Email is too long.";
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) return "Password is too long.";
  return null;
}

/* ── tiny in-memory rate limiter (per server instance) ── */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  // prune expired buckets opportunistically
  if (attempts.size > 1000) {
    for (const [k, v] of attempts) if (v.resetAt <= now) attempts.delete(k);
  }
  const cur = attempts.get(key);
  if (!cur || cur.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}

export function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/* ── sessions ── */

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function setSessionCookie(token: string | null): Promise<void> {
  const store = await cookies();
  if (token) {
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });
  } else {
    store.delete(SESSION_COOKIE);
  }
}

export async function destroySession(token: string): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
  } catch {
    /* best effort */
  }
}

/** Resolve the logged-in user from the session cookie, or null. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isDbConfigured()) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const [row] = await db
      .select({
        userId: users.id,
        email: users.email,
        createdAt: users.createdAt,
        sessionId: sessions.id,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.userId))
      .where(
        and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())),
      )
      .limit(1);
    if (!row) return null;
    // sliding expiry: extend sessions that are close to expiring
    if (row.expiresAt.getTime() - Date.now() < REFRESH_WINDOW_MS) {
      await db
        .update(sessions)
        .set({ expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
        .where(eq(sessions.id, row.sessionId));
    }
    return { id: row.userId, email: row.email, createdAt: row.createdAt };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
