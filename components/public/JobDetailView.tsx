"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Send,
  Bookmark,
  BookmarkCheck,
  Share2,
  ShieldCheck,
  Award,
  ChevronRight,
  Globe,
  Layers,
  FileText,
  Check,
  Zap,
  Users,
  Briefcase,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useToggleSaveJob } from "@/hooks/public/useJobActions";
import { useApplyToJob, type JobApplicationRecord } from "@/hooks/public/useApplyToJob";
import { useApp } from "@/lib/public/context";

export interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  type: string;
  workplaceType: string | null;
  salary: string;
  category: string;
  description: string;
  responsibilities: string[] | null;
  requirements: string[];
  benefits: string[] | null;
  aboutCompany: string | null;
  experienceRequired?: boolean;
  experienceLevel?: string | null;
  hiringType?: string;
  positionsOpen?: number;
  postedByType?: string;
  postedByName?: string | null;
  postedByTitle?: string | null;
  postedByAlumni?: { id?: string; name: string; classYear?: number; currentRole?: string; avatar: string | null } | null;
  postedByAdmin?: { id?: string; name: string; title?: string; department?: string } | null;
  postedDate?: string;
  deadline?: string | null;
  applyUrl: string | null;
  saved: boolean;
}

export interface RelatedJob {
  id: string;
  title: string;
  company: string;
  category: string;
  type: string;
  salary: string;
  description: string;
}

export default function JobDetailView({
  job,
  relatedJobs,
  application,
  isPoster = false,
  applicationsCount = 0,
}: {
  job: JobDetail;
  relatedJobs: RelatedJob[];
  application: JobApplicationRecord | null;
  isPoster?: boolean;
  applicationsCount?: number;
}) {
  const { session } = useApp();
  const { saved, loading: saving, toggle } = useToggleSaveJob(job.id, job.saved);
  const { application: currentApplication, loading: applying, error, apply } = useApplyToJob(job.id, application);
  const [linkedinUrl, setLinkedinUrl] = useState(
    session?.profile ? `linkedin.com/in/${session.profile.name.toLowerCase().replace(/\s+/g, "")}` : ""
  );
  const [phone, setPhone] = useState("");
  const [experienceYears, setExperienceYears] = useState(2);
  const [coverNote, setCoverNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    apply({ linkedinUrl, coverNote, phone, experienceYears });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore clipboard error
    }
  };

  const isImmediate = job.hiringType === "IMMEDIATE";
  const positions = job.positionsOpen ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Top Breadcrumbs Strip */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-hidden">
            <Link href="/" className="hover:text-emerald-700 font-medium transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link href="/jobs" className="hover:text-emerald-700 font-medium transition-colors shrink-0">
              Careers Portal
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-900 font-semibold truncate">{job.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/jobs"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Listings</span>
            </Link>

            {session && (
              <button
                onClick={toggle}
                disabled={saving}
                className={`p-2 rounded-lg border text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 ${
                  saved
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {saved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4 text-slate-500" />}
                <span className="hidden md:inline">{saved ? "Saved" : "Save"}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors flex items-center gap-1.5"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 text-xs font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span className="hidden md:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Poster Notification Banner if current user posted this job */}
        {isPoster && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-950 text-white p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Briefcase className="w-4 h-4" />
                <span>Your Posted Opening</span>
              </div>
              <h2 className="text-xl font-black">You are the hiring manager for this position</h2>
              <p className="text-xs text-slate-300">
                You have {applicationsCount} candidate application(s) received. Review candidate dossiers, shortlist, schedule interviews, and make selection offers.
              </p>
            </div>

            <Link
              href="/jobs/manage"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-98"
            >
              <span>Manage Candidates &amp; Hire Pipeline ({applicationsCount})</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 flex-1">
              {/* Badges Strip */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Attribution Badge */}
                {job.postedByType === "ADMIN" || job.postedByAdmin ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Posted by Admin: {job.postedByName || job.postedByAdmin?.name || "Institutional Office"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-teal-50 text-teal-800 px-3 py-1 rounded-full border border-teal-200">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Posted by Alumni: {job.postedByName || job.postedByAlumni?.name || "Verified Alumni"}</span>
                  </span>
                )}

                <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  {job.category.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                  {job.type.replace(/_/g, " ")}
                </span>
                {job.workplaceType && (
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                    {job.workplaceType.replace(/_/g, " ")}
                  </span>
                )}
                <span className="text-xs font-bold bg-sky-50 text-sky-800 px-3 py-1 rounded-full border border-sky-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span>{positions} {positions === 1 ? "Position Open" : "Positions Open"}</span>
                </span>
                {isImmediate && (
                  <span className="text-xs font-extrabold bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
                    <Zap className="w-3.5 h-3.5 text-rose-600" />
                    <span>Immediate Hiring</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-tight">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 text-lg font-bold text-emerald-700">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{job.company}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <a
                href="#application-section"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-extrabold text-sm text-center shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>{currentApplication ? "View Submitted Application" : "Apply for this Position"}</span>
              </a>

              {session && (
                <button
                  onClick={toggle}
                  disabled={saving}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-60 ${
                    saved
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? "fill-emerald-600 text-emerald-600" : "text-slate-400"}`} />
                  <span>{saved ? "Job Saved" : "Save for Later"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Salary Range</span>
              </div>
              <div className="text-base font-extrabold text-emerald-800">{job.salary}</div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Location</span>
              </div>
              <div className="text-sm font-bold text-slate-800 leading-tight">{job.location}</div>
              {job.country && <div className="text-[11px] text-slate-500 mt-0.5">{job.country}</div>}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Experience Required</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {job.experienceRequired ? (
                  <span className="text-indigo-700">{job.experienceLevel || "Required"}</span>
                ) : (
                  <span className="text-emerald-700">Not Required (Freshers)</span>
                )}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Hiring Timeline</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                {isImmediate ? (
                  <span className="text-rose-600 font-extrabold">⚡ Immediate Hiring</span>
                ) : job.deadline ? (
                  <span>Hiring till {new Date(job.deadline).toLocaleDateString()}</span>
                ) : (
                  <span>Rolling Intake</span>
                )}
              </div>
              {job.postedDate && (
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Posted {new Date(job.postedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* Poster Attribution Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                {job.postedByType === "ADMIN" || job.postedByAdmin ? (
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 border-2 border-amber-500 flex items-center justify-center font-bold text-amber-800 text-xl shrink-0">
                    <ShieldCheck className="w-7 h-7 text-amber-600" />
                  </div>
                ) : job.postedByAlumni?.avatar ? (
                  <img
                    src={job.postedByAlumni.avatar}
                    alt={job.postedByAlumni.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center font-bold text-emerald-700 text-xl shrink-0">
                    {(job.postedByName || job.postedByAlumni?.name || "A").charAt(0)}
                  </div>
                )}

                <div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span>
                      {job.postedByType === "ADMIN" || job.postedByAdmin
                        ? "Institutional Verified Listing"
                        : "Alumni Network Referral"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {job.postedByName || job.postedByAdmin?.name || job.postedByAlumni?.name || "IPAM Network"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {job.postedByTitle ||
                      job.postedByAdmin?.title ||
                      (job.postedByAlumni?.currentRole
                        ? `${job.postedByAlumni.currentRole} (Class of '${String(job.postedByAlumni.classYear).slice(-2)})`
                        : "Verified Member")}
                  </p>
                </div>
              </div>
            </div>

            {/* About Company */}
            {job.aboutCompany && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>About {job.company}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Company Overview</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {job.aboutCompany}
                </p>
              </div>
            )}

            {/* Job Description */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Position Details</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Job Description</h3>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Key Responsibilities</h3>
                <div className="space-y-2.5">
                  {job.responsibilities.map((r, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Requirements &amp; Qualifications</h3>
                <div className="space-y-2.5">
                  {job.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-slate-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Compensation &amp; Benefits</h3>
                <div className="space-y-2.5">
                  {job.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-sm text-slate-700 leading-relaxed">{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Application Section */}
            <div id="application-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Submit Application</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {currentApplication ? "Your Application Status" : "Fast-Track Candidate Application"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Applications are routed directly to the hiring manager and administration recruitment portal.
                </p>
              </div>

              {currentApplication ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Application Submitted</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Ref: {currentApplication.applicationRef}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-emerald-950 pt-2">
                    Current Status: <strong className="font-extrabold text-emerald-800">{currentApplication.status || "APPLIED"}</strong>
                  </div>

                  {currentApplication.coverNote && (
                    <p className="text-xs text-slate-600 italic bg-white/80 p-3 rounded-xl border border-emerald-100">
                      &ldquo;{currentApplication.coverNote}&rdquo;
                    </p>
                  )}

                  <div className="text-[11px] text-slate-500 pt-1">
                    Submitted on {new Date(currentApplication.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ) : session ? (
                <form onSubmit={handleApply} className="space-y-4">
                  {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block text-xs font-bold text-slate-700">
                      LinkedIn Profile URL
                      <input
                        placeholder="linkedin.com/in/yourprofile"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Phone Number (for recruiter contact)
                      <input
                        placeholder="+232 78 000 000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                      />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-slate-700">
                    Years of Relevant Work Experience
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </label>

                  <label className="block text-xs font-bold text-slate-700">
                    Candidate Cover Note / Intro *
                    <textarea
                      required
                      rows={3}
                      placeholder="Briefly state your suitability for this position, notable achievements, and availability…"
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-md transition-all hover:bg-emerald-700 disabled:opacity-50 active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>{applying ? "Submitting Application…" : "Submit Fast-Track Application"}</span>
                  </button>
                </form>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700">
                    You must be signed in as an IPAM Alumni to apply with verified credentials.
                  </p>
                  <Link
                    href={`/login?redirect=/jobs/${job.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                  >
                    <span>Sign In to Apply</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-base">Job Summary</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Positions</span>
                  <span className="font-bold text-slate-800">{positions} Open</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Employment</span>
                  <span className="font-bold text-slate-800">{job.type.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Workplace</span>
                  <span className="font-bold text-slate-800">{job.workplaceType ? job.workplaceType.replace(/_/g, " ") : "On-Site"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Experience</span>
                  <span className="font-bold text-slate-800">
                    {job.experienceRequired ? job.experienceLevel || "Required" : "Freshers Welcome"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Urgency</span>
                  <span className="font-bold text-slate-800">
                    {isImmediate ? "⚡ Immediate Hiring" : "Hiring Till Date"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Deadline</span>
                  <span className="font-bold text-slate-800">
                    {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Rolling"}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Total Applicants</span>
                  <span className="font-bold text-emerald-700">{applicationsCount}</span>
                </div>
              </div>
            </div>

            {/* Related Jobs */}
            {relatedJobs.length > 0 && (
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Other Career Openings</h3>
                <div className="space-y-3">
                  {relatedJobs.map((rj) => (
                    <Link
                      key={rj.id}
                      href={`/jobs/${rj.id}`}
                      className="block p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-200 transition-all group"
                    >
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                        {rj.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-emerald-700 truncate">{rj.company}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{rj.salary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
