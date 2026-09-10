"use client";

import { useState } from "react";
import { useAdminSession } from "@/lib/admin/context";
import CandidateDossierModal from "./CandidateDossierModal";
import AddApplicationModal from "./AddApplicationModal";

export interface JobApplicationRow {
  id: string;
  candidateName: string;
  degree: string;
  faculty: string;
  gradYear: number;
  email: string;
  phone: string;
  status: string;
  matchScore: number;
  experienceYears: number;
  coverNote: string | null;
  offerSalary: string | null;
  decisionStatus: string | null;
}

export interface JobDetailRow {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  salaryRange: string;
  description: string | null;
  applications: JobApplicationRow[];
}

const STATUS_STYLES: Record<string, string> = {
  APPLIED: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30",
  REVIEWING: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30",
  SHORTLISTED: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
  INTERVIEW_SCHEDULED: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30",
  SELECTED: "bg-secondary text-on-secondary",
  REJECTED: "bg-error-container text-on-error-container",
};

function matchScoreColor(score: number) {
  if (score >= 80) return "bg-secondary/15 text-secondary";
  if (score >= 60) return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
  return "bg-surface-container-high text-on-surface-variant";
}

export default function JobDetailView({ job }: { job: JobDetailRow }) {
  const { can } = useAdminSession();
  const [inspecting, setInspecting] = useState<JobApplicationRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const canWrite = can("JOBS", "canWrite");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-headline-lg text-on-surface">{job.title}</h1>
        <p className="font-body-default text-on-surface-variant mt-1">
          {job.company} &middot; {job.location} &middot; {job.salaryRange}
        </p>
      </div>

      {job.description && <p className="font-body-default text-on-surface-variant">{job.description}</p>}

      <div className="flex items-center justify-between">
        <h2 className="font-headline-sm text-on-surface">Applications ({job.applications.length})</h2>
        {canWrite && (
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Register Candidate
          </button>
        )}
      </div>

      <div className="rounded-xl border border-outline-variant/20 bg-surface-container overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="font-table-header uppercase text-on-surface-variant border-b border-outline-variant/20">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Degree</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {job.applications.map((app) => (
              <tr
                key={app.id}
                onClick={() => setInspecting(app)}
                className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                      {app.candidateName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <span className="font-body-medium text-on-surface">{app.candidateName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{app.degree}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-code-compact font-bold ${matchScoreColor(app.matchScore)}`}>
                    {app.matchScore}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full font-body-compact ${STATUS_STYLES[app.status] ?? ""}`}>
                    {app.status.replaceAll("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {job.applications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {inspecting && (
        <CandidateDossierModal jobId={job.id} application={inspecting} onClose={() => setInspecting(null)} />
      )}
      {addOpen && <AddApplicationModal jobId={job.id} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
