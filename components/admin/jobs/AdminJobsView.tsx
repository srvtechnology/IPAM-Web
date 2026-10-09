"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin/context";
import CreateJobModal from "./CreateJobModal";
import CreateEmployerModal from "./CreateEmployerModal";

export interface AdminJobRow {
  id: string;
  title: string;
  company: string;
  employer: { id?: string; name: string } | null;
  location: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  type: string;
  status: string;
  salary?: string;
  experienceRequired?: boolean;
  experienceLevel?: string | null;
  hiringType?: string;
  positionsOpen?: number;
  postedByType?: string;
  postedByName?: string | null;
  postedByTitle?: string | null;
  postedDate?: string;
  closingDate?: string | null;
  applicantsCount: number;
}

export interface EmployerOption {
  id: string;
  name: string;
}

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [postedByFilter, setPostedByFilter] = useState("all");

  const canWrite = can("JOBS", "canWrite");

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.postedByName && j.postedByName.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || j.status === statusFilter;
      const matchesPoster =
        postedByFilter === "all" ||
        (postedByFilter === "admin" && j.postedByType === "ADMIN") ||
        (postedByFilter === "alumni" && j.postedByType !== "ADMIN");

      return matchesSearch && matchesStatus && matchesPoster;
    });
  }, [jobs, search, statusFilter, postedByFilter]);

  const totalPositions = jobs.reduce((acc, j) => acc + (j.positionsOpen || 1), 0);
  const totalApplicants = jobs.reduce((acc, j) => acc + j.applicantsCount, 0);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline-lg text-on-surface">Job Matching &amp; Recruitment Governance</h1>
          <p className="font-body-default text-on-surface-variant mt-1">
            {jobs.length} total openings &middot; {totalPositions} open positions &middot; {totalApplicants} candidate applicants
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

      {/* Filter and Search Strip */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search by role, company, poster name, or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-body-default text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={postedByFilter}
            onChange={(e) => setPostedByFilter(e.target.value)}
            className="rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface px-3 py-2 font-body-default text-xs outline-none focus:border-primary"
          >
            <option value="all">All Posters (Admin &amp; Alumni)</option>
            <option value="admin">Posted by Admin Only</option>
            <option value="alumni">Posted by Alumni Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface px-3 py-2 font-body-default text-xs outline-none focus:border-primary"
          >
            <option value="all">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="SHORTLISTING">Shortlisting</option>
            <option value="INTERVIEWING">Interviewing</option>
            <option value="OFFER_EXTENDED">Offer Extended</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Listing &amp; Company</th>
              <th className="px-4 py-3">Posted By</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Timeline / Urgency</th>
              <th className="px-4 py-3">Applicants</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.map((job) => {
              const isAdminPoster = job.postedByType === "ADMIN";
              const isImmediate = job.hiringType === "IMMEDIATE";

              return (
                <tr
                  key={job.id}
                  className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 transition-colors"
                >
                  {/* Title & Company */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary font-bold text-[12px] shrink-0">
                        {job.company
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="font-body-medium text-on-surface hover:text-primary block truncate font-bold"
                        >
                          {job.title}
                        </Link>
                        <div className="font-body-compact text-on-surface-variant flex items-center gap-2">
                          <span>{job.company}</span>
                          {job.salary && <span>&middot; {job.salary}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Posted By Attribution */}
                  <td className="px-4 py-3 font-body-default text-on-surface">
                    {isAdminPoster ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <span className="material-symbols-outlined text-[14px]">shield_person</span>
                        Admin: {job.postedByName || "Institutional"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                        <span className="material-symbols-outlined text-[14px]">school</span>
                        Alumni: {job.postedByName || "Alumnus"}
                      </span>
                    )}
                    {job.postedByTitle && (
                      <div className="text-[11px] text-on-surface-variant mt-0.5 truncate">{job.postedByTitle}</div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3 font-body-default text-on-surface-variant">
                    <div>{job.location}</div>
                    {job.country && <div className="text-[11px] text-on-surface-variant/70">{job.country}</div>}
                  </td>

                  {/* Urgency / Timeline */}
                  <td className="px-4 py-3 font-body-default text-on-surface-variant">
                    {isImmediate ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                        <span className="material-symbols-outlined text-[14px]">bolt</span>
                        Immediate
                      </span>
                    ) : job.closingDate ? (
                      <span>Closes {new Date(job.closingDate).toLocaleDateString()}</span>
                    ) : (
                      <span>Open Rolling</span>
                    )}
                    <div className="text-[11px] text-on-surface-variant mt-0.5">
                      {job.positionsOpen || 1} {job.positionsOpen === 1 ? "opening" : "openings"}
                    </div>
                  </td>

                  {/* Applicants */}
                  <td className="px-4 py-3 font-body-default text-on-surface">
                    <span className="font-bold text-primary">{job.applicantsCount}</span> candidates
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-body-compact text-xs font-bold ${STATUS_STYLES[job.status] ?? ""}`}>
                      {job.status.replaceAll("_", " ")}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container text-xs font-bold transition-colors"
                    >
                      <span>Manage</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </td>
                </tr>
              );
            })}

            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                  No matching job listings found.
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
