"use client";

import { useState, type FormEvent } from "react";
import { useAdminJobs } from "@/hooks/admin/useAdminJobs";

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary";

export default function SelectionOfferModal({
  jobId,
  applicationId,
  candidateName,
  onClose,
}: {
  jobId: string;
  applicationId: string;
  candidateName: string;
  onClose: () => void;
}) {
  const { selectApplication, loading, error } = useAdminJobs();
  const [form, setForm] = useState({
    offerSalary: "",
    startDate: "",
    decisionStatus: "OFFER_EXTENDED",
    recruiterRemarks: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await selectApplication(jobId, applicationId, form);
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary/20 flex items-center justify-center text-secondary shrink-0">
              <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface leading-tight">Select &amp; Offer</h2>
              <p className="font-body-compact text-secondary">{candidateName}</p>
            </div>
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

        <div className="mb-4 p-3 bg-secondary/10 border border-secondary/25 rounded-xl flex items-start gap-2.5">
          <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">verified</span>
          <div className="text-[10.5px] text-on-surface-variant leading-relaxed">
            Upon confirmation, this graduate will be marked as{" "}
            <strong className="text-secondary">Selected / Placed</strong> in the IPAM Career Registry.
          </div>
        </div>

        <div className="space-y-3">
          <label className="block font-body-compact text-on-surface-variant">
            Offer salary
            <input required value={form.offerSalary} onChange={(e) => set("offerSalary", e.target.value)} className={inputClass} />
          </label>
          <label className="block font-body-compact text-on-surface-variant">
            Start date
            <input required type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} className={inputClass} />
          </label>
          <label className="block font-body-compact text-on-surface-variant">
            Decision status
            <select value={form.decisionStatus} onChange={(e) => set("decisionStatus", e.target.value)} className={inputClass}>
              <option value="OFFER_EXTENDED">Offer Extended</option>
              <option value="OFFER_ACCEPTED">Offer Accepted</option>
              <option value="PLACEMENT_CONFIRMED">Placement Confirmed</option>
            </select>
          </label>
          <label className="block font-body-compact text-on-surface-variant">
            Recruiter remarks (optional)
            <textarea rows={2} value={form.recruiterRemarks} onChange={(e) => set("recruiterRemarks", e.target.value)} className={inputClass} />
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
            {loading ? "Saving…" : "Confirm Selection"}
          </button>
        </div>
      </form>
    </div>
  );
}
