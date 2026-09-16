"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo.alumni@ipam.edu");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/alumni/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-16 text-slate-200">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        <h1 className="text-2xl font-black tracking-tight text-white">Alumni Sign In</h1>
        <p className="mt-1 text-sm text-slate-400">Welcome back to the IPAM Alumni Association.</p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <label className="mt-6 block text-sm font-medium text-slate-300">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-300">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <div className="mt-4 flex items-center justify-between text-sm">
          <label className="flex cursor-pointer select-none items-center gap-2 font-medium text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded accent-emerald-500"
            />
            Keep me signed in
          </label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="font-medium text-emerald-400 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          New alumni?{" "}
          <a href="/register" className="font-medium text-emerald-400 hover:underline">
            Register here
          </a>
        </p>
      </form>

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </main>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [forgotEmail, setForgotEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!forgotEmail) return;
    // No email provider is wired into this project yet — this confirms the
    // flow visually; wire to a real mailer + reset-token API before relying
    // on it to actually deliver anything.
    setSent(true);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-white shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950 text-emerald-400">
          <KeyRound className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white">Reset your password</h3>
          <p className="mt-1 text-xs text-slate-400">
            Enter your registered alumni email to receive a password recovery link.
          </p>
        </div>

        {sent ? (
          <div className="space-y-1 rounded-2xl border border-emerald-500/40 bg-emerald-950 p-4 text-xs text-emerald-200">
            <p className="font-bold text-white">Recovery instructions sent!</p>
            <p>Please check your inbox at <strong>{forgotEmail}</strong>.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="name@alumni.ipam.edu"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white focus:outline-emerald-500"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950 shadow-md hover:bg-emerald-400"
              >
                Send Link
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
