import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { isDbConfigured } from "@/db";
import { RETENTION_DAYS, deleteExpiredConversations } from "@/lib/retention";

export const dynamic = "force-dynamic";

/**
 * Global 7-day retention sweep for an external scheduler (e.g. Vercel Cron,
 * Render cron job, or `curl` from crontab — once a day is plenty).
 *
 * Auth: Authorization: Bearer <CRON_SECRET>  (or ?token=<CRON_SECRET>)
 */
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization");
  const given = header?.startsWith("Bearer ")
    ? header.slice(7)
    : req.nextUrl.searchParams.get("token");
  if (!given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }
  try {
    const deleted = await deleteExpiredConversations();
    return NextResponse.json({ ok: true, deleted, retentionDays: RETENTION_DAYS });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cleanup failed" },
      { status: 503 },
    );
  }
}
