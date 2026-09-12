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
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useToggleSaveJob } from "@/hooks/public/useJobActions";
import PostJobModal from "@/components/public/PostJobModal";

export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  workplaceType: string | null;
  salary: string;
  category: string;
  postedDate: string;
  postedByAlumni: { name: string; classYear: number } | null;
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

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-emerald-500/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
            {CATEGORY_LABELS[job.category] ?? job.category}
          </span>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
            {job.type.replace(/_/g, " ")}
          </span>
          {job.postedByAlumni && (
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Alumni Referrer: {job.postedByAlumni.name} (&apos;
              {String(job.postedByAlumni.classYear).slice(-2)})
            </span>
          )}
        </div>

        <Link href={`/jobs/${job.id}`} className="block">
          <h3 className="text-xl font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">{job.title}</h3>
        </Link>

        <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-emerald-600" />
          {job.company}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            {job.location}
          </span>
          <span className="flex items-center gap-1 font-semibold text-emerald-700">
            <DollarSign className="w-3.5 h-3.5" />
            {job.salary}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Posted {new Date(job.postedDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200">
        <button
          onClick={toggle}
          disabled={loading}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 transition-colors border border-slate-200 disabled:opacity-60"
          title={saved ? "Remove from saved" : "Save Job"}
        >
          <Bookmark className={`w-5 h-5 ${saved ? "fill-emerald-600 text-emerald-600" : "text-slate-400"}`} />
        </button>

        <Link
          href={`/jobs/${job.id}`}
          className="flex-1 md:flex-initial bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow-md"
        >
          <span>View &amp; Apply</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function JobsView({ jobs, savedJobIds }: { jobs: JobListItem[]; savedJobIds: string[] }) {
  const { session, isPostJobOpen, setIsPostJobOpen } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [workplaceType, setWorkplaceType] = useState<string>("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const savedSet = useMemo(() => new Set(savedJobIds), [savedJobIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesKeyword =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q);
      const matchesCategory = category === "all" || j.category === category;
      const matchesWorkplace = workplaceType === "all" || j.workplaceType === workplaceType;
      const matchesSaved = !onlySaved || savedSet.has(j.id);
      return matchesKeyword && matchesCategory && matchesWorkplace && matchesSaved;
    });
  }, [jobs, query, category, workplaceType, onlySaved, savedSet]);

  return (
    <div className="px-4 md:px-8 max-w-7xl mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Alumni Career Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">IPAM Job Matching Portal</h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
            Exclusive career opportunities posted directly by alumni hiring managers and corporate partners. Fast-track your application
            with built-in alumni referral tags.
          </p>
        </div>

        <button
          onClick={() => (session ? setIsPostJobOpen(true) : (window.location.href = "/login"))}
          className="bg-emerald-600 text-white px-5 py-3 rounded-xl hover:bg-emerald-700 transition-all font-bold text-sm shadow-sm flex items-center gap-2 whitespace-nowrap"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post a Job Opening</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm mb-8 space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search jobs by title, company, or location…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base text-slate-900 focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Workplace Type</label>
            <select
              value={workplaceType}
              onChange={(e) => setWorkplaceType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-emerald-500"
            >
              {WORKPLACE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {WORKPLACE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          {session && (
            <div className="flex items-end">
              <button
                onClick={() => setOnlySaved(!onlySaved)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  onlySaved ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-slate-50 border-slate-200 text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${onlySaved ? "fill-emerald-600 text-emerald-600" : "text-slate-500"}`} />
                <span>Saved Jobs ({savedJobIds.length})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Briefcase className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-bold text-slate-950">No job opportunities found</p>
            <p className="text-sm text-slate-500 mt-1">Try relaxing your search terms or view all categories.</p>
          </div>
        ) : (
          filtered.map((j) => <JobCard key={j.id} job={j} initialSaved={savedSet.has(j.id)} />)
        )}
      </div>

      {isPostJobOpen && <PostJobModal onClose={() => setIsPostJobOpen(false)} />}
    </div>
  );
}
