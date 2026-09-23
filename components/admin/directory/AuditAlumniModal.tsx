"use client";

import type { AlumniRecordRow } from "./AlumniDirectoryView";
import { useAlumniRecords } from "@/hooks/admin/useAlumniRecords";
import { useAdminSession } from "@/lib/admin/context";

export default function AuditAlumniModal({
  record,
  onClose,
  onOpenReject,
}: {
  record: AlumniRecordRow;
  onClose: () => void;
  onOpenReject?: (record: AlumniRecordRow) => void;
}) {
  const { can } = useAdminSession();
  const { approveRecord, markPendingRecord, loading } = useAlumniRecords();
  const canApprove = can("DIRECTORY", "canApprove");

  const rows: [string, string][] = [
    ["Full name", record.name],
    ["Email", record.email],
    ["Registration no.", record.regNo],
    ["Degree", record.degree],
    ["Faculty", record.faculty],
    ["Graduation year", String(record.gradYear)],
    ["Role", record.role.replaceAll("_", " ")],
    ["Auth status", record.authStatus.replaceAll("_", " ")],
    ["Verification status", record.status],
    ["Phone", record.phone ?? "—"],
    ["Digital pass issued", record.digitalPassIssued ? "Yes" : "No"],
    ["Registered", new Date(record.dateRegistered).toLocaleString()],
  ];

  async function handleApprove() {
    await approveRecord(record.id);
    onClose();
  }

  async function handleMarkPending() {
    await markPendingRecord(record.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">badge</span>
            <h2 className="font-headline-md text-on-surface">Verification Record</h2>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {record.status === "REJECTED" && record.rejectionReason && (
          <div className="mb-4 rounded-xl border border-error/30 bg-error-container/40 p-3.5 text-on-error-container">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-error">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>Rejection Reason</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed">{record.rejectionReason}</p>
          </div>
        )}

        <dl className="divide-y divide-outline-variant/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2 text-sm">
              <dt className="font-body-compact text-on-surface-variant">{label}</dt>
              <dd className="font-body-medium text-on-surface text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/10 pt-4">
          <div className="flex items-center gap-2">
            {canApprove && record.status !== "APPROVED" && (
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="flex items-center gap-1 rounded-lg bg-secondary-container text-on-secondary-container px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Approve
              </button>
            )}

            {canApprove && record.status !== "REJECTED" && onOpenReject && (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  onClose();
                  onOpenReject(record);
                }}
                className="flex items-center gap-1 rounded-lg bg-error text-on-error px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
                Reject
              </button>
            )}

            {canApprove && record.status !== "PENDING" && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkPending}
                className="flex items-center gap-1 rounded-lg bg-tertiary-container text-on-tertiary-container px-3 py-1.5 text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">pending</span>
                Mark as Pending
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-high font-body-medium text-on-surface hover:opacity-90 transition-opacity text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
