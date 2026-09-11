import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const { baseUrl, apiKey, api } = body as {
    baseUrl: string;
    apiKey?: string;
    api: "openai" | "anthropic";
  };
  if (!baseUrl) return NextResponse.json({ error: "Missing baseUrl" }, { status: 400 });

  const clean = baseUrl.replace(/\/+$/, "");
  try {
    if (api === "anthropic") {
      const res = await fetch(`${clean}/v1/models`, {
        headers: { "x-api-key": apiKey || "", "anthropic-version": "2023-06-01" },
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const j = await res.json();
      const ids = (j?.data || []).map((m: any) => m.id).filter(Boolean);
      return NextResponse.json({ models: ids });
    }

    // Google Gemini's OpenAI-compat layer also exposes native listing.
    if (clean.includes("generativelanguage.googleapis.com") && apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?pageSize=200&key=${encodeURIComponent(apiKey)}`,
        { cache: "no-store" },
      );
      if (res.ok) {
        const j = await res.json();
        const ids = (j?.models || [])
          .filter((m: any) => (m.supportedGenerationMethods || []).includes("generateContent"))
          .map((m: any) => String(m.name).replace(/^models\//, ""))
          .filter(Boolean);
        if (ids.length) return NextResponse.json({ models: ids });
      }
    }

    const res = await fetch(`${clean}/models`, {
      headers: { Authorization: `Bearer ${apiKey || "unused"}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const j = await res.json();
    const raw = Array.isArray(j?.data) ? j.data : Array.isArray(j) ? j : [];
    const ids = raw
      .map((m: any) => (typeof m === "string" ? m : m?.id))
      .filter((s: any) => typeof s === "string" && s.length > 0)
      .filter((s: string) => !/embed|whisper|tts|dall-e|moderation/i.test(s));
    return NextResponse.json({ models: ids });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list models" },
      { status: 502 },
    );
  }
}
