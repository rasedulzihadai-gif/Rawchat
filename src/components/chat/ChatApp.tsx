"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, MonitorPlay, ChevronDown, Code2, MessageSquare, PenLine, Lightbulb } from "lucide-react";
import Sidebar, { Logo, type ConvItem } from "./Sidebar";
import MessageList, { type ChatMsg } from "./MessageList";
import Composer from "./Composer";
import ModelPicker from "./ModelPicker";
import SettingsDialog from "./SettingsDialog";
import PreviewPanel, { extractArtifact } from "./PreviewPanel";
import { MODES, PROVIDERS, getProvider, type CustomProvider } from "@/lib/providers";
import { store } from "@/lib/storage";

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface Conv extends ConvItem {
  providerId: string;
}

const SUGGESTIONS = [
  {
    icon: Code2,
    mode: "code",
    title: "Build a UI I can preview",
    text: "Build a beautiful landing page for a specialty coffee brand — hero, features, pricing table. One self-contained HTML file.",
  },
  {
    icon: MessageSquare,
    mode: "chat",
    title: "Explain anything",
    text: "Explain how large language models actually work, like I'm smart but new to AI.",
  },
  {
    icon: PenLine,
    mode: "write",
    title: "Write something beautiful",
    text: "Write a short atmospheric poem about monsoon rain over the Dhaka skyline.",
  },
  {
    icon: Lightbulb,
    mode: "brainstorm",
    title: "Brainstorm with me",
    text: "Give me 10 unconventional startup ideas combining AI with agriculture in South Asia.",
  },
];

export default function ChatApp({ initialUser }: { initialUser: { email: string } }) {
  const [mounted, setMounted] = useState(false);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [keys, setKeys] = useState<Record<string, string>>({});
  const [accountIds, setAccountIds] = useState<Record<string, string>>({});
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const [customModels, setCustomModels] = useState<Record<string, string[]>>({});
  const [active, setActive] = useState({ providerId: "groq", model: "llama-3.3-70b-versatile", mode: "chat" });

  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPreviewRef = useRef<string | null>(null);
  const msgsRef = useRef<ChatMsg[]>([]);
  msgsRef.current = msgs;

  /* ── load persisted state ─────────────────── */
  const refreshConvs = useCallback(async () => {
    try {
      const r = await fetch("/api/conversations");
      if (r.status === 401) {
        window.location.href = "/login";
        return;
      }
      const j = await r.json().catch(() => ({}));
      if (r.ok) setConvs(j.conversations || []);
      // 503 = no database configured; sidebar simply stays empty.
    } catch {
      /* db may be unavailable */
    }
  }, []);

  useEffect(() => {
    setKeys(store.getKeys());
    setAccountIds(store.getAccountIds());
    setCustomProviders(store.getCustomProviders());
    setCustomModels(store.getCustomModels());
    const a = store.getActive();
    if (a?.providerId && a?.model) {
      const custom = store.getCustomProviders();
      if (getProvider(a.providerId) || custom.some((c) => c.id === a.providerId)) {
        setActive({ providerId: a.providerId, model: a.model, mode: a.mode || "chat" });
      }
    }
    setSidebarOpen(window.innerWidth >= 1024);
    refreshConvs();
    setMounted(true);
  }, [refreshConvs]);

  useEffect(() => {
    if (mounted) store.setActive(active);
  }, [active, mounted]);

  /* ── provider resolution ──────────────────── */
  const provider = useMemo(() => {
    return (
      getProvider(active.providerId) ||
      customProviders.find((c) => c.id === active.providerId) ||
      null
    );
  }, [active.providerId, customProviders]);

  const baseUrl = useMemo(
    () => provider?.baseUrl.replace("{account_id}", accountIds[provider.id] || "") || "",
    [provider, accountIds],
  );

  const needsSetup = useMemo(() => {
    if (!provider) return true;
    if (!provider.requiresKey) return false;
    if (!keys[provider.id]) return true;
    if ("needsAccountId" in provider && provider.needsAccountId && !accountIds[provider.id])
      return true;
    return false;
  }, [provider, keys, accountIds]);

  const activeConv = convs.find((c) => c.id === activeId) || null;

  /* ── scrolling ────────────────────────────── */
  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 420;
    if (nearBottom) scrollToBottom(msgs.some((m) => m.streaming) ? false : true);
  }, [msgs, scrollToBottom]);

  /* ── artifact preview ─────────────────────── */
  const lastAssistant = [...msgs].reverse().find((m) => m.role === "assistant");
  const artifact = lastAssistant ? extractArtifact(lastAssistant.content) : null;

  useEffect(() => {
    if (artifact && lastAssistant && !lastAssistant.streaming) {
      if (autoPreviewRef.current !== lastAssistant.id) {
        autoPreviewRef.current = lastAssistant.id;
        setPreviewOpen(true);
      }
    }
  }, [artifact, lastAssistant]);

  /* ── conversation ops ─────────────────────── */
  const patchMsg = useCallback((id: string, fn: (m: ChatMsg) => Partial<ChatMsg>) => {
    setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, ...fn(m) } : m)));
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMsgs([]);
    setInput("");
    setPreviewOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const selectConv = useCallback(
    async (id: string) => {
      if (id === activeId) return;
      abortRef.current?.abort();
      setStreaming(false);
      setActiveId(id);
      setPreviewOpen(false);
      setLoadingMsgs(true);
      if (window.innerWidth < 768) setSidebarOpen(false);
      try {
        const r = await fetch(`/api/conversations/${id}/messages`);
        if (r.status === 401) {
          window.location.href = "/login";
          return;
        }
        const j = await r.json().catch(() => ({}));
        setMsgs(
          (j.messages || []).map((m: any) => ({
            id: m.id,
            dbId: m.id,
            role: m.role,
            content: m.content,
            model: m.model || undefined,
          })),
        );
        const conv = convs.find((c) => c.id === id);
        if (conv?.providerId && conv?.model) {
          setActive((a) => ({ ...a, providerId: conv.providerId, model: conv.model }));
        }
      } catch {
        setMsgs([]);
      }
      setLoadingMsgs(false);
      setTimeout(() => scrollToBottom(), 50);
    },
    [activeId, convs, scrollToBottom],
  );

  const deleteConv = useCallback(
    async (id: string) => {
      setConvs((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) newChat();
      await fetch(`/api/conversations/${id}`, { method: "DELETE" }).catch(() => {});
    },
    [activeId, newChat],
  );

  const renameConv = useCallback(async (id: string, title: string) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }).catch(() => {});
  }, []);

  /* ── streaming ────────────────────────────── */
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;
      if (!provider || needsSetup) {
        setPickerOpen(true);
        setInput(trimmed);
        return;
      }
      setInput("");

      let convId = activeId;
      if (!convId) {
        try {
          const r = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ providerId: active.providerId, model: active.model }),
          });
          if (r.status === 401) {
            window.location.href = "/login";
            return;
          }
          const j = await r.json().catch(() => ({}));
          if (r.ok && j.conversation?.id) {
            convId = j.conversation.id;
            setConvs((prev) => [j.conversation, ...prev]);
            setActiveId(convId);
          }
          // If persistence is unavailable (no DB), continue in-memory.
        } catch {
          /* continue without persistence */
        }
      } else {
        fetch(`/api/conversations/${convId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId: active.providerId, model: active.model }),
        }).catch(() => {});
      }

      const userMsg: ChatMsg = { id: uid(), role: "user", content: trimmed };
      setMsgs((prev) => [...prev, userMsg]);

      if (convId) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: trimmed }),
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.message?.id) patchMsg(userMsg.id, () => ({ dbId: j.message.id }));
          })
          .catch(() => {});
      }

      // runStream reads activeId from closure — ensure it's the fresh one
      await runStreamWithConv([...msgsRef.current.filter((m) => !m.streaming && !m.error), userMsg], convId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [streaming, provider, needsSetup, activeId, active, patchMsg],
  );

  // runStream needs the latest convId even just-created; wrap it
  const runStreamWithConv = useCallback(
    async (history: ChatMsg[], convId: string | null) => {
      const prevActive = activeId;
      // temporarily ensure persistence targets the right conversation
      if (convId && convId !== prevActive) setActiveId(convId);
      await persistAwareStream(history, convId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeId, msgsRef.current.length],
  );

  const persistAwareStream = useCallback(
    async (history: ChatMsg[], convId: string | null) => {
      if (!provider) return;
      const asstId = uid();
      const modelTag = `${provider.name} · ${active.model}`;
      setMsgs((prev) => [
        ...prev,
        { id: asstId, role: "assistant", content: "", reasoning: "", model: modelTag, streaming: true },
      ]);
      setStreaming(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let acc = "";
      let reasoningAcc = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            baseUrl,
            apiKey: keys[provider.id] || "",
            api: "api" in provider ? provider.api : "openai",
            model: active.model,
            system: MODES[active.mode]?.prompt,
            messages: history
              .filter((m) => !m.error && m.content)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok || !res.body) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";
          for (const ev of events) {
            const line = ev.trim();
            if (!line.startsWith("data:")) continue;
            let payload: any;
            try {
              payload = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }
            if (payload.type === "delta" && payload.text) {
              acc += payload.text;
              const s = acc;
              patchMsg(asstId, () => ({ content: s }));
            } else if (payload.type === "reasoning" && payload.text) {
              reasoningAcc += payload.text;
              const s = reasoningAcc;
              patchMsg(asstId, () => ({ reasoning: s }));
            } else if (payload.type === "error") {
              throw new Error(payload.message || "Provider error");
            }
          }
        }
        patchMsg(asstId, () => ({ streaming: false }));
      } catch (e) {
        const aborted = controller.signal.aborted;
        patchMsg(asstId, () => ({
          streaming: false,
          ...(aborted ? {} : { error: e instanceof Error ? e.message : "Something went wrong" }),
        }));
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
      const final = msgsRef.current.find((m) => m.id === asstId);
      if (convId && final && (final.content || final.error)) {
        fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: "assistant",
            content: final.content || `⚠️ ${final.error}`,
            model: modelTag,
          }),
        })
          .then((r) => r.json())
          .then((j) => {
            if (j.message?.id) patchMsg(asstId, () => ({ dbId: j.message.id }));
            refreshConvs();
          })
          .catch(() => {});
      } else {
        refreshConvs();
      }
    },
    [provider, active, baseUrl, keys, patchMsg, refreshConvs],
  );

  const regenerate = useCallback(async () => {
    if (streaming) return;
    const current = msgsRef.current;
    const idx = [...current].reverse().findIndex((m) => m.role === "assistant");
    if (idx === -1) return;
    const asst = [...current].reverse()[idx];
    const history = current.slice(0, current.length - idx - 1).filter((m) => !m.error);
    if (asst.dbId && activeId) {
      fetch(`/api/conversations/${activeId}/messages`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [asst.dbId] }),
      }).catch(() => {});
    }
    setMsgs(history);
    if (!provider || needsSetup) {
      setMsgs(current);
      setPickerOpen(true);
      return;
    }
    await persistAwareStream(history, activeId);
  }, [streaming, activeId, provider, needsSetup, persistAwareStream]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/login";
  }, []);

  /* ── keys / custom providers ──────────────── */
  const handleKeyChange = (id: string, key: string) => {
    store.setKey(id, key);
    setKeys(store.getKeys());
  };
  const handleAccountId = (id: string, v: string) => {
    store.setAccountId(id, v);
    setAccountIds(store.getAccountIds());
  };
  const handleAddCustomProvider = (p: CustomProvider) => {
    const next = [...customProviders, p];
    setCustomProviders(next);
    store.setCustomProviders(next);
  };
  const handleDeleteCustomProvider = (id: string) => {
    const next = customProviders.filter((p) => p.id !== id);
    setCustomProviders(next);
    store.setCustomProviders(next);
  };
  const handleCustomModels = (id: string, models: string[]) => {
    store.setCustomModelsFor(id, models);
    setCustomModels(store.getCustomModels());
  };
  const handlePick = (providerId: string, model: string) => {
    setActive((a) => ({ ...a, providerId, model }));
  };
  const clearKeys = () => {
    store.wipe();
    setKeys({});
    setAccountIds({});
    setCustomProviders([]);
    setCustomModels({});
  };
  const clearChats = async () => {
    for (const c of convs) {
      await fetch(`/api/conversations/${c.id}`, { method: "DELETE" }).catch(() => {});
    }
    setConvs([]);
    newChat();
  };

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Up late? Let's make it count.";
    if (h < 12) return "Good morning. What's on your mind?";
    if (h < 18) return "Good afternoon. What are we building?";
    return "Good evening. Ready when you are.";
  }, []);

  const providerColor = (provider as any)?.color || "#8f897c";
  const modelLabel = active.model ? active.model.split("/").pop() || active.model : "Pick a model";

  if (!mounted) {
    return (
      <div className="grid h-dvh place-items-center bg-ink">
        <Logo size={40} className="animate-pulse text-cream/80" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-ink">
      {/* sidebar */}
      <div
        className={`shrink-0 overflow-hidden border-r border-line bg-[#1a1917] transition-[width,transform] duration-300 max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40 max-md:w-[278px] max-md:shadow-2xl ${
          sidebarOpen
            ? "w-[278px] max-md:translate-x-0"
            : "w-0 max-md:w-[278px] max-md:-translate-x-full"
        }`}
      >
        <div className="h-full w-[278px]">
          <Sidebar
            convs={convs}
            activeId={activeId}
            onNew={newChat}
            onSelect={selectConv}
            onDelete={deleteConv}
            onRename={renameConv}
            onOpenSettings={() => setSettingsOpen(true)}
            onClose={() => setSidebarOpen(false)}
            userEmail={initialUser.email}
            onLogout={logout}
          />
        </div>
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* topbar */}
        <div className="flex h-13 shrink-0 items-center gap-1.5 border-b border-line px-3 py-2.5">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-cream"
              title="Open sidebar"
            >
              <PanelLeft size={17} />
            </button>
          )}
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="rounded-lg p-2 text-muted transition hover:bg-white/5 hover:text-cream md:hidden"
              title="Close sidebar"
            >
              <PanelLeft size={17} />
            </button>
          )}
          <h1 className="min-w-0 flex-1 truncate px-1 text-[13.5px] font-medium text-fog">
            {activeConv?.title || "New chat"}
          </h1>
          {artifact && (
            <button
              onClick={() => setPreviewOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition ${
                previewOpen
                  ? "border-accent/40 bg-accent-soft text-accent-strong"
                  : "border-line text-fog hover:border-cream/25 hover:text-cream"
              }`}
            >
              <MonitorPlay size={13} /> Preview
            </button>
          )}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex max-w-[52%] items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-medium text-fog transition hover:border-cream/25 hover:text-cream"
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ background: providerColor }} />
            <span className="truncate">{modelLabel}</span>
            <ChevronDown size={11} className="shrink-0 opacity-60" />
          </button>
        </div>

        {/* content row: chat + preview */}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              {msgs.length === 0 && !loadingMsgs ? (
                <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-10">
                  <div className="animate-fade-up text-center">
                    <div className="mx-auto mb-6 grid size-14 place-items-center rounded-2xl border border-line-strong bg-coal text-cream shadow-xl">
                      <Logo size={28} />
                    </div>
                    <h2 className="font-display text-3xl font-semibold tracking-tight text-cream md:text-4xl">
                      {greeting}
                    </h2>
                    <p className="mt-3 text-sm text-muted">
                      {provider ? (
                        <>
                          Talking to{" "}
                          <span className="font-medium text-fog">{provider.name}</span>
                          {!needsSetup ? " — everything's connected." : " — add a key to begin."}
                        </>
                      ) : (
                        "Pick a provider to begin."
                      )}
                    </p>
                  </div>
                  <div className="mt-10 grid w-full gap-2.5 sm:grid-cols-2">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={s.title}
                        onClick={() => {
                          setActive((a) => ({ ...a, mode: s.mode }));
                          if (needsSetup) {
                            setInput(s.text);
                            setPickerOpen(true);
                          } else {
                            send(s.text);
                          }
                        }}
                        className="animate-fade-up group flex items-start gap-3 rounded-2xl border border-line bg-panel/60 p-4 text-left transition hover:border-line-strong hover:bg-elevated/70"
                        style={{ animationDelay: `${0.08 * i + 0.15}s` }}
                      >
                        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-coal text-accent transition-transform group-hover:scale-110">
                          <s.icon size={14} />
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-medium text-cream">{s.title}</span>
                          <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-muted">
                            {s.text}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : loadingMsgs ? (
                <div className="grid h-full place-items-center">
                  <Logo size={30} className="animate-pulse text-cream/50" />
                </div>
              ) : (
                <MessageList
                  msgs={msgs}
                  onEdit={(c) => setInput(c)}
                  onRegenerate={regenerate}
                />
              )}
            </div>
            <Composer
              value={input}
              onChange={setInput}
              onSend={() => send(input)}
              streaming={streaming}
              onStop={stop}
              mode={active.mode}
              onModeChange={(m) => setActive((a) => ({ ...a, mode: m }))}
              modelLabel={provider ? `${modelLabel}` : "Pick a model"}
              providerColor={providerColor}
              onOpenPicker={() => setPickerOpen(true)}
              needsSetup={needsSetup}
            />
          </div>
          {previewOpen && artifact && (
            <div className="hidden w-[46%] min-w-[380px] md:block">
              <PreviewPanel
                artifact={artifact}
                onClose={() => {
                  autoPreviewRef.current = lastAssistant?.id || null;
                  setPreviewOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* dialogs */}
      <ModelPicker
        key={pickerOpen ? "open" : "closed"}
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        keys={keys}
        onKeyChange={handleKeyChange}
        accountIds={accountIds}
        onAccountIdChange={handleAccountId}
        customProviders={customProviders}
        onAddCustomProvider={handleAddCustomProvider}
        customModels={customModels}
        onCustomModelsChange={handleCustomModels}
        activeProviderId={active.providerId}
        activeModel={active.model}
        onPick={handlePick}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        keys={keys}
        customProviders={customProviders}
        onDeleteCustomProvider={handleDeleteCustomProvider}
        onClearKeys={clearKeys}
        onClearChats={clearChats}
        convCount={convs.length}
      />
    </div>
  );
}
