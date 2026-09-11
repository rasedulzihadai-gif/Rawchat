"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Check,
  Plus,
  Eye,
  EyeOff,
  Server,
  CircleCheck,
  Loader2,
} from "lucide-react";
import { PROVIDERS, type CustomProvider, type ProviderPreset } from "@/lib/providers";

export type ProviderRef =
  | { kind: "preset"; p: ProviderPreset }
  | { kind: "custom"; p: CustomProvider };

function resolveBaseUrl(p: ProviderRef, accountId?: string) {
  return p.p.baseUrl.replace("{account_id}", accountId || "");
}

export default function ModelPicker({
  open,
  onClose,
  keys,
  onKeyChange,
  accountIds,
  onAccountIdChange,
  customProviders,
  onAddCustomProvider,
  customModels,
  onCustomModelsChange,
  activeProviderId,
  activeModel,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  keys: Record<string, string>;
  onKeyChange: (id: string, key: string) => void;
  accountIds: Record<string, string>;
  onAccountIdChange: (id: string, v: string) => void;
  customProviders: CustomProvider[];
  onAddCustomProvider: (p: CustomProvider) => void;
  customModels: Record<string, string[]>;
  onCustomModelsChange: (id: string, models: string[]) => void;
  activeProviderId: string;
  activeModel: string;
  onPick: (providerId: string, model: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [selId, setSelId] = useState(activeProviderId || "groq");
  const [showKey, setShowKey] = useState(false);
  const [fetched, setFetched] = useState<Record<string, string[]>>({});
  const [fetchState, setFetchState] = useState<{ loading: boolean; ok?: boolean; err?: string }>({ loading: false });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [addModelText, setAddModelText] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [cpName, setCpName] = useState("");
  const [cpUrl, setCpUrl] = useState("");

  useEffect(() => {
    if (open) setSelId(activeProviderId || "groq");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const all: ProviderRef[] = useMemo(
    () => [
      ...PROVIDERS.map((p) => ({ kind: "preset", p }) as ProviderRef),
      ...customProviders.map((p) => ({ kind: "custom", p }) as ProviderRef),
    ],
    [customProviders],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (r) =>
            r.p.name.toLowerCase().includes(q) ||
            ("note" in r.p && r.p.note?.toLowerCase().includes(q)),
        )
      : all;
    return [...filtered].sort((a, b) => {
      const af = "free" in a.p && a.p.free ? 0 : 1;
      const bf = "free" in b.p && b.p.free ? 0 : 1;
      return af - bf || a.p.name.localeCompare(b.p.name);
    });
  }, [all, query]);

  const sel = all.find((r) => r.p.id === selId) || all[0];
  const selPreset = sel?.kind === "preset" ? (sel.p as ProviderPreset) : null;
  const requiresKey = sel ? ("requiresKey" in sel.p ? sel.p.requiresKey : true) : true;
  const keyVal = keys[sel?.p.id || ""] || "";
  const accountId = accountIds[sel?.p.id || ""] || "";

  const modelsFor = (r: ProviderRef): string[] => {
    const f = fetched[r.p.id];
    const extra = customModels[r.p.id] || [];
    const base = f && f.length ? f : r.p.defaultModels || [];
    return [...base.filter((m) => !extra.includes(m)), ...extra];
  };

  const hasCreds = (r: ProviderRef) => {
    const req = "requiresKey" in r.p ? r.p.requiresKey : true;
    if (!req) return true;
    if (!keys[r.p.id]) return false;
    if ("needsAccountId" in r.p && r.p.needsAccountId && !accountIds[r.p.id]) return false;
    return true;
  };

  const doFetch = async () => {
    if (!sel) return;
    setFetchState({ loading: true });
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: resolveBaseUrl(sel, accountId),
          apiKey: keyVal,
          api: sel.kind === "preset" ? (sel.p as ProviderPreset).api : "openai",
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      const models: string[] = j.models || [];
      setFetched((f) => ({ ...f, [sel.p.id]: models }));
      setFetchState({ loading: false, ok: true });
    } catch (e) {
      setFetchState({
        loading: false,
        ok: false,
        err: e instanceof Error ? e.message : "Failed",
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-up relative flex h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-line-strong bg-panel shadow-2xl sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-cream">Models & providers</h2>
            <p className="text-[12px] text-muted">
              Free and paid providers · keys are stored only in this browser
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-cream"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* left: provider list */}
          <div className="flex w-full max-w-[290px] flex-col border-r border-line max-sm:max-w-none">
            <div className="p-3">
              <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm focus-within:border-line-strong">
                <Search size={14} className="text-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search providers"
                  className="w-full bg-transparent text-cream outline-none placeholder:text-muted"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {list.map((r) => {
                const isCustom = r.kind === "custom";
                const free = !isCustom && (r.p as ProviderPreset).free;
                return (
                  <button
                    key={r.p.id}
                    onClick={() => {
                      setSelId(r.p.id);
                      setFetchState({ loading: false });
                      setShowKeyInput(false);
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${
                      selId === r.p.id ? "bg-elevated" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: (r.p as any).color || "#8f897c" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-cream">
                        {r.p.name}
                      </span>
                      <span className="block truncate text-[11px] text-muted">
                        {isCustom ? "Custom endpoint" : (r.p as ProviderPreset).note}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {free && (
                        <span className="rounded-full bg-mint/10 px-1.5 py-px text-[9px] font-bold tracking-wider text-mint uppercase">
                          free
                        </span>
                      )}
                      {isCustom && (
                        <span className="rounded-full bg-white/10 px-1.5 py-px text-[9px] font-bold tracking-wider text-fog uppercase">
                          custom
                        </span>
                      )}
                      {hasCreds(r) ? (
                        <CircleCheck size={12} className="text-mint/80" />
                      ) : (
                        <KeyRound size={12} className="text-muted/60" />
                      )}
                    </span>
                  </button>
                );
              })}
              {/* add custom */}
              <div className="mt-2 border-t border-line pt-2">
                {!addingCustom ? (
                  <button
                    onClick={() => setAddingCustom(true)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-[13px] text-fog transition hover:bg-white/[0.04] hover:text-cream"
                  >
                    <Plus size={14} className="text-accent" /> Add custom endpoint
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg border border-line-strong bg-coal/60 p-3">
                    <div className="flex items-center gap-2 text-[12px] font-medium text-cream">
                      <Server size={13} className="text-accent" /> OpenAI-compatible endpoint
                    </div>
                    <input
                      value={cpName}
                      onChange={(e) => setCpName(e.target.value)}
                      placeholder="Name (e.g. Together AI)"
                      className="w-full rounded-lg border border-line bg-transparent px-2.5 py-1.5 text-[12.5px] text-cream outline-none placeholder:text-muted focus:border-line-strong"
                    />
                    <input
                      value={cpUrl}
                      onChange={(e) => setCpUrl(e.target.value)}
                      placeholder="https://api.example.com/v1"
                      className="w-full rounded-lg border border-line bg-transparent px-2.5 py-1.5 font-mono text-[12px] text-cream outline-none placeholder:text-muted focus:border-line-strong"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const name = cpName.trim();
                          const url = cpUrl.trim().replace(/\/+$/, "");
                          if (!name || !/^https?:\/\//.test(url)) return;
                          const p: CustomProvider = {
                            id: `custom-${Date.now()}`,
                            name,
                            baseUrl: url,
                            requiresKey: true,
                            defaultModels: [],
                          };
                          onAddCustomProvider(p);
                          setSelId(p.id);
                          setAddingCustom(false);
                          setCpName("");
                          setCpUrl("");
                        }}
                        className="flex-1 rounded-lg bg-accent px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-accent-strong"
                      >
                        Add provider
                      </button>
                      <button
                        onClick={() => setAddingCustom(false)}
                        className="rounded-lg border border-line px-3 py-1.5 text-[12px] text-muted hover:text-cream"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* right: provider detail */}
          {sel && (
            <div className="flex min-w-0 flex-1 flex-col max-sm:hidden">
              <div className="border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: (sel.p as any).color || "#8f897c" }}
                  />
                  <h3 className="font-display text-xl font-semibold text-cream">{sel.p.name}</h3>
                  {selPreset?.keyUrl && (
                    <a
                      href={selPreset.keyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-auto flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-[11.5px] font-medium text-fog transition hover:border-cream/25 hover:text-cream"
                    >
                      <KeyRound size={11.5} /> Get API key <ExternalLink size={10.5} />
                    </a>
                  )}
                </div>
                {selPreset?.note && <p className="mt-1 pl-6 text-[12px] text-muted">{selPreset.note}</p>}
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
                {/* credentials */}
                {requiresKey ? (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setShowKeyInput((s) => !s)}
                      className={`flex items-center gap-2 text-[12px] font-medium ${
                        keyVal ? "text-mint" : "text-amber-300"
                      }`}
                    >
                      <KeyRound size={12.5} />
                      {keyVal ? "API key saved in browser" : "API key required — click to add"}
                    </button>
                    {(showKeyInput || !keyVal) && (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKey ? "text" : "password"}
                            value={keyVal}
                            onChange={(e) => onKeyChange(sel.p.id, e.target.value.trim())}
                            placeholder="Paste your API key…"
                            autoComplete="off"
                            className="w-full rounded-lg border border-line bg-transparent py-2 pr-9 pl-3 font-mono text-[12.5px] text-cream outline-none placeholder:text-muted focus:border-cream/30"
                          />
                          <button
                            onClick={() => setShowKey((s) => !s)}
                            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-cream"
                          >
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    )}
                    {selPreset?.needsAccountId && (
                      <input
                        value={accountId}
                        onChange={(e) => onAccountIdChange(sel.p.id, e.target.value.trim())}
                        placeholder="Cloudflare Account ID"
                        className="w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-[12.5px] text-cream outline-none placeholder:text-muted focus:border-cream/30"
                      />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-[12px] font-medium text-mint">
                    <CircleCheck size={13} /> No API key needed — works out of the box
                  </div>
                )}

                {/* models */}
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[12px] font-semibold tracking-wide text-fog uppercase">
                      Models
                    </span>
                    <button
                      onClick={doFetch}
                      disabled={fetchState.loading || (requiresKey && !keyVal)}
                      className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-fog transition hover:border-cream/25 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                      title="Fetch live model list from provider"
                    >
                      {fetchState.loading ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <RefreshCw size={11} />
                      )}
                      {fetched[sel.p.id] ? "Refresh list" : "Fetch models"}
                    </button>
                    {fetchState.ok && (
                      <span className="flex items-center gap-1 text-[11px] text-mint">
                        <Check size={11} /> {fetched[sel.p.id]?.length ?? 0} available
                      </span>
                    )}
                    {fetchState.err && (
                      <span className="max-w-[180px] truncate text-[11px] text-red-400" title={fetchState.err}>
                        {fetchState.err}
                      </span>
                    )}
                  </div>
                  <div className="overflow-hidden rounded-xl border border-line">
                    <div className="max-h-[42vh] overflow-y-auto">
                      {modelsFor(sel).length === 0 && (
                        <div className="px-4 py-6 text-center text-[12px] text-muted">
                          No models yet — fetch the list or add one below.
                        </div>
                      )}
                      {modelsFor(sel).map((m) => {
                        const isActive = activeProviderId === sel.p.id && activeModel === m;
                        return (
                          <button
                            key={m}
                            onClick={() => {
                              onPick(sel.p.id, m);
                              onClose();
                            }}
                            className={`flex w-full items-center gap-2 border-b border-line/60 px-4 py-2.5 text-left font-mono text-[12.5px] transition last:border-0 ${
                              isActive ? "bg-accent/10 text-cream" : "text-fog hover:bg-white/[0.04] hover:text-cream"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">{m}</span>
                            {m.includes(":free") && (
                              <span className="rounded-full bg-mint/10 px-1.5 py-px font-sans text-[9px] font-bold tracking-wider text-mint uppercase">
                                free
                              </span>
                            )}
                            {isActive && <Check size={13} className="shrink-0 text-accent" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* manual add */}
                  <div className="mt-2 flex gap-2">
                    <input
                      value={addModelText}
                      onChange={(e) => setAddModelText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && addModelText.trim()) {
                          onCustomModelsChange(sel.p.id, [
                            ...(customModels[sel.p.id] || []),
                            addModelText.trim(),
                          ]);
                          setAddModelText("");
                        }
                      }}
                      placeholder="Add a model ID manually…"
                      className="flex-1 rounded-lg border border-line bg-transparent px-3 py-1.5 font-mono text-[12px] text-cream outline-none placeholder:text-muted focus:border-line-strong"
                    />
                    <button
                      onClick={() => {
                        if (!addModelText.trim()) return;
                        onCustomModelsChange(sel.p.id, [
                          ...(customModels[sel.p.id] || []),
                          addModelText.trim(),
                        ]);
                        setAddModelText("");
                      }}
                      className="rounded-lg border border-line px-3 text-[12px] text-fog transition hover:border-cream/25 hover:text-cream"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
