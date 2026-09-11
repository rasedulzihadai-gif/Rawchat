import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, destroySession, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await destroySession(token);
  await setSessionCookie(null);
  return NextResponse.json({ ok: true });
}
