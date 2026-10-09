"use client";

import { useState } from "react";
import { useAdminJobs } from "@/hooks/admin/useAdminJobs";
import { useAdminSession } from "@/lib/admin/context";
import SelectionOfferModal from "./SelectionOfferModal";
import type { JobApplicationRow } from "./JobDetailView";

const STATUS_OPTIONS = ["APPLIED", "REVIEWING", "SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED"];

export default function CandidateDossierModal({
  jobId,
  application,
  onClose,
}: {
  jobId: string;
  application: JobApplicationRow;
  onClose: () => void;
}) {
  const { can } = useAdminSession();
  const { updateApplication, loading } = useAdminJobs();
  const [offerOpen, setOfferOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState(application.interviewDate ? application.interviewDate.slice(0, 16) : "");
  const [notes, setNotes] = useState(application.notes || "");
  const [status, setStatus] = useState(application.status);
  const [interviewPanelOpen, setInterviewPanelOpen] = useState(application.status === "INTERVIEW_SCHEDULED");

  const canWrite = can("JOBS", "canWrite");
  const canApprove = can("JOBS", "canApprove");

  async function handleStatusSelect(newStatus: string) {
    setStatus(newStatus);
    if (newStatus === "INTERVIEW_SCHEDULED") {
      setInterviewPanelOpen(true);
    } else {
      setInterviewPanelOpen(false);
      await updateApplication(jobId, application.id, { status: newStatus });
    }
  }

  async function handleScheduleInterview() {
    await updateApplication(jobId, application.id, {
      status: "INTERVIEW_SCHEDULED",
      interviewDate: interviewDate ? new Date(interviewDate).toISOString() : undefined,
      notes,
    });
    setInterviewPanelOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="w-full max-w-lg my-8 max-h-[88vh] overflow-y-auto rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4 border-b border-outline-variant/15 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-[14px] shrink-0">
              {application.candidateName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h2 className="font-headline-md text-on-surface">{application.candidateName}</h2>
              <span className="text-xs text-on-surface-variant font-code-compact">
                Class of {application.gradYear}
              </span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-2 font-body-default text-on-surface-variant text-xs bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/15">
          <p>
            <strong className="text-on-surface">Academic Program:</strong> {application.degree} &middot; {application.faculty}
          </p>
          <p>
            <strong className="text-on-surface">Contact:</strong> {application.email} &middot; {application.phone}
          </p>
          <p className="flex items-center gap-2">
            <strong className="text-on-surface">Experience:</strong> {application.experienceYears} yrs
            <span>&middot;</span>
            <strong className="text-on-surface">Match:</strong>{" "}
            <span className="px-1.5 py-0.5 rounded-full font-code-compact font-bold bg-secondary/15 text-secondary">
              {application.matchScore}%
            </span>
          </p>
          {application.linkedinUrl && (
            <p>
              <strong className="text-on-surface">LinkedIn:</strong>{" "}
              <a
                href={`https://${application.linkedinUrl.replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {application.linkedinUrl}
              </a>
            </p>
          )}
        </div>

        {application.coverNote && (
          <div className="mt-3 space-y-1">
            <span className="text-xs font-bold uppercase text-on-surface-variant">Applicant Statement</span>
            <p className="text-xs italic bg-surface-container-low p-3 rounded-xl border border-outline-variant/15 text-on-surface">
              &ldquo;{application.coverNote}&rdquo;
            </p>
          </div>
        )}

        {application.cvUrl && (
          <div className="mt-3 p-3.5 bg-secondary/10 border border-secondary/20 rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <span className="font-bold text-on-surface block">Attached Curriculum Vitae (CV)</span>
              <span className="text-on-surface-variant text-[11px] font-mono truncate block">
                {application.cvFileName || "Curriculum_Vitae.pdf"}
              </span>
            </div>
            <a
              href={application.cvUrl}
              download={application.cvFileName || `${application.candidateName}_CV.pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-on-secondary font-bold text-xs hover:opacity-90 transition-opacity shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Download CV</span>
            </a>
          </div>
        )}

        {canWrite && (
          <label className="block mt-4 font-body-compact text-on-surface-variant text-xs font-bold">
            Pipeline Status
            <select
              value={status}
              disabled={loading}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary text-xs font-bold"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Interview scheduling panel */}
        {interviewPanelOpen && (
          <div className="mt-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2.5">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-purple-500">calendar_month</span>
              <span>Schedule Interview Session</span>
            </div>
            <label className="block text-[11px] text-on-surface-variant">
              Interview Date &amp; Time
              <input
                type="datetime-local"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 px-2.5 py-1.5 text-xs text-on-surface outline-none focus:border-primary"
              />
            </label>
            <label className="block text-[11px] text-on-surface-variant">
              Notes / Location / Meeting Link
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1 w-full rounded-lg bg-surface-container border border-outline-variant/30 p-2 text-xs text-on-surface outline-none focus:border-primary"
                placeholder="Interview committee details, meeting links, or venue…"
              />
            </label>
            <button
              type="button"
              disabled={loading}
              onClick={handleScheduleInterview}
              className="w-full py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity"
            >
              {loading ? "Scheduling…" : "Save Interview Schedule"}
            </button>
          </div>
        )}

        {canApprove && application.status !== "SELECTED" && (
          <button
            type="button"
            onClick={() => setOfferOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity text-xs font-bold"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            Select Candidate &amp; Extend Offer
          </button>
        )}

        {application.decisionStatus && (
          <div className="mt-4 rounded-lg bg-secondary-container text-on-secondary-container px-3.5 py-2.5 font-body-compact text-xs space-y-1">
            <div className="font-bold">Hiring Offer Recorded</div>
            <div>Offer Salary: <strong>{application.offerSalary}</strong></div>
            <div>Status: <strong>{application.decisionStatus.replaceAll("_", " ")}</strong></div>
            {application.recruiterRemarks && (
              <div>Remarks: <em>{application.recruiterRemarks}</em></div>
            )}
          </div>
        )}
      </div>

      {offerOpen && (
        <SelectionOfferModal
          jobId={jobId}
          applicationId={application.id}
          candidateName={application.candidateName}
          onClose={() => {
            setOfferOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}
