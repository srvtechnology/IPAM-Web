"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/admin/useAuditLogs";
import type { AuditLogRow } from "./AuditTrailsView";

const SEVERITY_COLOR: Record<string, string> = {
  INFO: "text-on-surface-variant",
  NOTICE: "text-primary",
  WARNING: "text-tertiary",
  CRITICAL: "text-error font-bold",
};

const STATUS_COLOR: Record<string, string> = {
  SUCCESS: "text-secondary",
  FLAGGED: "text-tertiary",
  WARNING: "text-tertiary",
  BLOCKED_RBAC_VIOLATION: "text-error font-bold",
};

export default function AuditDetailModal({ entry, onClose }: { entry: AuditLogRow; onClose: () => void }) {
  const { verifyIntegrity, verifying } = useAuditLogs();
  const [result, setResult] = useState<{ valid: boolean } | null>(null);

  async function handleVerify() {
    const res = await verifyIntegrity(entry.id);
    setResult(res);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-surface-container-low rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="font-code-compact text-on-surface-variant">{entry.displayId}</p>
            <h2 className="font-headline-lg text-on-surface mt-1">{entry.actionLabel}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[12px]">
          <Field label="Actor" value={`${entry.actorName} (${entry.actorEmail})`} />
          <Field label="Role" value={entry.actorRole} />
          <Field label="Category" value={entry.category} />
          <Field label="Severity" value={entry.severity} valueClassName={SEVERITY_COLOR[entry.severity]} />
          <Field label="Status" value={entry.status} valueClassName={STATUS_COLOR[entry.status]} />
          <Field label="Target" value={`${entry.target}${entry.targetType ? ` (${entry.targetType})` : ""}`} />
          <Field label="IP Address" value={entry.ipAddress} />
          <Field label="Location" value={entry.location} />
          <Field label="Timestamp" value={new Date(entry.timestamp).toLocaleString()} />
        </div>

        <div>
          <p className="font-table-header uppercase text-on-surface-variant mb-1">Details</p>
          <p className="font-body-compact text-on-surface bg-surface-container p-3 rounded-lg">{entry.details}</p>
        </div>

        {Boolean(entry.beforeState || entry.afterState) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="font-table-header uppercase text-on-surface-variant mb-1">Before</p>
              <pre className="font-code-compact text-[11px] bg-surface-container p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(entry.beforeState ?? {}, null, 2)}
              </pre>
            </div>
            <div>
              <p className="font-table-header uppercase text-on-surface-variant mb-1">After</p>
              <pre className="font-code-compact text-[11px] bg-surface-container p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(entry.afterState ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="border-t border-outline-variant/30 pt-4 space-y-2">
          <p className="font-table-header uppercase text-on-surface-variant">Tamper-Proof Integrity Hash</p>
          <p className="font-code-compact text-[11px] text-on-surface break-all bg-surface-container p-3 rounded-lg">
            sha256_hmac:{entry.tamperHash}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleVerify}
              disabled={verifying === entry.id}
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary-container font-body-medium disabled:opacity-50"
            >
              {verifying === entry.id ? "Verifying…" : "Verify Integrity"}
            </button>
            {result && (
              <span
                className={`font-body-medium flex items-center gap-1 ${
                  result.valid ? "text-secondary" : "text-error"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {result.valid ? "verified" : "gpp_bad"}
                </span>
                {result.valid ? "Hash matches — record has not been tampered with." : "MISMATCH — record may have been altered."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="font-table-header uppercase text-on-surface-variant">{label}</p>
      <p className={`font-body-compact truncate ${valueClassName ?? "text-on-surface"}`}>{value}</p>
    </div>
  );
}
