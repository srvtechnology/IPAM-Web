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

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-secondary-container text-on-secondary-container",
  REVIEWING: "bg-tertiary-container text-on-tertiary-container",
  SHORTLISTING: "bg-tertiary-container text-on-tertiary-container",
  INTERVIEWING: "bg-primary-container text-on-primary-container",
  OFFER_EXTENDED: "bg-primary-container text-on-primary-container",
  CLOSED: "bg-surface-container-high text-on-surface-variant",
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
                  <Link href={`/admin/jobs/${job.id}`} className="font-body-medium text-on-surface hover:text-primary">
                    {job.title}
                  </Link>
                  <div className="font-body-compact text-on-surface-variant">{job.company}</div>
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
