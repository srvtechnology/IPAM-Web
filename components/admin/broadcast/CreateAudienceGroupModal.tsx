"use client";

import { useState, type FormEvent } from "react";
import { useBroadcast } from "@/hooks/admin/useBroadcast";

export default function CreateAudienceGroupModal({ onClose }: { onClose: () => void }) {
  const { createAudienceGroup, loading, error } = useBroadcast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [faculties, setFaculties] = useState("All");
  const [cohorts, setCohorts] = useState("All");
  const [digitalPassOnly, setDigitalPassOnly] = useState(false);
  const [estimatedCount, setEstimatedCount] = useState(0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createAudienceGroup({
      name,
      description,
      criteria: {
        faculties: faculties.split(",").map((f) => f.trim()).filter(Boolean),
        cohorts: cohorts.split(",").map((c) => c.trim()).filter(Boolean),
        digitalPassOnly,
      },
      estimatedCount,
    });
    if (result) onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">New Audience Group</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-error-container text-on-error-container px-3 py-2 font-body-compact">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="font-body-compact text-on-surface-variant block">
            Group name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="font-body-compact text-on-surface-variant block">
            Description
            <input
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="font-body-compact text-on-surface-variant block">
              Faculties (comma-separated)
              <input
                value={faculties}
                onChange={(e) => setFaculties(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
              />
            </label>
            <label className="font-body-compact text-on-surface-variant block">
              Cohorts (comma-separated)
              <input
                value={cohorts}
                onChange={(e) => setCohorts(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
              />
            </label>
          </div>
          <label className="font-body-compact text-on-surface-variant block">
            Estimated recipient count
            <input
              type="number"
              min={0}
              value={estimatedCount}
              onChange={(e) => setEstimatedCount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="flex items-center gap-2 font-body-compact text-on-surface-variant">
            <input
              type="checkbox"
              checked={digitalPassOnly}
              onChange={(e) => setDigitalPassOnly(e.target.checked)}
            />
            Digital pass holders only
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
            {loading ? "Saving…" : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
}
