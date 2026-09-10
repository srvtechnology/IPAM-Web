"use client";

import { useState, type FormEvent } from "react";
import { useEmployers } from "@/hooks/admin/useEmployers";

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary";

export default function CreateEmployerModal({ onClose }: { onClose: () => void }) {
  const { createEmployer, loading, error } = useEmployers();
  const [form, setForm] = useState({
    name: "",
    industry: "",
    headquarters: "",
    website: "",
    companySize: "",
    description: "",
    partnershipTier: "SILVER_INDUSTRY_ASSOCIATE",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createEmployer(form);
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">New Employer Partner</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Company name
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Industry
            <input required value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Headquarters
            <input required value={form.headquarters} onChange={(e) => set("headquarters", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Website
            <input required value={form.website} onChange={(e) => set("website", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Company size
            <input required value={form.companySize} onChange={(e) => set("companySize", e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Description
            <textarea required rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Partnership tier
            <select value={form.partnershipTier} onChange={(e) => set("partnershipTier", e.target.value)} className={inputClass}>
              <option value="PLATINUM_CORPORATE">Platinum Corporate Partner</option>
              <option value="GOLD_CAREER_AFFILIATE">Gold Career Affiliate</option>
              <option value="UNIVERSITY_CORE_PARTNER">University Core Partner</option>
              <option value="SILVER_INDUSTRY_ASSOCIATE">Silver Industry Associate</option>
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Contact name
            <input required value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Contact title
            <input required value={form.contactTitle} onChange={(e) => set("contactTitle", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Contact email
            <input required type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Contact phone
            <input required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputClass} />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-body-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-fixed-dim text-on-secondary font-bold shadow-md transition-all disabled:opacity-50"
          >
            {loading ? "Saving…" : "Add Employer"}
          </button>
        </div>
      </form>
    </div>
  );
}
