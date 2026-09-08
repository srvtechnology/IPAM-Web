"use client";

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">List Your Business</h2>
          <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400" /></button>
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

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit Business"}
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
