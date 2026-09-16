"use client";

import Link from "next/link";
import { Building2, BarChart3, Landmark, MapPin, ChevronRight, Megaphone, ArrowUpRight, Sparkles } from "lucide-react";
import { useApp } from "@/lib/public/context";
import SubmitBusinessModal from "@/components/public/SubmitBusinessModal";

export interface HomeJobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
}

const JOB_ICONS = [
  <Building2 key="0" className="h-6 w-6 text-emerald-700" />,
  <BarChart3 key="1" className="h-6 w-6 text-teal-700" />,
  <Landmark key="2" className="h-6 w-6 text-emerald-700" />,
];

export default function HomeJobsSection({ jobs }: { jobs: HomeJobItem[] }) {
  const { isSubmitBusinessOpen, setIsSubmitBusinessOpen } = useApp();
  const featuredJobs = jobs.slice(0, 3);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Career Opportunities</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Latest Alumni Career Openings
          </h2>
          <p className="text-sm text-slate-600">
            Exclusive opportunities curated for the IPAM global network.
          </p>
        </div>
        <Link
          href="/jobs"
          className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          <span>View All Jobs</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {featuredJobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredJobs.map((job, index) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-6 shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200/80 bg-white shadow-2xs transition-transform group-hover:scale-105">
                  {JOB_ICONS[index % JOB_ICONS.length]}
                </div>
                <h3 className="mb-1 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 md:text-xl">
                  {job.title}
                </h3>
                <p className="mb-4 text-sm font-semibold text-slate-600">{job.company}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 border-t border-slate-200/80 pt-3 text-xs text-slate-500 sm:text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="truncate">{job.location}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                    {job.type.replace(/_/g, " ")}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-700 transition-transform group-hover:translate-x-0.5">
                    Apply Now <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No job openings yet.</p>
      )}

      {/* Hiring CTA Banner */}
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center sm:p-6 md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="hidden rounded-xl border border-slate-200/80 bg-white p-3 text-emerald-700 shadow-2xs md:block">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Hiring Alumni Talent?</h4>
            <p className="text-xs text-slate-500 sm:text-sm">
              Reach thousands of vetted IPAM finance, administration, and tech graduates.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSubmitBusinessOpen(true)}
          className="whitespace-nowrap rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition-all hover:bg-emerald-700 sm:text-sm"
        >
          Post a Vacancy
        </button>
      </div>

      {isSubmitBusinessOpen && <SubmitBusinessModal onClose={() => setIsSubmitBusinessOpen(false)} />}
    </section>
  );
}
