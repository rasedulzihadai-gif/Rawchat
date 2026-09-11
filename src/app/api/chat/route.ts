import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface IncomingMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

function sse(type: string, data: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

/** Normalize a fetch Response error into a readable string. */
async function describeError(res: Response): Promise<string> {
  let detail = "";
  try {
    const text = await res.text();
    try {
      const j = JSON.parse(text);
      detail = j?.error?.message || j?.error || j?.message || text;
    } catch {
      detail = text;
    }
  } catch {
    /* ignore */
  }
  if (typeof detail !== "string") detail = JSON.stringify(detail);
  return `${res.status} ${res.statusText}${detail ? ` — ${detail.slice(0, 500)}` : ""}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Sign in required", { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return new Response("Invalid JSON", { status: 400 });

  const { baseUrl, apiKey, model, api, messages, system, extraHeaders } = body as {
    baseUrl: string;
    apiKey?: string;
    model: string;
    api: "openai" | "anthropic";
    messages: IncomingMessage[];
    system?: string;
    extraHeaders?: Record<string, string>;
  };

  if (!baseUrl || !model || !Array.isArray(messages)) {
    return new Response("Missing baseUrl, model or messages", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (type: string, data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sse(type, data)));
      try {
        if (api === "anthropic") {
          await streamAnthropic({ baseUrl, apiKey, model, messages, system }, send);
        } else {
          await streamOpenAI({ baseUrl, apiKey, model, messages, system, extraHeaders }, send);
        }
        send("done", {});
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

type Sender = (type: string, data: Record<string, unknown>) => void;

async function streamOpenAI(
  opts: {
    baseUrl: string;
    apiKey?: string;
    model: string;
    messages: IncomingMessage[];
    system?: string;
    extraHeaders?: Record<string, string>;
  },
  send: Sender,
) {
  const url = `${opts.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const msgs: IncomingMessage[] = opts.system
    ? [{ role: "system", content: opts.system }, ...opts.messages.filter((m) => m.role !== "system")]
    : opts.messages;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey || "unused"}`,
      "HTTP-Referer": "https://rawchat.app",
      "X-Title": "Rawchat",
      ...(opts.extraHeaders || {}),
    },
    body: JSON.stringify({
      model: opts.model,
      messages: msgs,
      stream: true,
      temperature: 0.7,
      stream_options: { include_usage: true },
    }),
  });

  if (!res.ok || !res.body) throw new Error(await describeError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";

    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") return;
      let json: any;
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const choice = json?.choices?.[0];
      const delta = choice?.delta;
      if (delta) {
        const reasoning =
          delta.reasoning_content || delta.reasoning || delta.thinking || null;
        if (typeof reasoning === "string" && reasoning) send("reasoning", { text: reasoning });
        let content = delta.content;
        if (Array.isArray(content)) {
          content = content
            .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
            .join("");
        }
        if (typeof content === "string" && content) send("delta", { text: content });
      } else if (json?.usage) {
        send("usage", { usage: json.usage });
      }
      if (json?.error) throw new Error(json.error.message || JSON.stringify(json.error));
    }
  }
}

async function streamAnthropic(
  opts: {
    baseUrl: string;
    apiKey?: string;
    model: string;
    messages: IncomingMessage[];
    system?: string;
  },
  send: Sender,
) {
  const url = `${opts.baseUrl.replace(/\/+$/, "")}/v1/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: 8192,
      stream: true,
      ...(opts.system ? { system: opts.system } : {}),
      messages: opts.messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok || !res.body) throw new Error(await describeError(res));

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() || "";

    for (const rawLine of parts) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      let json: any;
      try {
        json = JSON.parse(line.slice(5).trim());
      } catch {
        continue;
      }
      if (json.type === "content_block_delta") {
        const d = json.delta;
        if (d?.type === "text_delta" && d.text) send("delta", { text: d.text });
        if (d?.type === "thinking_delta" && d.thinking) send("reasoning", { text: d.thinking });
      } else if (json.type === "error") {
        throw new Error(json.error?.message || "Anthropic API error");
      } else if (json.type === "message_stop") {
        return;
      }
    }
  }
}
