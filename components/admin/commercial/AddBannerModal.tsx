"use client";

import { useState, type FormEvent } from "react";
import { useBanners } from "@/hooks/admin/useBanners";

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary";

export default function AddBannerModal({ onClose }: { onClose: () => void }) {
  const { createBanner, loading, error } = useBanners();
  const [form, setForm] = useState({
    code: "",
    name: "",
    slot: "",
    contract: "",
    monthlyFee: "",
    subscriptionCadence: "MONTHLY",
    industry: "",
    contactName: "",
    contactEmail: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createBanner(form);
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-[24px]">campaign</span>
            <h2 className="font-headline-md text-on-surface">New Sponsor Banner</h2>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <h4 className="text-[12px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5 mb-2">
          <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
          Sponsor Details
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <label className="font-body-compact text-on-surface-variant">
            Code
            <input required value={form.code} onChange={(e) => set("code", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Slot
            <input required value={form.slot} onChange={(e) => set("slot", e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Sponsor name
            <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Contract reference
            <input required value={form.contract} onChange={(e) => set("contract", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Monthly fee (USD)
            <input required type="number" step="0.01" value={form.monthlyFee} onChange={(e) => set("monthlyFee", e.target.value)} className={`${inputClass} font-mono text-secondary font-bold`} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Cadence
            <select value={form.subscriptionCadence} onChange={(e) => set("subscriptionCadence", e.target.value)} className={inputClass}>
              <option value="MONTHLY">Monthly</option>
              <option value="HALF_YEARLY">Half-yearly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Industry
            <input value={form.industry} onChange={(e) => set("industry", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Contact name
            <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputClass} />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Contact email
            <input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className={inputClass} />
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
            {loading ? "Saving…" : "Create Banner"}
          </button>
        </div>
      </form>
    </div>
  );
}
