"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Search,
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  PlusCircle,
  Bookmark,
  Sparkles,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Users,
  GraduationCap,
  Calendar,
  Layers,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useToggleSaveJob } from "@/hooks/public/useJobActions";
import PostJobModal from "@/components/public/PostJobModal";
import { COUNTRIES_DATA } from "@/lib/locations-data";

export interface JobListItem {
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
  description?: string;
  aboutCompany?: string | null;
  experienceRequired?: boolean;
  experienceLevel?: string | null;
  hiringType?: string;
  deadline?: string | null;
  positionsOpen?: number;
  postedByType?: string;
  postedByName?: string | null;
  postedByTitle?: string | null;
  postedDate: string;
  applicationsCount?: number;
  postedByAlumni?: { id?: string; name: string; classYear?: number; currentRole?: string; avatar?: string | null } | null;
  postedByAdmin?: { id?: string; name: string; title?: string; department?: string } | null;
}

const CATEGORIES = [
  "all",
  "ENGINEERING",
  "DATA_AI",
  "FINANCE_BANKING",
  "OPERATIONS",
  "PRODUCT_DESIGN",
  "LEGAL_PUBLIC_POLICY",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Categories",
  ENGINEERING: "Engineering",
  DATA_AI: "Data & AI",
  FINANCE_BANKING: "Finance & Banking",
  OPERATIONS: "Operations",
  PRODUCT_DESIGN: "Product & Design",
  LEGAL_PUBLIC_POLICY: "Legal & Public Policy",
};

const WORKPLACE_TYPES = ["all", "REMOTE", "HYBRID", "ON_SITE"] as const;
const WORKPLACE_LABELS: Record<string, string> = {
  all: "All Workplace Types",
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ON_SITE: "On-Site",
};

function JobCard({ job, initialSaved }: { job: JobListItem; initialSaved: boolean }) {
  const { saved, loading, toggle } = useToggleSaveJob(job.id, initialSaved);

  const isImmediate = job.hiringType === "IMMEDIATE";
  const positions = job.positionsOpen ?? 1;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-300 group hover:border-emerald-300 flex flex-col justify-between gap-5">
      <div className="space-y-3">
        {/* Top Badges Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Posted By Attribution (Admin vs Alumni) */}
          {job.postedByType === "ADMIN" || job.postedByAdmin ? (
            <span className="text-[11px] font-bold bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Posted by Admin: {job.postedByName || job.postedByAdmin?.name || "Institutional Office"}</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold bg-teal-50 text-teal-900 px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1.5 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>
                Posted by Alumni: {job.postedByName || job.postedByAlumni?.name || "Verified Alumni"}
                {job.postedByAlumni?.classYear ? ` ('${String(job.postedByAlumni.classYear).slice(-2)})` : ""}
              </span>
            </span>
          )}

          {/* Category */}
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
            {CATEGORY_LABELS[job.category] ?? job.category}
          </span>

          {/* Job Type & Workplace */}
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
            {job.type.replace(/_/g, " ")} {job.workplaceType ? `• ${job.workplaceType.replace(/_/g, " ")}` : ""}
          </span>

          {/* Positions Open */}
          <span className="text-[11px] font-bold bg-sky-50 text-sky-800 px-2.5 py-1 rounded-full border border-sky-200 flex items-center gap-1">
            <Users className="w-3 h-3 text-sky-600" />
            <span>{positions} {positions === 1 ? "Position Open" : "Positions Open"}</span>
          </span>

          {/* Hiring Timeline: Immediate or Till Date */}
          {isImmediate ? (
            <span className="text-[11px] font-extrabold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 text-rose-600" />
              <span>Immediate Hiring</span>
            </span>
          ) : job.deadline ? (
            <span className="text-[11px] font-medium bg-amber-50/70 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>Hiring till {new Date(job.deadline).toLocaleDateString()}</span>
            </span>
          ) : null}

          {/* Experience Required */}
          {job.experienceRequired ? (
            <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
              Exp: {job.experienceLevel || "Required"}
            </span>
          ) : (
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
              No Experience Required / Freshers Welcome
            </span>
          )}
        </div>

        {/* Title and Company */}
        <div>
          <Link href={`/jobs/${job.id}`} className="block">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {job.title}
            </h3>
          </Link>
          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            {job.company}
          </p>
        </div>

        {/* Description snippet */}
        {job.description && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {job.description}
          </p>
        )}

        {/* Location, Salary, Posted Date metadata bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium text-slate-700">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{job.location}</span>
          </span>

          <span className="flex items-center gap-1 font-bold text-emerald-700">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{job.salary}</span>
          </span>

          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Posted {new Date(job.postedDate).toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-400 font-medium">
          {job.applicationsCount ? `${job.applicationsCount} Candidates Applied` : "Be one of the first applicants"}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 disabled:opacity-60"
            title={saved ? "Remove from saved" : "Save Job"}
          >
            <Bookmark className={`w-4 h-4 ${saved ? "fill-emerald-600 text-emerald-600" : "text-slate-400"}`} />
          </button>

          <Link
            href={`/jobs/${job.id}`}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-extrabold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
          >
            <span>View Job Details &amp; Apply</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function JobsView({
  jobs,
  savedJobIds,
  myPostedJobsCount = 0,
}: {
  jobs: JobListItem[];
  savedJobIds: string[];
  myPostedJobsCount?: number;
}) {
  const { session, isPostJobOpen, setIsPostJobOpen } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [workplaceType, setWorkplaceType] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [expFilter, setExpFilter] = useState<string>("all");
  const [hiringFilter, setHiringFilter] = useState<string>("all");
  const [postedByFilter, setPostedByFilter] = useState<string>("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesKeyword =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.description && j.description.toLowerCase().includes(q));

      const matchesCategory = category === "all" || j.category === category;
      const matchesWorkplace = workplaceType === "all" || j.workplaceType === workplaceType;
      const matchesCountry = countryFilter === "all" || (j.country && j.country.toLowerCase() === countryFilter.toLowerCase()) || j.location.toLowerCase().includes(countryFilter.toLowerCase());
      const matchesExp =
        expFilter === "all" ||
        (expFilter === "none" && !j.experienceRequired) ||
        (expFilter === "required" && j.experienceRequired);
      const matchesHiring =
        hiringFilter === "all" ||
        (hiringFilter === "immediate" && j.hiringType === "IMMEDIATE") ||
        (hiringFilter === "till_date" && j.hiringType === "TILL_DATE");
      const matchesPostedBy =
        postedByFilter === "all" ||
        (postedByFilter === "admin" && (j.postedByType === "ADMIN" || !!j.postedByAdmin)) ||
        (postedByFilter === "alumni" && (j.postedByType === "ALUMNI" || !!j.postedByAlumni));
      const matchesSaved = !onlySaved || savedSet.has(j.id);

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesWorkplace &&
        matchesCountry &&
        matchesExp &&
        matchesHiring &&
        matchesPostedBy &&
        matchesSaved
      );
    });
  }, [jobs, query, category, workplaceType, countryFilter, expFilter, hiringFilter, postedByFilter, onlySaved, savedSet]);

  const employerCount = useMemo(() => new Set(jobs.map((j) => j.company)).size, [jobs]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Top Institutional Banner */}
      <section className="relative flex min-h-[520px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ipam_university_campus_1788350001937.jpg"
            alt="Institute of Public Administration and Management Campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <span>IPAM Career Network • Verified Admin &amp; Alumni Opportunities</span>
          </div>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                IPAM Careers &amp; Hire Management
              </h1>
              <p className="text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
                Verified institutional positions and alumni career opportunities. Post jobs with full location, salary,
                experience requirements, and hiring timelines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {session && (
                <Link
                  href="/jobs/manage"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/80 px-5 py-3.5 text-sm font-bold text-emerald-300 shadow-lg backdrop-blur-md transition-all hover:bg-emerald-900/80 hover:text-white"
                >
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                  <span>Manage My Posted Jobs</span>
                  {myPostedJobsCount > 0 && (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-black text-slate-950">
                      {myPostedJobsCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                onClick={() => (session ? setIsPostJobOpen(true) : (window.location.href = "/login"))}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-900/40 active:scale-98"
              >
                <PlusCircle className="h-5 w-5" />
                <span>Post a Job Opening</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{jobs.length}</div>
              <div className="text-xs font-medium text-slate-300">Total Active Listings</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{employerCount}</div>
              <div className="text-xs font-medium text-slate-300">Hiring Organizations</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">
                {jobs.reduce((acc, j) => acc + (j.positionsOpen || 1), 0)}
              </div>
              <div className="text-xs font-medium text-slate-300">Open Positions</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</div>
              <div className="text-xs font-medium text-slate-300">Verified Portals</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="relative z-20 mx-auto -mt-8 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Search & Comprehensive Filters */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by job title, employer, country, city, or keywords…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base text-slate-900 focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Cascading / Multi-dimension Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Workplace</label>
              <select
                value={workplaceType}
                onChange={(e) => setWorkplaceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                {WORKPLACE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {WORKPLACE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                <option value="all">All Countries</option>
                {COUNTRIES_DATA.map((c) => (
                  <option key={c.country} value={c.country}>
                    {c.country}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Experience</label>
              <select
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                <option value="all">Any Experience</option>
                <option value="none">No Experience Required</option>
                <option value="required">Experience Required</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Hiring Urgency</label>
              <select
                value={hiringFilter}
                onChange={(e) => setHiringFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                <option value="all">All Timelines</option>
                <option value="immediate">⚡ Immediate Hiring</option>
                <option value="till_date">Hiring Till Date</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">Posted By</label>
              <select
                value={postedByFilter}
                onChange={(e) => setPostedByFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
              >
                <option value="all">All Posters</option>
                <option value="admin">Admin Posted</option>
                <option value="alumni">Alumni Posted</option>
              </select>
            </div>
          </div>

          {session && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <button
                onClick={() => setOnlySaved(!onlySaved)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-2 border transition-all ${
                  onlySaved
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${onlySaved ? "fill-emerald-600 text-emerald-600" : "text-slate-500"}`} />
                <span>Show Saved Jobs ({savedJobIds.length})</span>
              </button>

              <div className="text-xs text-slate-500">
                Showing <span className="font-bold text-slate-900">{filtered.length}</span> of {jobs.length} listings
              </div>
            </div>
          )}
        </div>

        {/* Listings Cards */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-lg font-bold text-slate-900">No job opportunities matched your criteria</p>
              <p className="text-sm text-slate-500 mt-1">Try relaxing filters or search terms.</p>
            </div>
          ) : (
            filtered.map((j) => <JobCard key={j.id} job={j} initialSaved={savedSet.has(j.id)} />)
          )}
        </div>
      </div>

      {isPostJobOpen && <PostJobModal onClose={() => setIsPostJobOpen(false)} />}
    </div>
  );
}
