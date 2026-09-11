"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Check,
  X,
  PanelLeftClose,
} from "lucide-react";

export interface ConvItem {
  id: string;
  title: string;
  model: string;
  updatedAt: string;
}

function Logo({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <path
        d="M70 14.7 Q80 27.4 93.4 31.2 Q106.8 35 103.4 48.5 Q100 62 103.4 75.5 Q106.8 89 93.4 92.8 Q80 96.6 70 107.3 Q60 118 50 107.3 Q40 96.6 26.6 92.8 Q13.2 89 16.6 75.5 Q20 62 16.6 48.5 Q13.2 35 26.6 31.2 Q40 27.4 50 14.7 Q60 2 70 14.7 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export { Logo };

function groupByDate(convs: ConvItem[]) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86400000;
  const groups: Record<string, ConvItem[]> = {};
  const label = (ts: string) => {
    const t = new Date(ts).getTime();
    if (t >= startOfDay) return "Today";
    if (t >= startOfDay - day) return "Yesterday";
    if (t >= startOfDay - 7 * day) return "Previous 7 days";
    return "Older";
  };
  for (const c of convs) {
    const l = label(c.updatedAt);
    (groups[l] ||= []).push(c);
  }
  const order = ["Today", "Yesterday", "Previous 7 days", "Older"];
  return order.filter((k) => groups[k]).map((k) => ({ label: k, items: groups[k] }));
}

export default function Sidebar({
  convs,
  activeId,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onOpenSettings,
  onClose,
}: {
  convs: ConvItem[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onOpenSettings: () => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");

  const filtered = useMemo(
    () =>
      query
        ? convs.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
        : convs,
    [convs, query],
  );
  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const commitRename = (id: string) => {
    const t = renameText.trim();
    if (t) onRename(id, t);
    setRenaming(null);
  };

  return (
    <div className="flex h-full w-full flex-col bg-coal/70">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <Link href="/" className="flex items-center gap-2 text-cream" title="Rawchat home">
          <Logo size={22} />
          <span className="font-display text-lg font-semibold tracking-tight">Rawchat</span>
        </Link>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream"
          title="Close sidebar"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      {/* new chat */}
      <div className="px-3 pb-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2.5 rounded-xl border border-line-strong bg-elevated/60 px-3.5 py-2.5 text-sm font-medium text-cream transition hover:border-cream/25 hover:bg-elevated"
        >
          <span className="grid size-5 place-items-center rounded-full bg-accent text-white">
            <Plus size={13} strokeWidth={2.6} />
          </span>
          New chat
        </button>
      </div>

      {/* search */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-transparent px-3 py-2 text-sm text-fog focus-within:border-line-strong">
          <Search size={14} className="text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-cream outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {/* conversations */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.length === 0 && (
          <div className="mt-8 px-2 text-center text-xs leading-relaxed text-muted">
            {query ? "No chats match your search." : "No conversations yet.\nStart something raw."}
          </div>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mt-4">
            <div className="mb-1 px-2 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
              {g.label}
            </div>
            <ul className="space-y-0.5">
              {g.items.map((c) => (
                <li key={c.id} className="group relative">
                  {renaming === c.id ? (
                    <div className="flex items-center gap-1 rounded-lg border border-line-strong bg-elevated px-2 py-1.5">
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(c.id);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        className="w-full bg-transparent text-sm text-cream outline-none"
                      />
                      <button onClick={() => commitRename(c.id)} className="p-1 text-mint">
                        <Check size={13} />
                      </button>
                      <button onClick={() => setRenaming(null)} className="p-1 text-muted">
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelect(c.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition ${
                        activeId === c.id
                          ? "bg-elevated text-cream"
                          : "text-fog hover:bg-white/[0.045] hover:text-cream"
                      }`}
                    >
                      <MessageSquare size={14} className="shrink-0 text-muted" />
                      <span className="flex-1 truncate">{c.title}</span>
                      <span className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenaming(c.id);
                            setRenameText(c.title);
                          }}
                          className="rounded p-1 text-muted hover:text-cream"
                          title="Rename"
                        >
                          <Pencil size={12} />
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Delete this conversation?")) onDelete(c.id);
                          }}
                          className="rounded p-1 text-muted hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </span>
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="border-t border-line p-3">
        <button
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-fog transition hover:bg-white/[0.045] hover:text-cream"
        >
          <Settings size={15} className="text-muted" />
          Keys & settings
        </button>
      </div>
    </div>
  );
}
