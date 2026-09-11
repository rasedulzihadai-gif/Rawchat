import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { conversations, messages } from "@/db/schema";
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

async function ownsConversation(id: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
    .limit(1);
  return Boolean(row);
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const g = await guard();
  if ("response" in g) return g.response;
  try {
    const { id } = await ctx.params;
    if (!(await ownsConversation(id, g.user.id))) {
      return NextResponse.json(
        { messages: [], error: "Conversation not found." },
        { status: 404 },
      );
    }
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
  const g = await guard();
  if ("response" in g) return g.response;
  try {
    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    if (!body?.role || typeof body.content !== "string") {
      return NextResponse.json({ error: "role and content are required" }, { status: 400 });
    }
    if (!(await ownsConversation(id, g.user.id))) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
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
    // (Also bumps updatedAt, which extends the 7-day retention window.)
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.role === "user") {
      const [conv] = await db
        .select({ title: conversations.title })
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, g.user.id)));
      if (!conv || conv.title === "New chat") {
        update.title =
          body.content.replace(/\s+/g, " ").trim().slice(0, 60) || "New chat";
      }
    }
    await db
      .update(conversations)
      .set(update)
      .where(and(eq(conversations.id, id), eq(conversations.userId, g.user.id)));

    return NextResponse.json({ message: msg });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 503 },
    );
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const g = await guard();
  if ("response" in g) return g.response;
  try {
    const { id } = await ctx.params;
    if (!(await ownsConversation(id, g.user.id))) {
      return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
    }
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (ids.length) {
      // Only delete messages that belong to this conversation.
      const targets = await db
        .select({ id: messages.id })
        .from(messages)
        .where(and(eq(messages.conversationId, id), inArray(messages.id, ids)));
      if (targets.length) {
        await db.delete(messages).where(
          inArray(
            messages.id,
            targets.map((t) => t.id),
          ),
        );
      }
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
