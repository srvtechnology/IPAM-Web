"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Briefcase, DollarSign, Bookmark, BookmarkCheck } from "lucide-react";
import { useToggleSaveJob } from "@/hooks/public/useJobActions";
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
  deadline: string;
  applyUrl: string | null;
  saved: boolean;
}

export default function JobDetailView({ job }: { job: JobDetail }) {
  const { session } = useApp();
  const { saved, loading, toggle } = useToggleSaveJob(job.id, job.saved);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/jobs" className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{job.title}</h1>
            <p className="mt-1 text-slate-500">{job.company}</p>
          </div>
          {session && (
            <button
              onClick={toggle}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {saved ? <BookmarkCheck className="h-4 w-4 text-emerald-600" /> : <Bookmark className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
          <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" />{job.type.replace("_", " ")}{job.workplaceType ? ` · ${job.workplaceType.replace("_", " ")}` : ""}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" />{job.salary}</span>
        </div>

        <section className="mt-6">
          <h2 className="font-bold text-slate-900">About the role</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{job.description}</p>
        </section>

        {job.responsibilities && job.responsibilities.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Responsibilities</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </section>
        )}

        <section className="mt-6">
          <h2 className="font-bold text-slate-900">Requirements</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
            {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </section>

        {job.benefits && job.benefits.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Benefits</h2>
            <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
              {job.benefits.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </section>
        )}

        {job.postedByAlumni && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/60 p-4">
            {job.postedByAlumni.avatar ? (
              <img
                src={job.postedByAlumni.avatar}
                alt={job.postedByAlumni.name}
                className="h-12 w-12 flex-shrink-0 rounded-xl border-2 border-emerald-600 object-cover shadow-sm"
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-700">
                {job.postedByAlumni.name.charAt(0)}
              </div>
            )}
            <p className="text-xs text-slate-500">
              Posted by <span className="font-semibold text-slate-800">{job.postedByAlumni.name}</span> (Class of{" "}
              {job.postedByAlumni.classYear}) · {job.postedByAlumni.currentRole}
              <br />
              Deadline {new Date(job.deadline).toLocaleDateString()}
            </p>
          </div>
        )}

        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Apply Now
          </a>
        )}
      </div>
    </div>
  );
}
