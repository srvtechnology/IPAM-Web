"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const initialForm = {
  name: "",
  email: "",
  password: "",
  studentId: "",
  classYear: new Date().getFullYear(),
  degree: "",
  major: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/alumni/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? json.issues?.formErrors?.[0] ?? "Registration failed");
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
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-md sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
        <h1 className="text-2xl font-black tracking-tight text-white">Graduate Registration</h1>
        <p className="mt-1 text-sm text-slate-400">Join the IPAM Alumni Association network.</p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-950/60 px-3 py-2 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4">
          <label className="col-span-2 block text-sm font-medium text-slate-300">
            Full Name
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="col-span-2 block text-sm font-medium text-slate-300">
            Email
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="col-span-2 block text-sm font-medium text-slate-300">
            Password
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Student / Reg. ID
            <input
              required
              value={form.studentId}
              onChange={(e) => update("studentId", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Class Year
            <input
              type="number"
              required
              value={form.classYear}
              onChange={(e) => update("classYear", Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Degree
            <input
              required
              value={form.degree}
              onChange={(e) => update("degree", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-slate-300">
            Major
            <input
              required
              value={form.major}
              onChange={(e) => update("major", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          Already registered?{" "}
          <a href="/login" className="font-medium text-emerald-400 hover:underline">
            Sign in
          </a>
        </p>
      </form>
    </main>
  );
}
