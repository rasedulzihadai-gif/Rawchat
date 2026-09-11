import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  clientIp,
  createSession,
  rateLimit,
  setSessionCookie,
  validateCredentials,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const BAD_LOGIN = "Invalid email or password.";

export async function POST(req: NextRequest) {
  if (!rateLimit(`login:${clientIp(req)}`)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const invalid = validateCredentials(body?.email, body?.password);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
  if (!isDbConfigured()) {
    return NextResponse.json(
      { error: "Database unavailable. Set DATABASE_URL to enable accounts." },
      { status: 503 },
    );
  }

  const email = (body.email as string).trim().toLowerCase();
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // Same response whether the email exists or not (no user enumeration).
    if (!user || !(await verifyPassword(body.password as string, user.passwordHash))) {
      return NextResponse.json({ error: BAD_LOGIN }, { status: 401 });
    }

    await setSessionCookie(await createSession(user.id));
    return NextResponse.json({
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sign-in failed" },
      { status: 503 },
    );
  }
}
