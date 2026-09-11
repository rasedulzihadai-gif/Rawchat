"use client";

import { useState } from "react";
import { Check, Copy, Pencil, RefreshCw, Brain, AlertTriangle } from "lucide-react";
import { Markdown } from "./Markdown";
import { Logo } from "./Sidebar";

export interface ChatMsg {
  id: string;
  dbId?: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  reasoning?: string;
  streaming?: boolean;
  error?: string;
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 1500);
      }}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-muted transition hover:bg-white/5 hover:text-cream"
    >
      {ok ? <Check size={12.5} className="text-mint" /> : <Copy size={12.5} />}
      {label && <span>{ok ? "Copied" : label}</span>}
    </button>
  );
}

function Reasoning({ text, active }: { text: string; active: boolean }) {
  const [open, setOpen] = useState(active);
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-line bg-white/[0.02]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[12px] font-medium text-fog transition hover:bg-white/[0.03]"
      >
        <Brain size={13} className={active ? "animate-pulse text-accent" : "text-muted"} />
        {active ? "Thinking…" : "Thought process"}
        <span className="ml-auto text-muted">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="border-t border-line px-4 py-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-muted">
          {text}
        </div>
      )}
    </div>
  );
}

export default function MessageList({
  msgs,
  onEdit,
  onRegenerate,
}: {
  msgs: ChatMsg[];
  onEdit: (content: string) => void;
  onRegenerate: () => void;
}) {
  const lastAssistantId = [...msgs].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-8 md:px-6">
      {msgs.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="group animate-fade-up">
            <div className="w-fit max-w-[88%] rounded-2xl rounded-bl-md border border-line bg-elevated px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap text-cream">
              {m.content}
            </div>
            <div className="mt-1.5 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <CopyBtn text={m.content} label="Copy" />
              <button
                onClick={() => onEdit(m.content)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-muted transition hover:bg-white/5 hover:text-cream"
              >
                <Pencil size={12.5} /> Edit
              </button>
            </div>
          </div>
        ) : (
          <div key={m.id} className="group animate-fade-up">
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className={`grid size-6 place-items-center rounded-lg border border-line bg-coal ${
                  m.streaming ? "text-accent" : "text-cream/85"
                }`}
              >
                <Logo size={13} className={m.streaming ? "animate-pulse" : ""} />
              </span>
              <span className="text-[11px] font-medium tracking-wide text-muted">
                {m.model || "Rawchat"}
                {m.streaming && " · streaming"}
              </span>
            </div>
            {m.reasoning && <Reasoning text={m.reasoning} active={!!m.streaming && !m.content} />}
            {m.error ? (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-4 py-3 text-[13.5px] leading-relaxed text-red-300">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <div className="mb-0.5 font-semibold">Request failed</div>
                  <div className="font-mono text-[12px] break-all opacity-80">{m.error}</div>
                </div>
              </div>
            ) : m.content ? (
              <div className={m.streaming ? "stream-caret" : ""}>
                <Markdown content={m.content} />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 py-2">
                <span className="thinking-dot size-1.5 rounded-full bg-accent" />
                <span className="thinking-dot size-1.5 rounded-full bg-accent" />
                <span className="thinking-dot size-1.5 rounded-full bg-accent" />
              </div>
            )}
            {!m.streaming && (m.content || m.error) && (
              <div className="mt-2 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                {m.content && <CopyBtn text={m.content} label="Copy" />}
                {m.id === lastAssistantId && (
                  <button
                    onClick={onRegenerate}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-muted transition hover:bg-white/5 hover:text-cream"
                  >
                    <RefreshCw size={12.5} /> {m.error ? "Retry" : "Regenerate"}
                  </button>
                )}
              </div>
            )}
          </div>
        ),
      )}
    </div>
  );
}
