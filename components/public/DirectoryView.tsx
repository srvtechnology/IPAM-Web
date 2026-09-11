"use client";

import { useMemo, useState } from "react";
import { Search, Mail, Linkedin, X } from "lucide-react";

export interface DirectoryAlumnus {
  id: string;
  name: string;
  avatar: string | null;
  classYear: number;
  degree: string;
  major: string;
  currentRole: string;
  company: string;
  location: string;
  country: string;
  industry: string;
  isMentor: boolean;
  bio: string;
  email: string;
  linkedin: string | null;
  skills: string[];
}

export default function DirectoryView({ alumni }: { alumni: DirectoryAlumnus[] }) {
  const [query, setQuery] = useState("");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [selected, setSelected] = useState<DirectoryAlumnus | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alumni.filter((a) => {
      if (mentorOnly && !a.isMentor) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.currentRole.toLowerCase().includes(q) ||
        a.industry.toLowerCase().includes(q) ||
        a.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [alumni, query, mentorOnly]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900">Alumni Directory</h1>
      <p className="mt-1 text-slate-500">Search {alumni.length} verified alumni across the global network.</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company, industry, skill…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <input type="checkbox" checked={mentorOnly} onChange={(e) => setMentorOnly(e.target.checked)} />
          Mentors only
        </label>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a)}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt={a.name}
                  className="h-12 w-12 flex-shrink-0 rounded-full border-2 border-emerald-200 object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                  {a.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900">{a.name}</h3>
                <p className="text-xs text-slate-500">Class of {a.classYear}</p>
              </div>
              {a.isMentor && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Mentor
                </span>
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-slate-700">{a.currentRole}</p>
            <p className="text-sm text-slate-500">{a.company} · {a.location}</p>
          </button>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-500">No alumni match your search.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {selected.avatar ? (
                  <img
                    src={selected.avatar}
                    alt={selected.name}
                    className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-emerald-200 object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                    {selected.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.currentRole} at {selected.company}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600">{selected.bio}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400">Class Year</dt><dd className="font-medium text-slate-800">{selected.classYear}</dd></div>
              <div><dt className="text-slate-400">Degree</dt><dd className="font-medium text-slate-800">{selected.degree}</dd></div>
              <div><dt className="text-slate-400">Location</dt><dd className="font-medium text-slate-800">{selected.location}, {selected.country}</dd></div>
              <div><dt className="text-slate-400">Industry</dt><dd className="font-medium text-slate-800">{selected.industry}</dd></div>
            </dl>
            {selected.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {selected.skills.map((s) => (
                  <span key={s} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{s}</span>
                ))}
              </div>
            )}
            <div className="mt-5 flex gap-3">
              <a href={`mailto:${selected.email}`} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                <Mail className="h-4 w-4" /> Email
              </a>
              {selected.linkedin && (
                <a href={selected.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
