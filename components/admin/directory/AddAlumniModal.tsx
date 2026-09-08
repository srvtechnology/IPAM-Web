"use client";

import { useState, type FormEvent } from "react";
import { useAlumniRecords } from "@/hooks/admin/useAlumniRecords";

export default function AddAlumniModal({ onClose }: { onClose: () => void }) {
  const { createRecord, loading, error } = useAlumniRecords();
  const [form, setForm] = useState({
    name: "",
    email: "",
    regNo: "",
    degree: "",
    faculty: "",
    gradYear: new Date().getFullYear(),
    phone: "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createRecord(form);
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">Add Alumni Record</h2>
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
            Full name
            <input
              required
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Registration No.
            <input
              required
              value={form.regNo}
              onChange={(e) => set("regNo", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Graduation year
            <input
              required
              type="number"
              value={form.gradYear}
              onChange={(e) => set("gradYear", Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Degree
            <input
              required
              value={form.degree}
              onChange={(e) => set("degree", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant">
            Faculty
            <input
              required
              value={form.faculty}
              onChange={(e) => set("faculty", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="col-span-2 font-body-compact text-on-surface-variant">
            Phone (optional)
            <input
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
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
            {loading ? "Saving…" : "Create Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
