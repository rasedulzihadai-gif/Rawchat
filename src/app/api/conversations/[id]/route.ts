import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DB_DOWN = {
  error:
    "Database unavailable. Set DATABASE_URL and run `npm run db:push` to enable saved conversations.",
};

type Ctx = { params: Promise<{ id: string }> };

async function guard() {
  if (!isDbConfigured()) {
    return { response: NextResponse.json(DB_DOWN, { status: 503 }) as NextResponse };
  }
  const user = await getCurrentUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  return { user };
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const g = await guard();
  if ("response" in g) return g.response;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const [row] = await db
      .update(conversations)
      .set({
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.model !== undefined ? { model: body.model } : {}),
        ...(body.providerId !== undefined ? { providerId: body.providerId } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(conversations.id, id), eq(conversations.userId, g.user.id)))
      .returning();
    if (!row) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    return NextResponse.json({ conversation: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 503 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const g = await guard();
  if ("response" in g) return g.response;
  try {
    const { id } = await ctx.params;
    await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, g.user.id)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 503 },
    );
  }
}
