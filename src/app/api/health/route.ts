import { db, isDbConfigured } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return Response.json({ ok: false, configured: false }, { status: 503 });
  }
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, configured: true });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        configured: true,
        error: err instanceof Error ? err.message : "Database unreachable",
      },
      { status: 503 },
    );
  }
}
