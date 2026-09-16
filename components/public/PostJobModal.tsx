"use client";

import { useState, type FormEvent } from "react";
import { X, Plus } from "lucide-react";
import { useCreateJob } from "@/hooks/public/useCreateJob";

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "REMOTE"];
const CATEGORIES = [
  "ENGINEERING",
  "DATA_AI",
  "FINANCE_BANKING",
  "OPERATIONS",
  "PRODUCT_DESIGN",
  "LEGAL_PUBLIC_POLICY",
];

export default function PostJobModal({ onClose }: { onClose: () => void }) {
  const { createJob, loading, error } = useCreateJob();
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "FULL_TIME",
    category: "ENGINEERING",
    salary: "",
    description: "",
    requirements: "",
    deadline: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await createJob({
      ...form,
      requirements: form.requirements.split("\n").map((s) => s.trim()).filter(Boolean),
      deadline: form.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="relative my-8 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Alumni Hiring Network</span>
            <h2 className="mt-1 text-2xl font-black text-slate-900">Post a Job Opening</h2>
            <p className="text-xs text-slate-500">Connect fellow IPAM graduates to opportunities at your organization.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 grid gap-3">
          <Field label="Job title"><input required value={form.title} onChange={(e) => update("title", e.target.value)} className="input" /></Field>
          <Field label="Company"><input required value={form.company} onChange={(e) => update("company", e.target.value)} className="input" /></Field>
          <Field label="Location"><input required value={form.location} onChange={(e) => update("location", e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={form.type} onChange={(e) => update("type", e.target.value)} className="input">
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="input">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Salary"><input required value={form.salary} onChange={(e) => update("salary", e.target.value)} className="input" placeholder="e.g. $60,000 - $80,000" /></Field>
          <Field label="Description"><textarea required value={form.description} onChange={(e) => update("description", e.target.value)} className="input" rows={3} /></Field>
          <Field label="Requirements (one per line)"><textarea required value={form.requirements} onChange={(e) => update("requirements", e.target.value)} className="input" rows={3} /></Field>
          <Field label="Application deadline"><input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} className="input" /></Field>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>{loading ? "Posting…" : "Publish Alumni Job Opening"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
