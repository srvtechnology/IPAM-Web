"use client";

import { useState } from "react";
import type { AlumniRecordRow } from "./AlumniDirectoryView";
import { useAlumniRecords } from "@/hooks/admin/useAlumniRecords";

interface RejectAlumniModalProps {
  record: AlumniRecordRow;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRESET_REASONS = [
  "Registration number not found in registrar records",
  "Graduation year / degree faculty mismatch",
  "Incomplete or unverified identification credentials",
  "Transcript or diploma record could not be validated",
];

export default function RejectAlumniModal({ record, onClose, onSuccess }: RejectAlumniModalProps) {
  const { rejectRecord, loading, error } = useAlumniRecords();
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleReject() {
    if (!reason.trim()) {
      setLocalError("Please provide a reason for rejecting this registration.");
      return;
    }
    setLocalError(null);
    const result = await rejectRecord(record.id, reason.trim());
    if (result) {
      onSuccess?.();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/10 pb-3">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[24px]">cancel</span>
            <h2 className="font-headline-md text-on-surface">Reject Registration</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface rounded-full p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="mb-4 rounded-xl bg-surface-container-high/60 p-3 text-xs text-on-surface-variant">
          <p className="font-body-medium text-on-surface">
            Candidate: <span className="font-bold">{record.name}</span> ({record.regNo})
          </p>
          <p className="font-body-compact text-on-surface-variant mt-0.5">{record.email}</p>
        </div>

        <p className="font-body-default text-on-surface-variant mb-2">
          Specify why this registration is being rejected. This explanation will be displayed to the user when they
          attempt to log in, and they will be permitted to re-submit with corrected details.
        </p>

        <div className="mb-3 space-y-1.5">
          <label className="font-label-badge text-on-surface-variant text-[11px] uppercase tracking-wider block">
            Quick Preset Reasons:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setReason(preset)}
                className="text-left text-[11px] rounded-lg border border-outline-variant/30 bg-surface-container-low px-2 py-1 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="font-body-medium text-on-surface mb-1 block">
            Rejection Reason <span className="text-error">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Graduation year 2024 does not match registrar records for registration number B-2018-0941."
            className="w-full rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 font-body-default text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-error"
          />
          {(localError || error) && (
            <p className="text-xs text-error font-medium mt-1">{localError || error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high font-body-medium text-on-surface hover:opacity-90 transition-opacity"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error text-on-error font-body-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">block</span>
            {loading ? "Rejecting…" : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
}
