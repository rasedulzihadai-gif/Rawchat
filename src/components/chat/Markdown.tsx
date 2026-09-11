"use client";

import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Terminal } from "lucide-react";

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setOk(true);
        setTimeout(() => setOk(false), 1600);
      }}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] text-muted transition hover:bg-white/5 hover:text-cream"
    >
      {ok ? <Check size={12} className="text-mint" /> : <Copy size={12} />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

function CodeShell({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="code-shell">
      <div className="flex items-center justify-between border-b border-line bg-white/[0.03] py-1.5 pr-2 pl-4">
        <span className="flex items-center gap-2 text-[11px] font-medium tracking-wide text-muted uppercase">
          <Terminal size={11} />
          {lang || "code"}
        </span>
        <CopyBtn text={code} />
      </div>
      <div className="code-scroll max-h-[560px] overflow-auto">
        <SyntaxHighlighter
          language={lang || "text"}
          style={oneDark}
          customStyle={{
            background: "transparent",
            margin: 0,
            padding: "14px 16px",
            fontSize: "0.82rem",
            lineHeight: 1.65,
            fontFamily: "var(--font-mono)",
          }}
          codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
          PreTag="div"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="mdx">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props: any) {
            const { className, children } = props;
            const text = String(children ?? "");
            const match = /language-([\w+-]+)/.exec(className || "");
            const isBlock = text.includes("\n") || !!match;
            if (isBlock) {
              return <CodeShell lang={match?.[1] || ""} code={text.replace(/\n$/, "")} />;
            }
            return <code>{text}</code>;
          },
          pre(props: any) {
            // unwrap <pre> since CodeShell renders its own shell
            return <>{props.children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
