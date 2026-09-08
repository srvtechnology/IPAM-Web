"use client";

import { useState, type FormEvent } from "react";
import { useAdminJobs } from "@/hooks/admin/useAdminJobs";

interface EmployerOption {
  id: string;
  name: string;
}

const inputClass =
  "mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary";

export default function CreateJobModal({
  employers,
  onClose,
}: {
  employers: EmployerOption[];
  onClose: () => void;
}) {
  const { createJob, loading, error } = useAdminJobs();
  const [form, setForm] = useState({
    title: "",
    company: "",
    employerId: "",
    location: "",
    workMode: "ON_SITE",
    type: "FULL_TIME",
    salaryRange: "",
    closingDate: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createJob({ ...form, employerId: form.employerId || undefined });
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">New Job Listing</h2>
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
            Title
            <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Company
            <input required value={form.company} onChange={(e) => set("company", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Employer partner (optional)
            <select value={form.employerId} onChange={(e) => set("employerId", e.target.value)} className={inputClass}>
              <option value="">— none —</option>
              {employers.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Location
            <input required value={form.location} onChange={(e) => set("location", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Work mode
            <select value={form.workMode} onChange={(e) => set("workMode", e.target.value)} className={inputClass}>
              <option value="ON_SITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Type
            <select value={form.type} onChange={(e) => set("type", e.target.value)} className={inputClass}>
              <option value="FULL_TIME">Full-time</option>
              <option value="CONTRACT">Contract</option>
              <option value="EXECUTIVE">Executive</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Salary range
            <input required value={form.salaryRange} onChange={(e) => set("salaryRange", e.target.value)} className={inputClass} />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Closing date
            <input required type="date" value={form.closingDate} onChange={(e) => set("closingDate", e.target.value)} className={inputClass} />
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
            className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
