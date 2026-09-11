"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  KeyRound,
  Code2,
  Zap,
  ShieldCheck,
  Repeat2,
  Sparkles,
  Globe,
  Layers,
  ChevronRight,
} from "lucide-react";
import { PROVIDERS } from "@/lib/providers";

const fade = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

function Logo({ size = 26, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} aria-hidden>
      <path
        d="M70 14.7 Q80 27.4 93.4 31.2 Q106.8 35 103.4 48.5 Q100 62 103.4 75.5 Q106.8 89 93.4 92.8 Q80 96.6 70 107.3 Q60 118 50 107.3 Q40 96.6 26.6 92.8 Q13.2 89 16.6 75.5 Q20 62 16.6 48.5 Q13.2 35 26.6 31.2 Q40 27.4 50 14.7 Q60 2 70 14.7 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 md:px-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl border border-line-strong bg-coal/80 text-cream backdrop-blur">
            <Logo size={20} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-cream">
            Rawchat
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-fog md:flex">
          <a href="#providers" className="transition hover:text-cream">Providers</a>
          <a href="#features" className="transition hover:text-cream">Features</a>
          <a href="#how" className="transition hover:text-cream">How it works</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-fog transition hover:text-cream"
          >
            Sign in
          </Link>
          <Link
            href="/chat"
            className="group flex items-center gap-1.5 rounded-full bg-cream px-4 py-2 text-sm font-medium text-ink transition hover:bg-accent hover:text-white"
          >
            Launch app
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ── hero mock chat UI ─────────────────────── */
function MockChat() {
  const chips = [
    { name: "Groq", color: "#F55036", x: "-8%", y: "8%", d: 0 },
    { name: "Gemini", color: "#4285F4", x: "86%", y: "2%", d: 0.8 },
    { name: "OpenRouter", color: "#8B5CF6", x: "92%", y: "52%", d: 1.6 },
    { name: "Claude", color: "#D97757", x: "-12%", y: "58%", d: 2.2 },
  ];
  return (
    <div className="relative">
      {chips.map((c) => (
        <motion.div
          key={c.name}
          className="absolute z-10 flex items-center gap-1.5 rounded-full border border-line-strong bg-coal/90 px-3 py-1.5 text-xs text-fog shadow-xl backdrop-blur"
          style={{ left: c.x, top: c.y }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: c.d, ease: "easeInOut" }}
        >
          <span className="size-1.5 rounded-full" style={{ background: c.color }} />
          {c.name}
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 30, rotate: 0 }}
        animate={{ opacity: 1, y: 0, rotate: -1.5 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-line-strong bg-coal shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Logo size={14} className="text-cream/80" />
            <span className="font-medium text-fog">Rawchat</span>
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px]">Code mode</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-fog">
            <span className="size-1.5 rounded-full bg-[#F55036]" />
            llama-3.3-70b · Groq
          </div>
        </div>
        <div className="space-y-4 px-5 py-5 text-[13px] leading-relaxed">
          <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-md bg-elevated px-3.5 py-2.5 text-cream">
            Build me a landing page with a hero and pricing table
          </div>
          <div className="space-y-2.5 text-fog">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <Logo size={12} className="text-accent" /> Rawchat is answering…
            </div>
            <p>
              Here&apos;s a complete self-contained page — drop it in the preview:
            </p>
            <div className="rounded-xl border border-line-strong bg-[#171614] p-3 font-mono text-[11px] leading-relaxed text-cream/70">
              <span className="text-accent">```html</span>
              <br />
              <span className="text-fog/70">&lt;section</span> <span className="text-mint">class</span>=<span className="text-accent-strong">&quot;hero&quot;</span><span className="text-fog/70">&gt;</span>
              <br />
              &nbsp;&nbsp;<span className="text-fog/70">&lt;h1&gt;</span>Ship faster<span className="text-fog/70">&lt;/h1&gt;</span>
              <span className="stream-caret" />
            </div>
          </div>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between rounded-2xl border border-line-strong bg-elevated p-3">
            <span className="text-[13px] text-muted">Reply to Rawchat…</span>
            <span className="grid size-7 place-items-center rounded-full bg-accent text-white">
              <ArrowUp size={14} />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-20 md:pt-44">
      {/* glows */}
      <div
        className="pointer-events-none absolute -top-40 right-[-10%] size-[560px] rounded-full opacity-25 blur-[130px]"
        style={{ background: "radial-gradient(circle, #E8764D 0%, transparent 65%)", animation: "drift 18s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute top-64 left-[-12%] size-[480px] rounded-full opacity-15 blur-[120px]"
        style={{ background: "radial-gradient(circle, #ede8df 0%, transparent 60%)", animation: "drift 22s ease-in-out infinite reverse" }}
      />
      {/* grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(237,232,223,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(237,232,223,0.35) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 md:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-coal/70 py-1.5 pr-3.5 pl-2 text-xs text-fog backdrop-blur"
          >
            <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-[10px] tracking-wide text-white uppercase">
              New
            </span>
            480+ free models across 30+ providers
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 font-display text-[clamp(2.9rem,6.2vw,5.2rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-cream"
          >
            Every frontier AI.
            <br />
            One <em className="text-accent not-italic underline decoration-accent/40 decoration-[3px] underline-offset-8">raw</em>{" "}
            interface.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-fog"
          >
            Chat, code and create with Groq, Gemini, OpenRouter, Mistral, Claude,
            DeepSeek and two dozen more — free or paid — through a single
            Claude-grade workspace. Your keys, your rules.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/chat"
              className="group flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_40px_-8px_rgba(232,118,77,0.7)] transition hover:scale-[1.03] hover:bg-accent-strong active:scale-95"
            >
              Open Rawchat
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#providers"
              className="flex items-center gap-1.5 rounded-full border border-line-strong px-6 py-3.5 text-[15px] text-fog transition hover:border-cream/30 hover:text-cream"
            >
              Explore providers
              <ChevronRight size={16} />
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-10 flex items-center gap-6 text-xs text-muted"
          >
            <span className="flex items-center gap-1.5"><ShieldCheck size={13} className="text-mint" /> Keys stay in your browser</span>
            <span className="flex items-center gap-1.5"><Zap size={13} className="text-accent" /> Free tier in 30 seconds</span>
          </motion.div>
        </div>
        <div className="hidden lg:block">
          <MockChat />
        </div>
      </div>
    </section>
  );
}

function MarqueeRow({ items, reverse = false }: { items: typeof PROVIDERS; reverse?: boolean }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative flex overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)" }}>
      <div
        className="marquee-track flex shrink-0 items-center gap-3 py-1.5 pr-3"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {doubled.map((p, i) => (
          <span
            key={`${p.id}-${i}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-coal/60 px-4 py-2 text-sm text-fog"
          >
            <span className="size-1.5 rounded-full" style={{ background: p.color }} />
            {p.name}
            {p.free && <span className="rounded-full bg-mint/10 px-1.5 py-px text-[9px] font-semibold tracking-wider text-mint uppercase">free</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

function Providers() {
  const half = Math.ceil(PROVIDERS.length / 2);
  return (
    <section id="providers" className="border-y border-line py-16">
      <div className="mx-auto mb-10 flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 md:px-8">
        <motion.div {...fade}>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            <Globe size={13} /> The whole ecosystem
          </p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-cream md:text-4xl">
            Every provider from the free-LLM universe
          </h2>
        </motion.div>
        <motion.p {...fade} className="max-w-sm text-sm leading-relaxed text-muted">
          Curated from the awesome-freellm-apis directory — permanently free tiers,
          renewable credits, or bring any paid key. Plus custom OpenAI-compatible endpoints.
        </motion.p>
      </div>
      <motion.div {...fade} className="space-y-3">
        <MarqueeRow items={PROVIDERS.slice(0, half)} />
        <MarqueeRow items={PROVIDERS.slice(half)} reverse />
      </motion.div>
    </section>
  );
}

function Stats() {
  const stats = [
    { n: "30+", l: "providers wired in" },
    { n: "480+", l: "models reachable" },
    { n: "$0", l: "needed to start" },
    { n: "1", l: "interface to learn" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.6 }}
            className="bg-panel px-8 py-10 text-center"
          >
            <div className="font-display text-4xl font-semibold tracking-tight text-cream md:text-5xl">
              {s.n}
            </div>
            <div className="mt-2 text-sm text-muted">{s.l}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    {
      icon: KeyRound,
      t: "Bring any key",
      d: "Paste a key from any provider — Groq, Gemini, OpenRouter, Anthropic, even localhost Ollama. Fetch the model list, pick, chat. Keys never leave your browser.",
      big: true,
    },
    {
      icon: Code2,
      t: "Code mode with live preview",
      d: "Ask for a UI and watch it render. HTML artifacts open in a live sandboxed preview right beside the chat — Claude-style.",
      big: true,
    },
    {
      icon: Zap,
      t: "Streaming, natively",
      d: "Token-by-token responses with visible chain-of-thought for reasoning models like DeepSeek R1.",
    },
    {
      icon: Repeat2,
      t: "Hop models mid-chat",
      d: "Start on a free Groq model, switch to Claude for the hard part. One thread, any model.",
    },
    {
      icon: ShieldCheck,
      t: "Private by design",
      d: "Conversations live in your database. API keys live only in your local storage. No middlemen.",
    },
    {
      icon: Layers,
      t: "Modes for everything",
      d: "Chat, Code, Write, Ideate — tuned system prompts per mode so every model behaves its best.",
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <motion.div {...fade} className="mb-12 max-w-xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          <Sparkles size={13} /> Built like the best
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-cream md:text-4xl">
          A Claude-grade workspace, unchained
        </h2>
      </motion.div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {feats.map((f, i) => (
          <motion.div
            key={f.t}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: (i % 4) * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`group rounded-2xl border border-line bg-panel p-7 transition-colors hover:border-line-strong hover:bg-elevated/60 ${
              f.big ? "md:col-span-2" : ""
            }`}
          >
            <div className="mb-5 grid size-11 place-items-center rounded-xl border border-line-strong bg-coal text-accent transition-transform group-hover:scale-110">
              <f.icon size={19} />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold tracking-tight text-cream">{f.t}</h3>
            <p className="text-sm leading-relaxed text-muted">{f.d}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function How() {
  const steps = [
    { n: "01", t: "Pick a provider", d: "Groq is the fastest start — free, no credit card, just an email. Or plug in a key you already have." },
    { n: "02", t: "Paste your key", d: "Rawchat verifies it, pulls your available models, and stores the key only in your browser." },
    { n: "03", t: "Talk to everything", d: "Chat, generate code with live preview, write, ideate. Switch models whenever you want." },
  ];
  return (
    <section id="how" className="border-y border-line bg-coal/40 py-24">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <motion.h2 {...fade} className="mb-14 font-display text-3xl font-semibold tracking-tight text-cream md:text-4xl">
          Running in <span className="text-accent">30 seconds</span>
        </motion.h2>
        <div className="grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.6 }}
              className="relative"
            >
              <div className="font-display text-6xl font-semibold text-cream/10">{s.n}</div>
              <h3 className="mt-3 mb-2 text-lg font-semibold text-cream">{s.t}</h3>
              <p className="text-sm leading-relaxed text-muted">{s.d}</p>
              {i < 2 && <div className="absolute top-8 right-0 hidden h-px w-16 bg-gradient-to-r from-line-strong to-transparent md:block" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="relative overflow-hidden py-32 text-center">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[-40%] mx-auto size-[640px] rounded-full opacity-20 blur-[130px]"
        style={{ background: "radial-gradient(circle, #E8764D, transparent 62%)" }}
      />
      <motion.div {...fade} className="relative mx-auto max-w-3xl px-5">
        <div className="mx-auto mb-8 grid size-16 place-items-center rounded-2xl border border-line-strong bg-coal text-cream">
          <Logo size={32} />
        </div>
        <h2 className="font-display text-4xl font-semibold tracking-tight text-cream md:text-6xl">
          Start chatting <em className="text-accent not-italic">raw</em>.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-fog">
          Free to start. Just you, 480+ models, and one beautiful interface.
        </p>
        <Link
          href="/chat"
          className="group mt-10 inline-flex items-center gap-2.5 rounded-full bg-cream px-9 py-4 text-base font-semibold text-ink transition hover:scale-[1.04] hover:bg-accent hover:text-white active:scale-95"
        >
          Launch Rawchat
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 md:px-8">
        <div className="flex items-center gap-2 text-sm text-fog">
          <Logo size={16} className="text-cream" />
          <span className="font-display font-semibold text-cream">Rawchat</span>
          <span className="text-muted">— every model, raw.</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted">
          <span>
            Provider data:{" "}
            <a
              href="https://github.com/open-free-llm-api/awesome-freellm-apis"
              target="_blank"
              rel="noreferrer"
              className="text-fog underline decoration-line-strong underline-offset-4 hover:text-cream"
            >
              awesome-freellm-apis
            </a>
          </span>
          <Link href="/chat" className="text-fog hover:text-cream">Open app →</Link>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <main className="grain relative min-h-screen overflow-x-clip">
      <Nav />
      <Hero />
      <Providers />
      <Stats />
      <Features />
      <How />
      <CTA />
      <Footer />
    </main>
  );
}
