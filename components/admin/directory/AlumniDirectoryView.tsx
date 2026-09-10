"use client";

import { useMemo, useState } from "react";
import { useAlumniRecords } from "@/hooks/admin/useAlumniRecords";
import { useAdminSession } from "@/lib/admin/context";
import AddAlumniModal from "./AddAlumniModal";
import AuditAlumniModal from "./AuditAlumniModal";

export interface AlumniRecordRow {
  id: string;
  name: string;
  email: string;
  initials: string | null;
  regNo: string;
  degree: string;
  faculty: string;
  gradYear: number;
  authStatus: string;
  role: string;
  status: "APPROVED" | "PENDING" | "FLAGGED";
  phone: string | null;
  digitalPassIssued: boolean;
  dateRegistered: string;
}

const STATUS_STYLES: Record<AlumniRecordRow["status"], string> = {
  APPROVED: "bg-secondary-container text-on-secondary-container",
  PENDING: "bg-tertiary-container text-on-tertiary-container",
  FLAGGED: "bg-error-container text-on-error-container",
};

export default function AlumniDirectoryView({ records }: { records: AlumniRecordRow[] }) {
  const { can } = useAdminSession();
  const { approveRecord, loading } = useAlumniRecords();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const [inspecting, setInspecting] = useState<AlumniRecordRow | null>(null);

  const canWrite = can("DIRECTORY", "canWrite");
  const canApprove = can("DIRECTORY", "canApprove");

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.regNo.toLowerCase().includes(q)
      );
    });
  }, [records, query, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">verified_user</span>
            <h1 className="font-headline-lg text-on-surface">Alumni Directory & 2-Way Verification</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1">
            {records.length} records &middot;{" "}
            <span className="text-tertiary font-medium">
              {records.filter((r) => r.status === "PENDING").length} pending registrar sign-off
            </span>
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Alumni
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, reg. no…"
          className="flex-1 min-w-[220px] rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface placeholder:text-on-surface-variant/60 outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Alumni</th>
              <th className="px-4 py-3">Reg. No</th>
              <th className="px-4 py-3">Degree / Faculty</th>
              <th className="px-4 py-3">Auth Status</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-surface-container-high/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-label-badge flex-shrink-0">
                      {r.initials ?? r.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-body-medium text-on-surface truncate">{r.name}</p>
                      <p className="font-body-compact text-on-surface-variant truncate">{r.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-code-compact text-tertiary">{r.regNo}</td>
                <td className="px-4 py-3 font-body-default text-on-surface">
                  {r.degree}
                  <span className="text-on-surface-variant"> &middot; {r.faculty}</span>
                </td>
                <td className="px-4 py-3 font-body-compact">
                  <span
                    className={
                      r.authStatus.includes("VERIFIED") || r.authStatus.includes("SYNCED")
                        ? "text-secondary"
                        : "text-tertiary"
                    }
                  >
                    {r.authStatus.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`font-label-badge px-2 py-0.5 rounded-full ${STATUS_STYLES[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setInspecting(r)}
                      className="font-body-compact text-primary hover:underline"
                    >
                      Inspect
                    </button>
                    {canApprove && r.status === "PENDING" && (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => approveRecord(r.id)}
                        className="flex items-center gap-1 font-body-compact rounded-full bg-secondary-container text-on-secondary-container px-2.5 py-1 hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-body-default text-on-surface-variant">
                  No alumni records match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {addOpen && <AddAlumniModal onClose={() => setAddOpen(false)} />}
      {inspecting && <AuditAlumniModal record={inspecting} onClose={() => setInspecting(null)} />}
    </div>
  );
}
