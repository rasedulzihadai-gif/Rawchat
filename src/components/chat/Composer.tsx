"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  ChevronDown,
  KeyRound,
  MessageSquare,
  Code2,
  PenLine,
  Lightbulb,
} from "lucide-react";
import { MODES } from "@/lib/providers";

const MODE_ICONS: Record<string, any> = {
  MessageSquare,
  Code2,
  PenLine,
  Lightbulb,
};

export default function Composer({
  value,
  onChange,
  onSend,
  streaming,
  onStop,
  mode,
  onModeChange,
  modelLabel,
  providerColor,
  onOpenPicker,
  needsSetup,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  streaming: boolean;
  onStop: () => void;
  mode: string;
  onModeChange: (m: string) => void;
  modelLabel: string;
  providerColor: string;
  onOpenPicker: () => void;
  needsSetup: boolean;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const ModeIcon = MODE_ICONS[MODES[mode]?.icon || "MessageSquare"] || MessageSquare;

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 220) + "px";
  }, [value]);

  useEffect(() => {
    taRef.current?.focus();
  }, []);

  const canSend = value.trim().length > 0 && !streaming && !needsSetup;

  return (
    <div className="w-full px-4 pb-4 md:px-6 md:pb-5">
      <div className="mx-auto max-w-3xl">
        {needsSetup && (
          <button
            onClick={onOpenPicker}
            className="mb-2 flex w-full items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/[0.08] px-4 py-2.5 text-left text-[13px] text-amber-200/90 transition hover:bg-amber-500/[0.14]"
          >
            <KeyRound size={14} className="shrink-0" />
            Add an API key to start chatting — free options take ~30 seconds.{" "}
            <span className="ml-auto shrink-0 font-semibold underline underline-offset-2">
              Set up
            </span>
          </button>
        )}
        <div className="rounded-[26px] border border-line-strong bg-elevated/90 shadow-[0_18px_60px_-18px_rgba(0,0,0,0.7)] backdrop-blur transition-colors focus-within:border-cream/25">
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSend) onSend();
              }
            }}
            rows={1}
            placeholder={
              needsSetup ? "Connect a provider first…" : "Reply to Rawchat…"
            }
            className="max-h-[220px] w-full resize-none bg-transparent px-5 pt-4 pb-1 text-[15px] leading-relaxed text-cream outline-none placeholder:text-muted"
          />
          <div className="flex items-center gap-2 px-3 pt-1 pb-3">
            {/* mode picker */}
            <div className="relative">
              <button
                onClick={() => setModeOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-fog transition hover:border-cream/25 hover:text-cream"
              >
                <ModeIcon size={12.5} className="text-accent" />
                {MODES[mode]?.label || "Chat"}
                <ChevronDown size={11} className="opacity-60" />
              </button>
              {modeOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setModeOpen(false)} />
                  <div className="absolute bottom-full left-0 z-40 mb-2 w-44 overflow-hidden rounded-xl border border-line-strong bg-panel shadow-2xl">
                    {Object.values(MODES).map((m) => {
                      const Icon = MODE_ICONS[m.icon] || MessageSquare;
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            onModeChange(m.id);
                            setModeOpen(false);
                          }}
                          className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition ${
                            m.id === mode
                              ? "bg-accent/10 text-cream"
                              : "text-fog hover:bg-white/5 hover:text-cream"
                          }`}
                        >
                          <Icon size={13.5} className={m.id === mode ? "text-accent" : "text-muted"} />
                          {m.label}
                          {m.id === mode && <span className="ml-auto size-1.5 rounded-full bg-accent" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* model chip */}
            <button
              onClick={onOpenPicker}
              className="flex max-w-[46%] items-center gap-1.5 truncate rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-fog transition hover:border-cream/25 hover:text-cream"
              title={modelLabel}
            >
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: providerColor }} />
              <span className="truncate">{modelLabel}</span>
              <ChevronDown size={11} className="shrink-0 opacity-60" />
            </button>

            <div className="flex-1" />

            {streaming ? (
              <button
                onClick={onStop}
                className="grid size-9 place-items-center rounded-full border border-line-strong bg-raised text-cream transition hover:border-cream/30"
                title="Stop generating"
              >
                <Square size={12} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!canSend}
                className={`grid size-9 place-items-center rounded-full transition ${
                  canSend
                    ? "bg-accent text-white hover:scale-105 hover:bg-accent-strong active:scale-95"
                    : "cursor-not-allowed bg-raised text-muted/50"
                }`}
                title="Send"
              >
                <ArrowUp size={16} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted/70">
          Rawchat can make mistakes — verify important information.
        </p>
      </div>
    </div>
  );
}
