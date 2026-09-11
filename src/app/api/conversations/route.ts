import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { db, isDbConfigured } from "@/db";
import { conversations } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { deleteExpiredConversations } from "@/lib/retention";

export const dynamic = "force-dynamic";

const DB_DOWN = {
  error:
    "Database unavailable. Set DATABASE_URL and run `npm run db:push` to enable saved conversations.",
};

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ conversations: [], ...DB_DOWN }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { conversations: [], error: "Sign in required." },
      { status: 401 },
    );
  }
  try {
    // Opportunistic retention sweep: chats older than 7 days vanish on sight.
    await deleteExpiredConversations(user.id).catch(() => 0);
    const rows = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, user.id))
      .orderBy(desc(conversations.updatedAt))
      .limit(200);
    return NextResponse.json({ conversations: rows });
  } catch (err) {
    return NextResponse.json(
      { conversations: [], error: err instanceof Error ? err.message : "Query failed" },
      { status: 503 },
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(DB_DOWN, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const [row] = await db
      .insert(conversations)
      .values({
        userId: user.id,
        title: body.title || "New chat",
        providerId: body.providerId || "",
        model: body.model || "",
      })
      .returning();
    return NextResponse.json({ conversation: row });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Insert failed" },
      { status: 503 },
    );
  }
}
