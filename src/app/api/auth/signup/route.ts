import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { users } from "@/db/schema";
import {
  clientIp,
  createSession,
  hashPassword,
  rateLimit,
  setSessionCookie,
  validateCredentials,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!rateLimit(`signup:${clientIp(req)}`)) {
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
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(body.password as string);
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash })
      .returning({ id: users.id, email: users.email, createdAt: users.createdAt });

    await setSessionCookie(await createSession(user.id));
    return NextResponse.json({ user });
  } catch (err) {
    // unique-violation race between the check above and the insert
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sign-up failed" },
      { status: 503 },
    );
  }
}
