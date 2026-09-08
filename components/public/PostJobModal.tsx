"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Post a Job</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
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

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Posting…" : "Post Job"}
        </button>
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
