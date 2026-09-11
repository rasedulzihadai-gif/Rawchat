import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { conversations } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.updatedAt))
    .limit(200);
  return NextResponse.json({ conversations: rows });
}

export async function POST(req: NextRequest) {
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
}
