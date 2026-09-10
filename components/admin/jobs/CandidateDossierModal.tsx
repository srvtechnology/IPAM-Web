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
  const canWrite = can("JOBS", "canWrite");
  const canApprove = can("JOBS", "canApprove");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-[14px] shrink-0">
              {application.candidateName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <h2 className="font-headline-md text-on-surface">{application.candidateName}</h2>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="space-y-1.5 font-body-default text-on-surface-variant">
          <p>{application.degree} &middot; {application.faculty} &middot; Class of {application.gradYear}</p>
          <p>{application.email} &middot; {application.phone}</p>
          <p>
            {application.experienceYears} yrs experience &middot; Match score{" "}
            <span className="px-1.5 py-0.5 rounded-full font-code-compact font-bold bg-secondary/15 text-secondary">
              {application.matchScore}%
            </span>
          </p>
          {application.coverNote && <p className="pt-2 italic">&ldquo;{application.coverNote}&rdquo;</p>}
        </div>

        {canWrite && (
          <label className="block mt-4 font-body-compact text-on-surface-variant">
            Pipeline status
            <select
              defaultValue={application.status}
              disabled={loading}
              onChange={(e) => updateApplication(jobId, application.id, { status: e.target.value })}
              className="mt-1 w-full rounded-lg bg-surface-container-low border border-outline-variant/30 px-3 py-2 font-body-default text-on-surface outline-none focus:border-primary"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
        )}

        {canApprove && application.status !== "SELECTED" && (
          <button
            type="button"
            onClick={() => setOfferOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-1.5 rounded-lg bg-primary-container text-on-primary-container px-4 py-2 font-body-medium hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            Select &amp; Extend Offer
          </button>
        )}

        {application.decisionStatus && (
          <div className="mt-4 rounded-lg bg-secondary-container text-on-secondary-container px-3 py-2 font-body-compact">
            Offer: {application.offerSalary} &middot; {application.decisionStatus.replaceAll("_", " ")}
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
