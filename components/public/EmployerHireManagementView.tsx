"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  ChevronRight,
  Eye,
  PlusCircle,
  Search,
  Zap,
  Filter,
  Check,
  X,
  Phone,
  Mail,
  GraduationCap,
  Award,
  ArrowUpRight,
  ExternalLink,
  FileText,
  Trophy,
  AlertCircle,
  Send,
  Download,
} from "lucide-react";
import PostJobModal from "./PostJobModal";

export interface CandidateApplication {
  id: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  degree: string | null;
  faculty: string | null;
  gradYear: number | null;
  avatarUrl: string | null;
  experienceYears: number;
  matchScore: number;
  status: string; // APPLIED, REVIEWING, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED
  interviewDate: string | null;
  notes: string | null;
  selectedDate: string | null;
  offerSalary: string | null;
  startDate: string | null;
  decisionStatus: string | null;
  recruiterRemarks: string | null;
  linkedinUrl: string | null;
  coverNote: string | null;
  cvUrl?: string | null;
  cvFileName?: string | null;
  applicationRef: string;
  createdAt: string;
}

export interface ManagedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  country: string | null;
  state: string | null;
  city: string | null;
  type: string;
  workplaceType: string | null;
  salary: string;
  category: string;
  description: string;
  aboutCompany: string | null;
  experienceRequired: boolean;
  experienceLevel: string | null;
  hiringType: string;
  positionsOpen: number;
  deadline: string | null;
  status: string;
  postedDate: string;
  applications: CandidateApplication[];
}

const PIPELINE_STATUSES = [
  "all",
  "APPLIED",
  "REVIEWING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "SELECTED",
  "REJECTED",
] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
  APPLIED: "bg-slate-100 text-slate-800 border-slate-200",
  REVIEWING: "bg-amber-50 text-amber-800 border-amber-200",
  SHORTLISTED: "bg-blue-50 text-blue-800 border-blue-200",
  INTERVIEW_SCHEDULED: "bg-purple-50 text-purple-800 border-purple-200",
  SELECTED: "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

export interface UserAppliedJobItem {
  id: string;
  jobId: string;
  applicationRef: string;
  candidateName: string | null;
  email: string | null;
  phone: string | null;
  degree: string | null;
  faculty: string | null;
  gradYear: number | null;
  experienceYears: number;
  matchScore: number;
  status: string; // APPLIED, REVIEWING, SHORTLISTED, INTERVIEW_SCHEDULED, SELECTED, REJECTED
  interviewDate: string | null;
  notes: string | null;
  selectedDate: string | null;
  offerSalary: string | null;
  startDate: string | null;
  decisionStatus: string | null;
  recruiterRemarks: string | null;
  linkedinUrl: string | null;
  coverNote: string | null;
  cvUrl?: string | null;
  cvFileName?: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    country: string | null;
    state: string | null;
    city: string | null;
    salary: string;
    type: string;
    workplaceType: string | null;
    category: string;
    experienceRequired: boolean;
    experienceLevel: string | null;
    hiringType: string;
    positionsOpen: number;
    deadline: string | null;
    status: string;
    postedDate: string;
    postedByType: string;
    postedByName: string | null;
  };
}

export default function EmployerHireManagementView({
  initialJobs,
  initialApplications = [],
  alumniProfileName,
  defaultTab = "posted",
}: {
  initialJobs: ManagedJob[];
  initialApplications?: UserAppliedJobItem[];
  alumniProfileName: string;
  defaultTab?: "posted" | "applications";
}) {
  const [mainTab, setMainTab] = useState<"applications" | "posted">(defaultTab);
  const [applications, setApplications] = useState<UserAppliedJobItem[]>(initialApplications);
  const [appSearch, setAppSearch] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState("all");
  const [jobs, setJobs] = useState<ManagedJob[]>(initialJobs);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobs[0]?.id || "");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateApplication | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState<string>("all");
  const [candidateSearch, setCandidateSearch] = useState("");

  // Candidate Status Action Modal State
  const [updatingCandidateId, setUpdatingCandidateId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("SHORTLISTED");
  const [interviewDateInput, setInterviewDateInput] = useState<string>("");
  const [notesInput, setNotesInput] = useState<string>("");
  const [offerSalaryInput, setOfferSalaryInput] = useState<string>("");
  const [startDateInput, setStartDateInput] = useState<string>("");
  const [decisionStatusInput, setDecisionStatusInput] = useState<string>("OFFER_EXTENDED");
  const [remarksInput, setRemarksInput] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  // Aggregated Stats across all jobs posted by this alumni
  const totalJobsCount = jobs.length;
  const totalOpenings = jobs.reduce((acc, j) => acc + (j.positionsOpen || 1), 0);
  const totalCandidates = jobs.reduce((acc, j) => acc + j.applications.length, 0);
  const totalShortlisted = jobs.reduce(
    (acc, j) => acc + j.applications.filter((a) => a.status === "SHORTLISTED" || a.status === "INTERVIEW_SCHEDULED").length,
    0
  );
  const totalSelected = jobs.reduce(
    (acc, j) => acc + j.applications.filter((a) => a.status === "SELECTED").length,
    0
  );

  // Aggregated Stats for applications
  const appUnderReview = applications.filter((a) => a.status === "REVIEWING").length;
  const appShortlisted = applications.filter((a) => a.status === "SHORTLISTED").length;
  const appInterviews = applications.filter((a) => a.status === "INTERVIEW_SCHEDULED").length;
  const appSelected = applications.filter((a) => a.status === "SELECTED").length;

  const filteredApplications = applications.filter((app) => {
    const matchesStatus = appStatusFilter === "all" || app.status === appStatusFilter;
    const q = appSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      app.job.title.toLowerCase().includes(q) ||
      app.job.company.toLowerCase().includes(q) ||
      app.job.location.toLowerCase().includes(q) ||
      app.applicationRef.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const filteredCandidates = (selectedJob?.applications || []).filter((cand) => {
    const matchesStatus = candidateFilter === "all" || cand.status === candidateFilter;
    const q = candidateSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (cand.candidateName && cand.candidateName.toLowerCase().includes(q)) ||
      (cand.email && cand.email.toLowerCase().includes(q)) ||
      (cand.degree && cand.degree.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  async function handleUpdateJobStatus(jobId: string, newJobStatus: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newJobStatus }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newJobStatus } : j)));
      }
    } catch {
      // ignore
    }
  }

  async function handleSaveCandidateAction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedJob || !selectedCandidate) return;
    setActionLoading(true);
    setActionError(null);

    try {
      let body: Record<string, unknown> = { status: newStatus };

      if (newStatus === "INTERVIEW_SCHEDULED") {
        body.interviewDate = interviewDateInput ? new Date(interviewDateInput).toISOString() : null;
        body.notes = notesInput;
      } else if (newStatus === "SELECTED") {
        const selectRes = await fetch(`/api/jobs/${selectedJob.id}/applications/${selectedCandidate.id}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerSalary: offerSalaryInput || selectedJob.salary,
            startDate: startDateInput ? new Date(startDateInput).toISOString() : new Date().toISOString(),
            decisionStatus: decisionStatusInput,
            recruiterRemarks: remarksInput,
          }),
        });
        const selectJson = await selectRes.json();
        if (!selectRes.ok) {
          setActionError(selectJson.error || "Failed to record selection offer");
          setActionLoading(false);
          return;
        }

        // Update local state
        setJobs((prev) =>
          prev.map((j) => {
            if (j.id !== selectedJob.id) return j;
            return {
              ...j,
              applications: j.applications.map((app) =>
                app.id === selectedCandidate.id
                  ? {
                      ...app,
                      status: "SELECTED",
                      offerSalary: offerSalaryInput,
                      decisionStatus: decisionStatusInput,
                      recruiterRemarks: remarksInput,
                    }
                  : app
              ),
            };
          })
        );
        setSelectedCandidate((prev) =>
          prev
            ? {
                ...prev,
                status: "SELECTED",
                offerSalary: offerSalaryInput,
                decisionStatus: decisionStatusInput,
                recruiterRemarks: remarksInput,
              }
            : null
        );
        setUpdatingCandidateId(null);
        setActionLoading(false);
        return;
      }

      const res = await fetch(`/api/jobs/${selectedJob.id}/applications/${selectedCandidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        setActionError(json.error || "Failed to update candidate");
        setActionLoading(false);
        return;
      }

      setJobs((prev) =>
        prev.map((j) => {
          if (j.id !== selectedJob.id) return j;
          return {
            ...j,
            applications: j.applications.map((app) =>
              app.id === selectedCandidate.id ? { ...app, ...body } : app
            ),
          };
        })
      );
      setSelectedCandidate((prev) => (prev ? { ...prev, ...body } : null));
      setUpdatingCandidateId(null);
    } catch {
      setActionError("Network error occurred.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Top Banner */}
      <section className="bg-slate-950 text-white border-b border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-300">
                {mainTab === "applications" ? (
                  <>
                    <Send className="h-3.5 w-3.5 text-teal-400" />
                    <span>Candidate Application Tracker</span>
                  </>
                ) : (
                  <>
                    <Briefcase className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Alumni Hiring Manager Portal</span>
                  </>
                )}
              </div>
              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">
                {mainTab === "applications"
                  ? "My Applications & Status Tracker"
                  : "Hire Management & Candidate Pipeline"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                {mainTab === "applications"
                  ? `Welcome back, ${alumniProfileName}. Track the real-time status of jobs you applied for, review upcoming interviews, and evaluate offer packages.`
                  : `Welcome back, ${alumniProfileName}. Manage your posted job listings, evaluate applicants, shortlist, and extend offers.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/jobs"
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                View Public Jobs Portal
              </Link>

              <button
                onClick={() => setIsPostJobOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-lg hover:bg-emerald-500 transition-all active:scale-98"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post New Job Opening</span>
              </button>
            </div>
          </div>

          {/* Main Mode Tabs Switcher */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={() => setMainTab("applications")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs transition-all ${
                mainTab === "applications"
                  ? "bg-teal-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Send className="w-4 h-4" />
              <span>My Submitted Applications</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  mainTab === "applications" ? "bg-slate-950 text-teal-300" : "bg-slate-800 text-slate-300"
                }`}
              >
                {applications.length}
              </span>
            </button>

            <button
              onClick={() => setMainTab("posted")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-xs transition-all ${
                mainTab === "posted"
                  ? "bg-emerald-500 text-slate-950 shadow-md"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Hire Management &amp; Posted Jobs</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  mainTab === "posted" ? "bg-slate-950 text-emerald-300" : "bg-slate-800 text-slate-300"
                }`}
              >
                {jobs.length}
              </span>
            </button>
          </div>

          {/* Metrics */}
          {mainTab === "applications" ? (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Applied</div>
                <div className="text-2xl font-black text-white mt-1">{applications.length}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Under Review</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{appUnderReview}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Shortlisted</div>
                <div className="text-2xl font-black text-indigo-400 mt-1">{appShortlisted}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Interviews</div>
                <div className="text-2xl font-black text-purple-400 mt-1">{appInterviews}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Offers / Selected</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{appSelected}</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-slate-800/80">
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">My Posted Jobs</div>
                <div className="text-2xl font-black text-white mt-1">{totalJobsCount}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Open Positions</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{totalOpenings}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Candidates</div>
                <div className="text-2xl font-black text-white mt-1">{totalCandidates}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Shortlisted</div>
                <div className="text-2xl font-black text-purple-400 mt-1">{totalShortlisted}</div>
              </div>
              <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Selected / Placed</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{totalSelected}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Interactive Stage */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {mainTab === "applications" ? (
          <div className="space-y-6">
            {/* Search and Status Filters */}
            <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search applications by job title, company, location, or ref code…"
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
                >
                  <option value="all">All Applications ({applications.length})</option>
                  <option value="APPLIED">Applied / Received</option>
                  <option value="REVIEWING">Under Review ({appUnderReview})</option>
                  <option value="SHORTLISTED">Shortlisted ({appShortlisted})</option>
                  <option value="INTERVIEW_SCHEDULED">Interview Scheduled ({appInterviews})</option>
                  <option value="SELECTED">Selected / Offer Extended ({appSelected})</option>
                  <option value="REJECTED">Closed / Not Selected</option>
                </select>
              </div>
            </div>

            {/* Applications List */}
            {filteredApplications.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
                <Send className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h2 className="text-xl font-bold text-slate-900">No Job Applications Found</h2>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  {applications.length === 0
                    ? "You haven't submitted any job applications through the portal yet. Explore verified institutional and alumni openings now!"
                    : "No applications matched your search or status filter criteria."}
                </p>
                <Link
                  href="/jobs"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>Browse Career Opportunities</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApplications.map((app) => (
                  <div
                    key={app.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-2">
                        {app.status === "SELECTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>OFFER EXTENDED / SELECTED</span>
                          </span>
                        ) : app.status === "INTERVIEW_SCHEDULED" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-black shadow-xs animate-pulse">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>INTERVIEW SCHEDULED</span>
                          </span>
                        ) : app.status === "SHORTLISTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>SHORTLISTED FOR ROLE</span>
                          </span>
                        ) : app.status === "REVIEWING" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                            <Clock className="w-3.5 h-3.5" />
                            <span>UNDER ACTIVE REVIEW</span>
                          </span>
                        ) : app.status === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-600 text-white text-xs font-black shadow-xs">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>APPLICATION CLOSED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600 text-white text-xs font-black shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>APPLICATION SUBMITTED</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-500 font-medium">
                          Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="text-xs font-mono font-bold text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                        Ref: {app.applicationRef}
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <Link
                          href={`/jobs/${app.job.id}`}
                          className="text-xl font-black text-slate-900 hover:text-emerald-700 transition-colors flex items-center gap-2 group"
                        >
                          <span>{app.job.title}</span>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-semibold">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{app.job.company}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{app.job.location}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{app.job.salary}</span>
                          </span>
                          <span>•</span>
                          <span>{app.job.type.replace(/_/g, " ")}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jobs/${app.job.id}#application-section`}
                          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all active:scale-98"
                        >
                          <span>View Live Status Tracker</span>
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>

                    {/* Interview Alert Box if Scheduled */}
                    {app.status === "INTERVIEW_SCHEDULED" && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-purple-950">
                          <Calendar className="w-4 h-4 text-purple-700" />
                          <span>Interview Scheduled:</span>
                          {app.interviewDate && (
                            <span className="text-purple-800">
                              {new Date(app.interviewDate).toLocaleString(undefined, {
                                dateStyle: "full",
                                timeStyle: "short",
                              })}
                            </span>
                          )}
                        </div>
                        {app.notes && (
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-purple-100">
                            <strong>Recruiter Notes:</strong> {app.notes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Selection / Offer Alert Box */}
                    {app.status === "SELECTED" && (
                      <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-emerald-950">
                          <Trophy className="w-4 h-4 text-emerald-700" />
                          <span>Job Offer Extended:</span>
                          <span className="text-emerald-800">
                            Offered Package: {app.offerSalary || app.job.salary}
                          </span>
                          {app.startDate && (
                            <span>• Target Start: {new Date(app.startDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {app.recruiterRemarks && (
                          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-emerald-100 italic">
                            &ldquo;{app.recruiterRemarks}&rdquo;
                          </p>
                        )}
                      </div>
                    )}

                    {/* Attached CV Preview & Download */}
                    {app.cvUrl && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-slate-500 font-medium">Submitted CV:</span>
                          <span className="font-bold text-slate-800 truncate">{app.cvFileName || "Curriculum_Vitae.pdf"}</span>
                        </div>
                        <a
                          href={app.cvUrl}
                          download={app.cvFileName || "My_Resume.pdf"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download CV</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : jobs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h2 className="text-xl font-bold text-slate-900">No Posted Jobs Yet</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              You haven&apos;t posted any job openings under your alumni profile yet. Post an opportunity to find top IPAM talent!
            </p>
            <button
              onClick={() => setIsPostJobOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post Your First Job Opening</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Sidebar: List of Jobs Posted by this User */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Posted Openings ({jobs.length})
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Select to manage</span>
              </div>

              <div className="space-y-2.5">
                {jobs.map((j) => {
                  const isSelected = j.id === selectedJob?.id;
                  return (
                    <div
                      key={j.id}
                      onClick={() => {
                        setSelectedJobId(j.id);
                        setSelectedCandidate(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/10"
                          : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className={`text-sm font-bold truncate ${isSelected ? "text-emerald-900" : "text-slate-900"}`}>
                            {j.title}
                          </h3>
                          <p className="text-xs text-emerald-700 font-semibold truncate">{j.company}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase shrink-0 ${
                            j.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {j.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <strong>{j.applications.length}</strong> candidates
                        </span>
                        <span className="font-semibold text-slate-700">{j.salary}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Job Details & Candidate Hire Pipeline */}
            {selectedJob && (
              <div className="lg:col-span-8 space-y-6">
                {/* Selected Job Banner & Controls */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedJob.title}</h2>
                        <Link
                          href={`/jobs/${selectedJob.id}`}
                          target="_blank"
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                          title="View Public Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-0.5">{selectedJob.company}</p>
                    </div>

                    {/* Job Status Switcher */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">Job Status:</span>
                      <select
                        value={selectedJob.status}
                        onChange={(e) => handleUpdateJobStatus(selectedJob.id, e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
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

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Location</span>
                      <span className="font-bold text-slate-800">{selectedJob.location}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Salary</span>
                      <span className="font-bold text-emerald-800">{selectedJob.salary}</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Experience</span>
                      <span className="font-bold text-slate-800">
                        {selectedJob.experienceRequired ? selectedJob.experienceLevel || "Required" : "Not Required"}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Timeline</span>
                      <span className="font-bold text-slate-800">
                        {selectedJob.hiringType === "IMMEDIATE" ? "⚡ Immediate Hiring" : "Hiring Till Date"}
                      </span>
                    </div>
                  </div>

                  {selectedJob.aboutCompany && (
                    <div className="text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      <strong>About Employer: </strong> {selectedJob.aboutCompany}
                    </div>
                  )}
                </div>

                {/* Candidate Applications Management */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        Candidates Applied ({selectedJob.applications.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Click on any candidate to inspect their dossier, change status, schedule interviews, or extend an offer.
                      </p>
                    </div>

                    {/* Filter by status */}
                    <div className="flex items-center gap-2">
                      <select
                        value={candidateFilter}
                        onChange={(e) => setCandidateFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                      >
                        {PIPELINE_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st === "all" ? "All Statuses" : st.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Search Candidate */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter candidate by name, degree, or email…"
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Candidate List */}
                  {filteredCandidates.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                      <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No candidate applications in this view</p>
                      <p className="text-[11px] text-slate-500">Share your job opening link to receive alumni applicants.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden">
                      {filteredCandidates.map((cand: CandidateApplication) => (
                        <div
                          key={cand.id}
                          onClick={() => setSelectedCandidate(cand)}
                          className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {cand.avatarUrl ? (
                              <img
                                src={cand.avatarUrl}
                                alt={cand.candidateName || "Candidate"}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-sm">
                                {(cand.candidateName || "C").charAt(0)}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 truncate">
                                  {cand.candidateName || "Unnamed Candidate"}
                                </span>
                                {cand.gradYear && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    Class of &apos;{String(cand.gradYear).slice(-2)}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 truncate">{cand.degree || "IPAM Graduate"}</p>
                              {cand.email && <p className="text-[11px] text-slate-400 truncate">{cand.email}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {cand.cvUrl && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <FileText className="w-3 h-3 text-emerald-600" />
                                <span>CV Attached</span>
                              </span>
                            )}

                            <span className="text-[11px] font-bold text-slate-500">
                              Match: <strong className="text-emerald-700">{cand.matchScore}%</strong>
                            </span>

                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] border font-bold uppercase ${
                                STATUS_BADGE_STYLES[cand.status] || "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {cand.status.replace(/_/g, " ")}
                            </span>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCandidate(cand);
                                setUpdatingCandidateId(cand.id);
                                setNewStatus(cand.status);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-colors border border-slate-200"
                            >
                              Manage Status
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Candidate Dossier & Action Modal */}
      {selectedCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs"
          onClick={() => {
            setSelectedCandidate(null);
            setUpdatingCandidateId(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative my-8 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {selectedCandidate.avatarUrl ? (
                  <img
                    src={selectedCandidate.avatarUrl}
                    alt={selectedCandidate.candidateName || ""}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg">
                    {(selectedCandidate.candidateName || "C").charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedCandidate.candidateName}</h3>
                  <p className="text-xs text-slate-500">
                    Ref: {selectedCandidate.applicationRef} &middot; Match Score:{" "}
                    <strong className="text-emerald-700 font-bold">{selectedCandidate.matchScore}%</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate(null);
                  setUpdatingCandidateId(null);
                }}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 block font-semibold">Degree / Program</span>
                <span className="font-bold text-slate-800">{selectedCandidate.degree || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Graduation Year</span>
                <span className="font-bold text-slate-800">
                  {selectedCandidate.gradYear ? `Class of ${selectedCandidate.gradYear}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Email</span>
                <span className="font-bold text-slate-800">{selectedCandidate.email || "—"}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Phone</span>
                <span className="font-bold text-slate-800">{selectedCandidate.phone || "—"}</span>
              </div>
              {selectedCandidate.linkedinUrl && (
                <div className="col-span-2">
                  <span className="text-slate-400 block font-semibold">LinkedIn Profile</span>
                  <a
                    href={`https://${selectedCandidate.linkedinUrl.replace(/^https?:\/\//, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <span>{selectedCandidate.linkedinUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {selectedCandidate.cvUrl && (
                <div className="col-span-2 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-3 bg-emerald-50/80 -mx-4 -mb-4 p-3 rounded-b-2xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Candidate CV Document</span>
                      <span className="font-bold text-slate-800 text-xs truncate block">{selectedCandidate.cvFileName || "Curriculum_Vitae.pdf"}</span>
                    </div>
                  </div>
                  <a
                    href={selectedCandidate.cvUrl}
                    download={selectedCandidate.cvFileName || `${selectedCandidate.candidateName || "Candidate"}_CV.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download CV</span>
                  </a>
                </div>
              )}
            </div>

            {selectedCandidate.coverNote && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Candidate Cover Note</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic leading-relaxed">
                  &ldquo;{selectedCandidate.coverNote}&rdquo;
                </p>
              </div>
            )}

            {selectedCandidate.decisionStatus && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-900">Selection Decision Recorded</div>
                <div>Offer Salary: <strong>{selectedCandidate.offerSalary}</strong></div>
                <div>Status: <strong>{selectedCandidate.decisionStatus.replace(/_/g, " ")}</strong></div>
                {selectedCandidate.recruiterRemarks && (
                  <div>Remarks: <em>{selectedCandidate.recruiterRemarks}</em></div>
                )}
              </div>
            )}

            {/* Status Update Form */}
            <form onSubmit={handleSaveCandidateAction} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Update Pipeline Status
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase ${
                    STATUS_BADGE_STYLES[selectedCandidate.status] || ""
                  }`}
                >
                  Current: {selectedCandidate.status}
                </span>
              </div>

              {actionError && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">{actionError}</div>}

              <div className="grid grid-cols-3 gap-2">
                {["SHORTLISTED", "INTERVIEW_SCHEDULED", "SELECTED", "REVIEWING", "REJECTED"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setNewStatus(st)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      newStatus === st
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                ))}
              </div>

              {/* Conditional Input for Interview Scheduling */}
              {newStatus === "INTERVIEW_SCHEDULED" && (
                <div className="space-y-3 p-3 bg-purple-50/60 rounded-xl border border-purple-200">
                  <label className="block text-xs font-bold text-purple-950">
                    Interview Date &amp; Time
                    <input
                      type="datetime-local"
                      value={interviewDateInput}
                      onChange={(e) => setInterviewDateInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-purple-500"
                    />
                  </label>
                  <label className="block text-xs font-bold text-purple-950">
                    Interview Notes / Meeting Link
                    <textarea
                      rows={2}
                      placeholder="e.g. Google Meet link or room number, interviewers attending…"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-purple-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-purple-500"
                    />
                  </label>
                </div>
              )}

              {/* Conditional Input for Candidate Selection / Offer */}
              {newStatus === "SELECTED" && (
                <div className="space-y-3 p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-950">Selection &amp; Job Offer Details</div>
                  <label className="block text-xs font-bold text-slate-700">
                    Offer Salary
                    <input
                      placeholder={selectedJob?.salary || "e.g. SLE 30,000 / mo"}
                      value={offerSalaryInput}
                      onChange={(e) => setOfferSalaryInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Target Start Date
                      <input
                        type="date"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                      />
                    </label>
                    <label className="block text-xs font-bold text-slate-700">
                      Decision Stage
                      <select
                        value={decisionStatusInput}
                        onChange={(e) => setDecisionStatusInput(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-500"
                      >
                        <option value="OFFER_EXTENDED">Offer Extended</option>
                        <option value="OFFER_ACCEPTED">Offer Accepted</option>
                        <option value="PLACEMENT_CONFIRMED">Placement Confirmed</option>
                      </select>
                    </label>
                  </div>
                  <label className="block text-xs font-bold text-slate-700">
                    Recruiter Remarks
                    <textarea
                      rows={2}
                      placeholder="Special terms, sign-on conditions, or confirmation notes…"
                      value={remarksInput}
                      onChange={(e) => setRemarksInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setUpdatingCandidateId(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? "Saving Decision…" : "Save Status & Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPostJobOpen && (
        <PostJobModal
          onClose={() => {
            setIsPostJobOpen(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
