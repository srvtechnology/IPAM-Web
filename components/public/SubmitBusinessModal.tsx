"use client";

import { useState, type FormEvent } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { useCreateBusiness } from "@/hooks/public/useCreateBusiness";

export default function SubmitBusinessModal({ onClose }: { onClose: () => void }) {
  const { createBusiness, loading, error } = useCreateBusiness();
  const [form, setForm] = useState({
    name: "",
    founders: "",
    classYear: "",
    category: "",
    industry: "",
    tagline: "",
    description: "",
    website: "",
    location: "",
    contactEmail: "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await createBusiness(form);
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
            <div className="mb-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Alumni Enterprise Directory
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">List Your Alumni Business</h2>
            <p className="text-xs text-slate-500">Showcase your venture to the global IPAM alumni network.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-4 grid gap-3">
          <Field label="Business name"><input required value={form.name} onChange={(e) => update("name", e.target.value)} className="input" /></Field>
          <Field label="Founder(s)"><input required value={form.founders} onChange={(e) => update("founders", e.target.value)} className="input" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Class year"><input required value={form.classYear} onChange={(e) => update("classYear", e.target.value)} className="input" /></Field>
            <Field label="Industry"><input required value={form.industry} onChange={(e) => update("industry", e.target.value)} className="input" /></Field>
          </div>
          <Field label="Category"><input required value={form.category} onChange={(e) => update("category", e.target.value)} className="input" /></Field>
          <Field label="Tagline"><input value={form.tagline} onChange={(e) => update("tagline", e.target.value)} className="input" /></Field>
          <Field label="Description"><textarea required value={form.description} onChange={(e) => update("description", e.target.value)} className="input" rows={3} /></Field>
          <Field label="Website"><input required value={form.website} onChange={(e) => update("website", e.target.value)} className="input" /></Field>
          <Field label="Location"><input required value={form.location} onChange={(e) => update("location", e.target.value)} className="input" /></Field>
          <Field label="Contact email"><input type="email" required value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} className="input" /></Field>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>{loading ? "Submitting…" : "Submit Business Listing"}</span>
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
