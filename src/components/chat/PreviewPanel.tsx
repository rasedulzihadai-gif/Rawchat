"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Code2, MonitorPlay, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";

export interface Artifact {
  kind: "html";
  code: string;
}

export function extractArtifact(text: string): Artifact | null {
  if (!text) return null;
  const fence = text.match(/```(?:html|HTML)\s*\n([\s\S]*?)(?:```|$)/);
  if (fence && /<html|<!doctype|<head|<body/i.test(fence[1])) {
    return { kind: "html", code: fence[1].trim() };
  }
  const trimmed = text.trim();
  if (/^<!doctype html/i.test(trimmed) || (/^<html[\s>]/i.test(trimmed) && /<\/html>\s*$/i.test(trimmed))) {
    return { kind: "html", code: trimmed };
  }
  return null;
}

export default function PreviewPanel({
  artifact,
  onClose,
}: {
  artifact: Artifact | null;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [frameKey, setFrameKey] = useState(0);
  const [copied, setCopied] = useState(false);

  const code = artifact?.code ?? "";
  const blobUrl = useMemo(() => {
    if (!code || typeof window === "undefined") return "";
    try {
      return URL.createObjectURL(new Blob([code], { type: "text/html" }));
    } catch {
      return "";
    }
  }, [code]);

  // Revoke stale object URLs so long sessions don't leak memory.
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!artifact) return null;

  return (
    <div className="flex h-full w-full flex-col border-l border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <MonitorPlay size={15} className="text-accent" />
        <span className="text-[13px] font-semibold text-cream">Live preview</span>
        <div className="ml-2 flex rounded-lg border border-line p-0.5">
          {(["preview", "code"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-medium transition ${
                tab === t ? "bg-elevated text-cream" : "text-muted hover:text-fog"
              }`}
            >
              {t === "code" ? <Code2 size={11.5} /> : <MonitorPlay size={11.5} />}
              {t === "code" ? "Code" : "Preview"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setFrameKey((k) => k + 1)}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream"
            title="Reload preview"
          >
            <RefreshCw size={13.5} />
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(code).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream"
            title="Copy code"
          >
            {copied ? <Check size={13.5} className="text-mint" /> : <Copy size={13.5} />}
          </button>
          {blobUrl && (
            <a
              href={blobUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream"
              title="Open in new tab"
            >
              <ExternalLink size={13.5} />
            </a>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-cream"
            title="Close preview"
          >
            <X size={15} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "preview" ? (
          <iframe
            key={frameKey}
            sandbox="allow-scripts allow-modals"
            srcDoc={code}
            className="h-full w-full bg-white"
            title="Artifact preview"
          />
        ) : (
          <pre className="h-full overflow-auto p-4 font-mono text-[12px] leading-relaxed text-cream/85">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}
