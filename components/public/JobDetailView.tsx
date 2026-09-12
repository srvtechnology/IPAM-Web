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
} from "lucide-react";
import { useToggleSaveJob } from "@/hooks/public/useJobActions";
import { useApplyToJob, type JobApplicationRecord } from "@/hooks/public/useApplyToJob";
import { useApp } from "@/lib/public/context";

export interface JobDetail {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workplaceType: string | null;
  salary: string;
  category: string;
  description: string;
  responsibilities: string[] | null;
  requirements: string[];
  benefits: string[] | null;
  aboutCompany: string | null;
  postedByAlumni: { name: string; classYear: number; currentRole: string; avatar: string | null } | null;
  postedDate?: string;
  deadline: string;
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
}: {
  job: JobDetail;
  relatedJobs: RelatedJob[];
  application: JobApplicationRecord | null;
}) {
  const { session } = useApp();
  const { saved, loading: saving, toggle } = useToggleSaveJob(job.id, job.saved);
  const { application: currentApplication, loading: applying, error, apply } = useApplyToJob(job.id, application);
  const [linkedinUrl, setLinkedinUrl] = useState(
    session?.profile ? `linkedin.com/in/${session.profile.name.toLowerCase().replace(/\s+/g, "")}` : ""
  );
  const [coverNote, setCoverNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    apply({ linkedinUrl, coverNote });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // clipboard unavailable — silently ignore, share button just won't confirm
    }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 overflow-hidden">
            <Link href="/" className="hover:text-emerald-700 font-medium transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <Link href="/jobs" className="hover:text-emerald-700 font-medium transition-colors shrink-0">
              Job Portal
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
                  saved ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
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
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Alumni Verified Post
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-slate-950 tracking-tight leading-tight">
                {job.title}
              </h1>

              <div className="flex items-center gap-2 text-lg font-bold text-emerald-800">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>{job.company}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                  <DollarSign className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{job.salary}</span>
                </div>
                {job.postedDate && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Calendar className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Application Deadline: <strong className="text-slate-900 font-bold">{new Date(job.deadline).toLocaleDateString()}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full lg:w-auto shrink-0">
              <a
                href="#application-section"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold text-sm text-center shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Apply with Alumni Fast-Track</span>
              </a>
              {session && (
                <button
                  onClick={toggle}
                  disabled={saving}
                  className={`px-5 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-60 ${
                    saved ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? "fill-emerald-600 text-emerald-600" : "text-slate-400"}`} />
                  <span>{saved ? "Job Saved" : "Save for Later"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {job.postedByAlumni && (
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-3xl p-6 sm:p-7 border border-emerald-200/80 shadow-sm space-y-4">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex items-center gap-4">
                    {job.postedByAlumni.avatar ? (
                      <img
                        src={job.postedByAlumni.avatar}
                        alt={job.postedByAlumni.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center font-bold text-emerald-700 text-lg">
                        {job.postedByAlumni.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider mb-1 border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        Hiring Sponsor &amp; Alumni Referrer
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-950">{job.postedByAlumni.name}</h3>
                      <p className="text-xs sm:text-sm font-medium text-emerald-900">
                        {job.postedByAlumni.currentRole} • <span className="font-bold">IPAM Class of &apos;{String(job.postedByAlumni.classYear).slice(-2)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="bg-emerald-600 text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
                    Priority Route
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-emerald-200/60 pt-3">
                  Applying via this portal routes your application directly to{" "}
                  <strong className="text-slate-900 font-bold">{job.postedByAlumni.name}</strong> with your official IPAM Alumni digital
                  badge, bypassing standard recruiter filtering algorithms.
                </p>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl pb-3 border-b border-slate-100">
                <FileText className="w-5 h-5 text-emerald-600" />
                <h2>Role Overview &amp; Mission</h2>
              </div>
              <p className="text-sm sm:text-base text-slate-700 leading-[1.7] whitespace-pre-line">{job.description}</p>
            </div>

            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl pb-3 border-b border-slate-100">
                  <Layers className="w-5 h-5 text-emerald-600" />
                  <h2>Key Responsibilities</h2>
                </div>
                <ul className="space-y-3 text-sm sm:text-base text-slate-700">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border border-emerald-200">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2>Requirements &amp; Qualifications</h2>
              </div>
              <ul className="space-y-3 text-sm sm:text-base text-slate-700">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-2" />
                    <span className="leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Target Competencies</p>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, idx) => (
                    <span key={idx} className="text-xs font-semibold bg-slate-50 text-slate-800 px-3 py-1.5 rounded-xl border border-slate-200">
                      {req.split(" ").slice(0, 4).join(" ")}...
                    </span>
                  ))}
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200">
                    IPAM Graduate Preferred
                  </span>
                </div>
              </div>
            </div>

            {job.benefits && job.benefits.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl pb-3 border-b border-slate-100">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h2>Compensation &amp; Total Rewards</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {job.benefits.map((benefit, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs sm:text-sm text-slate-800">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {job.aboutCompany && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg sm:text-xl pb-3 border-b border-slate-100">
                  <Globe className="w-5 h-5 text-emerald-600" />
                  <h2>About {job.company}</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{job.aboutCompany}</p>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-32">
            <div id="application-section" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-lg space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Verified Alumni Application
                </div>
                <h3 className="text-xl font-bold text-slate-950">Apply for this Role</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {job.postedByAlumni ? `Direct submission to ${job.postedByAlumni.name} at ${job.company}` : `Submission to ${job.company}`}
                </p>
              </div>

              {!session ? (
                <div className="p-6 rounded-2xl bg-slate-50 text-center space-y-3 border border-slate-200">
                  <p className="text-sm text-slate-700">Sign in with your verified alumni account to apply.</p>
                  <Link
                    href="/login"
                    className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Sign In to Apply
                  </Link>
                </div>
              ) : currentApplication ? (
                <div className="p-6 rounded-2xl bg-emerald-50 text-emerald-950 text-center space-y-3 border border-emerald-200">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-200">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-emerald-950">Application Received!</h4>
                    <p className="text-xs text-emerald-800 mt-1">
                      Your verified IPAM Alumni profile has been fast-tracked{job.postedByAlumni ? ` to ${job.postedByAlumni.name}` : ""}.
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-emerald-200 text-left text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Tracking Ref:</span>
                      <code className="font-mono font-bold text-emerald-800">{currentApplication.applicationRef}</code>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Status:</span>
                      <span className="font-bold text-emerald-700">Endorsed by Alumni Network</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700">You will receive confirmation and interview updates at {session.email}.</p>
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Applicant Credentials</span>
                    <div className="flex items-center gap-3">
                      {session.profile?.avatar ? (
                        <img
                          src={session.profile.avatar}
                          alt={session.profile.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center font-bold text-emerald-700 text-sm">
                          {session.profile?.name.charAt(0) ?? "A"}
                        </div>
                      )}
                      <div className="text-xs">
                        <p className="font-bold text-slate-900">{session.profile?.name}</p>
                        <p className="text-slate-600">
                          {session.profile?.degree} • Class of &apos;{String(session.profile?.classYear ?? "").slice(-2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold pt-1 border-t border-slate-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified ID: {session.studentId}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">LinkedIn / Portfolio URL</label>
                    <input
                      type="text"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="linkedin.com/in/yourprofile"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Personal Note{job.postedByAlumni ? ` to ${job.postedByAlumni.name}` : ""}
                    </label>
                    <textarea
                      rows={3}
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder={`Hi, I am an IPAM alumnus excited about this ${job.title} role. My experience in...`}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-emerald-500 resize-none"
                    />
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input type="checkbox" id="alumni-endorse-check" defaultChecked className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500" />
                    <label htmlFor="alumni-endorse-check" className="text-[11px] text-slate-600 leading-tight">
                      Attach official IPAM degree transcripts &amp; verified graduation credentials.
                    </label>
                  </div>

                  {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={applying}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{applying ? "Transmitting Credentials..." : "Submit 1-Click Alumni Application"}</span>
                  </button>

                  <p className="text-center text-[11px] text-slate-500">Protected by IPAM Global Career Network Security.</p>
                </form>
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3.5 text-xs">
              <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-2">Position Summary</h4>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Department</span>
                <span className="font-bold text-slate-900">{job.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100">
                <span className="text-slate-500">Work Arrangement</span>
                <span className="font-bold text-slate-900">{(job.workplaceType ?? job.type).replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100">
                <span className="text-slate-500">Compensation</span>
                <span className="font-bold text-emerald-800">{job.salary}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100">
                <span className="text-slate-500">Location</span>
                <span className="font-bold text-slate-900 text-right">{job.location}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-t border-slate-100">
                <span className="text-slate-500">Application Closes</span>
                <span className="font-bold text-rose-700">{new Date(job.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {relatedJobs.length > 0 && (
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Explore More Openings</span>
                <h3 className="text-2xl font-black text-slate-950 mt-1">Similar Alumni Career Opportunities</h3>
              </div>
              <Link href="/jobs" className="text-xs sm:text-sm font-bold text-emerald-700 hover:underline flex items-center gap-1">
                <span>View All Jobs</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedJobs.map((otherJob) => (
                <Link
                  key={otherJob.id}
                  href={`/jobs/${otherJob.id}`}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {otherJob.category.replace(/_/g, " ")}
                      </span>
                      <span className="text-[11px] text-slate-500">{otherJob.type.replace(/_/g, " ")}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-950 group-hover:text-emerald-700 transition-colors line-clamp-1">{otherJob.title}</h4>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">{otherJob.company}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-2">{otherJob.description}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{otherJob.salary}</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                      View Role &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
