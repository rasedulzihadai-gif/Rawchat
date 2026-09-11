import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
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
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  await db.delete(conversations).where(eq(conversations.id, id));
  return NextResponse.json({ ok: true });
}
