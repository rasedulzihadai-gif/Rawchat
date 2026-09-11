import { NextRequest, NextResponse } from "next/server";
import { db, isDbConfigured } from "@/db";
import { conversations } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const DB_DOWN = {
  error:
    "Database unavailable. Set DATABASE_URL and run `npm run db:push` to enable saved conversations.",
};

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ conversations: [], ...DB_DOWN }, { status: 503 });
  }
  try {
    const rows = await db
      .select()
      .from(conversations)
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
  try {
    const body = await req.json().catch(() => ({}));
    const [row] = await db
      .insert(conversations)
      .values({
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
