"use client";

import type { AlumniRecordRow } from "./AlumniDirectoryView";

export default function AuditAlumniModal({
  record,
  onClose,
}: {
  record: AlumniRecordRow;
  onClose: () => void;
}) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline-md text-on-surface">Verification Record</h2>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <dl className="divide-y divide-outline-variant/10">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between py-2">
              <dt className="font-body-compact text-on-surface-variant">{label}</dt>
              <dd className="font-body-medium text-on-surface text-right">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-container-high font-body-medium text-on-surface hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
