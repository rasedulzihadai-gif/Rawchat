import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { conversations, messages } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DB_DOWN = {
  error:
    "Database unavailable. Set DATABASE_URL and run `npm run db:push` to enable saved conversations.",
};

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json({ messages: [], ...DB_DOWN }, { status: 503 });
  }
  try {
    const { id } = await ctx.params;
    const rows = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));
    return NextResponse.json({ messages: rows });
  } catch (err) {
    return NextResponse.json(
      { messages: [], error: err instanceof Error ? err.message : "Query failed" },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json(DB_DOWN, { status: 503 });
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body?.role || typeof body.content !== "string") {
      return NextResponse.json({ error: "role and content are required" }, { status: 400 });
    }

    const [msg] = await db
      .insert(messages)
      .values({
        conversationId: id,
        role: body.role,
        content: body.content,
        model: body.model || "",
      })
      .returning();

    // Auto-title the conversation from its first user message.
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.role === "user") {
      const [conv] = await db
        .select({ title: conversations.title })
        .from(conversations)
        .where(eq(conversations.id, id));
      if (!conv || conv.title === "New chat") {
        update.title =
          body.content.replace(/\s+/g, " ").trim().slice(0, 60) || "New chat";
      }
    }
    await db.update(conversations).set(update).where(eq(conversations.id, id));

    return NextResponse.json({ message: msg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 503 },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  if (!isDbConfigured()) {
    return NextResponse.json(DB_DOWN, { status: 503 });
  }
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length) {
      await db.delete(messages).where(inArray(messages.id, ids));
    } else {
      await db.delete(messages).where(eq(messages.conversationId, id));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 503 },
    );
  }
}
