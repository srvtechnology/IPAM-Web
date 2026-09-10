"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin/context";
import CreateJobModal from "./CreateJobModal";
import CreateEmployerModal from "./CreateEmployerModal";

export interface AdminJobRow {
  id: string;
  title: string;
  company: string;
  employer: { name: string } | null;
  location: string;
  type: string;
  status: string;
  closingDate: string;
  applicantsCount: number;
}

export interface EmployerOption {
  id: string;
  name: string;
}

// Mirrors the original admin portal's job-pipeline palette (each stage gets
// its own hue rather than reusing the theme's primary/secondary/tertiary
// trio) so the recruiting funnel reads at a glance.
const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30",
  REVIEWING: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  SHORTLISTING: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  INTERVIEWING: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
  OFFER_EXTENDED: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30",
  CLOSED: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
};

export default function AdminJobsView({
  jobs,
  employers,
}: {
  jobs: AdminJobRow[];
  employers: EmployerOption[];
}) {
  const { can } = useAdminSession();
  const [createJobOpen, setCreateJobOpen] = useState(false);
  const [createEmployerOpen, setCreateEmployerOpen] = useState(false);
  const canWrite = can("JOBS", "canWrite");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline-lg text-on-surface">Job Matching &amp; Recruiters</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            {jobs.length} listings &middot; {employers.length} employer partners
          </p>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCreateEmployerOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container-high text-on-surface px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">domain_add</span>
              New Employer
            </button>
            <button
              type="button"
              onClick={() => setCreateJobOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Listing
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Employer</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Applicants</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Closes</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary font-bold text-[12px] shrink-0">
                      {job.company
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <Link href={`/admin/jobs/${job.id}`} className="font-body-medium text-on-surface hover:text-primary">
                        {job.title}
                      </Link>
                      <div className="font-body-compact text-on-surface-variant">{job.company}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">
                  {job.employer?.name ?? "—"}
                </td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{job.location}</td>
                <td className="px-4 py-3 font-body-default text-on-surface">{job.applicantsCount}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-body-compact ${STATUS_STYLES[job.status] ?? ""}`}>
                    {job.status.replaceAll("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">
                  {new Date(job.closingDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                  No job listings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {createJobOpen && <CreateJobModal employers={employers} onClose={() => setCreateJobOpen(false)} />}
      {createEmployerOpen && <CreateEmployerModal onClose={() => setCreateEmployerOpen(false)} />}
    </div>
  );
}
