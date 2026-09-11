"use client";

import { X, KeyRound, Server, Trash2, ShieldCheck, Database } from "lucide-react";
import { PROVIDERS, type CustomProvider } from "@/lib/providers";

export default function SettingsDialog({
  open,
  onClose,
  keys,
  customProviders,
  onDeleteCustomProvider,
  onClearKeys,
  onClearChats,
  convCount,
}: {
  open: boolean;
  onClose: () => void;
  keys: Record<string, string>;
  customProviders: CustomProvider[];
  onDeleteCustomProvider: (id: string) => void;
  onClearKeys: () => void;
  onClearChats: () => void;
  convCount: number;
}) {
  if (!open) return null;
  const keyEntries = Object.entries(keys);
  const nameOf = (id: string) =>
    PROVIDERS.find((p) => p.id === id)?.name ||
    customProviders.find((p) => p.id === id)?.name ||
    id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-up relative w-full max-w-md overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-cream">Keys & settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-cream"
          >
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[70vh] space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-fog uppercase">
              <KeyRound size={12.5} /> Stored API keys ({keyEntries.length})
            </h3>
            {keyEntries.length === 0 ? (
              <p className="text-[12.5px] text-muted">
                No keys saved yet. Add one from the model picker.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {keyEntries.map(([id, k]) => (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-cream">{nameOf(id)}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted">
                      ••••{k.slice(-4)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {keyEntries.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Remove all stored API keys?")) onClearKeys();
                }}
                className="mt-2.5 flex items-center gap-1.5 text-[12px] text-red-400/90 transition hover:text-red-300"
              >
                <Trash2 size={12} /> Remove all keys
              </button>
            )}
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
              <ShieldCheck size={12} className="mt-0.5 shrink-0 text-mint" />
              Keys live only in your browser&apos;s local storage and are sent directly to the
              provider you choose. They are never written to the database.
            </p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-fog uppercase">
              <Server size={12.5} /> Custom endpoints ({customProviders.length})
            </h3>
            {customProviders.length === 0 ? (
              <p className="text-[12.5px] text-muted">
                Add OpenAI-compatible endpoints from the model picker.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {customProviders.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[12.5px]"
                  >
                    <span className="text-cream">{p.name}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-muted">
                      {p.baseUrl}
                    </span>
                    <button
                      onClick={() => onDeleteCustomProvider(p.id)}
                      className="p-1 text-muted transition hover:text-red-400"
                      title="Delete endpoint"
                    >
                      <Trash2 size={12.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold tracking-wide text-fog uppercase">
              <Database size={12.5} /> Conversations ({convCount})
            </h3>
            <p className="mb-2.5 text-[12.5px] text-muted">
              Chats are stored in your Rawchat database so they survive reloads.
            </p>
            <button
              onClick={() => {
                if (window.confirm("Delete ALL conversations? This cannot be undone."))
                  onClearChats();
              }}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-[12px] text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 size={12} /> Delete all conversations
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
