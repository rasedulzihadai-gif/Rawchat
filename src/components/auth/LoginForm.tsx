"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";

function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden>
      <path
        d="M70 14.7 Q80 27.4 93.4 31.2 Q106.8 35 103.4 48.5 Q100 62 103.4 75.5 Q106.8 89 93.4 92.8 Q80 96.6 70 107.3 Q60 118 50 107.3 Q40 96.6 26.6 92.8 Q13.2 89 16.6 75.5 Q20 62 16.6 48.5 Q13.2 35 26.6 31.2 Q40 27.4 50 14.7 Q60 2 70 14.7 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || "Something went wrong. Try again.");
        return;
      }
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grain relative grid min-h-screen place-items-center overflow-hidden px-4">
      {/* glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 size-[560px] -translate-x-1/2 rounded-full opacity-20 blur-[130px]"
        style={{
          background: "radial-gradient(circle, #E8764D 0%, transparent 65%)",
          animation: "drift 18s ease-in-out infinite",
        }}
      />
      <div className="animate-fade-up relative w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-line-strong bg-coal text-cream shadow-xl transition hover:scale-105"
          >
            <Logo />
          </Link>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-cream">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login"
              ? "Sign in to pick up where you left off."
              : "One account for every model. Free to start."}
          </p>
        </div>

        <div className="rounded-2xl border border-line-strong bg-panel p-6 shadow-2xl">
          {/* tabs */}
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-line bg-coal/60 p-1">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`rounded-lg py-2 text-[13px] font-medium transition ${
                  mode === m
                    ? "bg-elevated text-cream shadow"
                    : "text-muted hover:text-fog"
                }`}
              >
                {m === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.07] px-3.5 py-2.5 text-[13px] leading-snug text-red-300">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[12px] font-medium text-fog"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-line bg-coal/60 px-3.5 py-2.5 text-[14px] text-cream outline-none placeholder:text-muted transition focus:border-cream/30"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[12px] font-medium text-fog"
              >
                Password
                {mode === "signup" && (
                  <span className="ml-1.5 font-normal text-muted">
                    (min 8 characters)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-line bg-coal/60 py-2.5 pr-11 pl-3.5 text-[14px] text-cream outline-none placeholder:text-muted transition focus:border-cream/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition hover:text-cream"
                  title={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-[14px] font-semibold text-white transition hover:bg-accent-strong active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
            Chats auto-delete 7 days after the last message.
            <br />
            Your provider API keys never leave this browser.
          </p>
        </div>

        <p className="mt-6 text-center text-[12px] text-muted">
          <Link href="/" className="transition hover:text-cream">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
