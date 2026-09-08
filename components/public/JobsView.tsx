"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, MapPin, Briefcase, Plus } from "lucide-react";
import { useApp } from "@/lib/public/context";
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
}

export default function JobsView({ jobs }: { jobs: JobListItem[] }) {
  const { session, isPostJobOpen, setIsPostJobOpen } = useApp();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Job Board</h1>
          <p className="mt-1 text-slate-500">Opportunities posted by alumni for alumni.</p>
        </div>
        <button
          onClick={() => (session ? setIsPostJobOpen(true) : (window.location.href = "/login"))}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> Post a Job
        </button>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, company, location…"
          className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div className="mt-8 grid gap-4">
        {filtered.map((j) => (
          <Link
            key={j.id}
            href={`/jobs/${j.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
          >
            <div>
              <h3 className="font-bold text-slate-900">{j.title}</h3>
              <p className="text-sm text-slate-500">{j.company}</p>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{j.location}</span>
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{j.type.replace("_", " ")}</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-emerald-700">{j.salary}</div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No jobs match your search.</p>}
      </div>

      {isPostJobOpen && <PostJobModal onClose={() => setIsPostJobOpen(false)} />}
    </div>
  );
}
