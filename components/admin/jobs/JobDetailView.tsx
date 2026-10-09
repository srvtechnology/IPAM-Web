"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminSession } from "@/lib/admin/context";
import { useAdminJobs } from "@/hooks/admin/useAdminJobs";
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
  linkedinUrl?: string | null;
  cvUrl?: string | null;
  cvFileName?: string | null;
  interviewDate?: string | null;
  notes?: string | null;
  selectedDate?: string | null;
  offerSalary: string | null;
  startDate?: string | null;
  decisionStatus: string | null;
  recruiterRemarks?: string | null;
  createdAt?: string;
}

export interface JobDetailRow {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  status: string;
  salaryRange: string;
  type?: string;
  workplaceType?: string | null;
  experienceRequired?: boolean;
  experienceLevel?: string | null;
  hiringType?: string;
  positionsOpen?: number;
  aboutCompany?: string | null;
  description: string | null;
  postedByType?: string;
  postedByName?: string | null;
  postedByTitle?: string | null;
  postedDate?: string;
  closingDate?: string | null;
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
  const { updateJob, loading } = useAdminJobs();
  const [currentStatus, setCurrentStatus] = useState(job.status);
  const [inspecting, setInspecting] = useState<JobApplicationRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const canWrite = can("JOBS", "canWrite");

  const isAdminPoster = job.postedByType === "ADMIN";
  const isImmediate = job.hiringType === "IMMEDIATE";

  async function handleStatusChange(newStatus: string) {
    setCurrentStatus(newStatus);
    await updateJob(job.id, { status: newStatus });
  }

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-on-surface-variant">
        <Link href="/admin/jobs" className="hover:text-primary transition-colors flex items-center gap-1 font-bold">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to All Job Listings</span>
        </Link>
        <span>&middot;</span>
        <span className="text-on-surface font-semibold">{job.title}</span>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {isAdminPoster ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <span className="material-symbols-outlined text-[14px]">shield_person</span>
                  Posted by Admin: {job.postedByName || "Institutional Office"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/15 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                  <span className="material-symbols-outlined text-[14px]">school</span>
                  Posted by Alumni: {job.postedByName || "Alumnus"}
                </span>
              )}

              {isImmediate ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  Immediate Hiring
                </span>
              ) : job.closingDate ? (
                <span className="text-xs text-on-surface-variant font-medium px-2 py-0.5 rounded-full bg-surface-container-high">
                  Closes {new Date(job.closingDate).toLocaleDateString()}
                </span>
              ) : null}

              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {job.positionsOpen || 1} {job.positionsOpen === 1 ? "Open Position" : "Open Positions"}
              </span>
            </div>

            <h1 className="font-headline-lg text-on-surface">{job.title}</h1>
            <p className="font-body-large text-primary font-bold mt-0.5">{job.company}</p>
            {job.postedByTitle && (
              <p className="text-xs text-on-surface-variant mt-1 font-body-compact">
                Poster Role: {job.postedByTitle}
              </p>
            )}
          </div>

          {/* Job Pipeline Status Controller */}
          <div className="flex items-center gap-2 bg-surface-container-high p-2 rounded-xl border border-outline-variant/20">
            <span className="font-body-compact text-xs font-bold text-on-surface-variant">Listing Status:</span>
            <select
              value={currentStatus}
              disabled={!canWrite || loading}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-lg bg-surface-container border border-outline-variant/30 text-on-surface font-body-default text-xs font-bold px-3 py-1.5 outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="REVIEWING">REVIEWING</option>
              <option value="SHORTLISTING">SHORTLISTING</option>
              <option value="INTERVIEWING">INTERVIEWING</option>
              <option value="OFFER_EXTENDED">OFFER EXTENDED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        {/* Attribute Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-outline-variant/15 text-xs">
          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Location</span>
            <span className="font-bold text-on-surface">{job.location}</span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Compensation</span>
            <span className="font-bold text-primary">{job.salaryRange}</span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Experience Required</span>
            <span className="font-bold text-on-surface">
              {job.experienceRequired ? job.experienceLevel || "Required" : "No (Freshers Welcome)"}
            </span>
          </div>

          <div className="bg-surface-container-low p-3 rounded-xl">
            <span className="text-on-surface-variant block text-[10px] uppercase font-bold">Posted Date</span>
            <span className="font-bold text-on-surface">
              {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>

        {/* About Company & Description */}
        {job.aboutCompany && (
          <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs">
            <strong className="text-on-surface">About the Hiring Organization: </strong>
            <span className="text-on-surface-variant">{job.aboutCompany}</span>
          </div>
        )}

        {job.description && (
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Role Description</span>
            <p className="font-body-default text-on-surface-variant text-sm whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
        )}
      </div>

      {/* Candidate Applications Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline-sm text-on-surface">
              Candidate Applications ({job.applications.length})
            </h2>
            <p className="text-xs text-on-surface-variant">
              Full candidate dossiers, match scores, interview scheduling, and selection decisions.
            </p>
          </div>

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
                <th className="px-4 py-3">Program / Faculty</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Pipeline Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {job.applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => setInspecting(app)}
                  className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-high/50 cursor-pointer transition-colors"
                >
                  {/* Candidate Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-[11px] shrink-0">
                        {app.candidateName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <span className="font-body-medium text-on-surface font-bold block">{app.candidateName}</span>
                        {app.gradYear && (
                          <span className="text-[11px] text-on-surface-variant">Class of {app.gradYear}</span>
                        )}
                        {app.cvUrl && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-secondary font-bold font-code-compact">
                            <span className="material-symbols-outlined text-[12px]">description</span>
                            <span>CV Attached</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Degree / Program */}
                  <td className="px-4 py-3 font-body-default text-on-surface-variant text-xs">
                    <div>{app.degree}</div>
                    {app.faculty && <div className="text-[10px] text-on-surface-variant/70">{app.faculty}</div>}
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3 font-body-default text-on-surface-variant text-xs">
                    <div>{app.email}</div>
                    {app.phone && <div className="text-[11px] text-on-surface-variant/70">{app.phone}</div>}
                  </td>

                  {/* Experience */}
                  <td className="px-4 py-3 font-body-default text-on-surface text-xs font-semibold">
                    {app.experienceYears} yrs
                  </td>

                  {/* Match Score */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-code-compact font-bold text-xs ${matchScoreColor(app.matchScore)}`}>
                      {app.matchScore}%
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full font-body-compact text-xs font-bold ${STATUS_STYLES[app.status] ?? ""}`}>
                      {app.status.replaceAll("_", " ")}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspecting(app);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-on-primary-container text-xs font-bold transition-colors"
                    >
                      Dossier
                    </button>
                  </td>
                </tr>
              ))}

              {job.applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-body-default text-on-surface-variant">
                    No candidate applications submitted for this job opening yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {inspecting && (
        <CandidateDossierModal jobId={job.id} application={inspecting} onClose={() => setInspecting(null)} />
      )}
      {addOpen && <AddApplicationModal jobId={job.id} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
