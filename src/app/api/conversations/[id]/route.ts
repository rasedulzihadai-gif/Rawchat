import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DB_DOWN = {
  error:
    "Database unavailable. Set DATABASE_URL and run `npm run db:push` to enable saved conversations.",
};

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json(DB_DOWN, { status: 503 });
  }
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
      .where(eq(conversations.id, id))
      .returning();
    return NextResponse.json({ conversation: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 503 },
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json(DB_DOWN, { status: 503 });
  }
  try {
    const { id } = await ctx.params;
    await db.delete(conversations).where(eq(conversations.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 503 },
    );
  }
}
