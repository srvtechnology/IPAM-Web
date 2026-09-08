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
  APPLIED: "bg-surface-container-high text-on-surface-variant",
  REVIEWING: "bg-tertiary-container text-on-tertiary-container",
  SHORTLISTED: "bg-tertiary-container text-on-tertiary-container",
  INTERVIEW_SCHEDULED: "bg-primary-container text-on-primary-container",
  SELECTED: "bg-secondary-container text-on-secondary-container",
  REJECTED: "bg-error-container text-on-error-container",
};

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
                <td className="px-4 py-3 font-body-medium text-on-surface">{app.candidateName}</td>
                <td className="px-4 py-3 font-body-default text-on-surface-variant">{app.degree}</td>
                <td className="px-4 py-3 font-body-default text-on-surface">{app.matchScore}%</td>
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
