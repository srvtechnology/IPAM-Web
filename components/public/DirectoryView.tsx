"use client";

import { useMemo, useState } from "react";
import { Search, Mail, Linkedin, X, MapPin, GraduationCap, Sparkles, UserPlus, Check, MessageSquare } from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useConnect } from "@/hooks/public/useConnect";

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

const DECADES = [
  { value: "all", label: "All Class Years" },
  { value: "2020s", label: "Class of 2020 - 2025" },
  { value: "2010s", label: "Class of 2010 - 2019" },
  { value: "2000s", label: "Class of 2000 - 2009" },
  { value: "1990s", label: "Class of 1990 - 1999" },
];

function matchesDecade(classYear: number, decade: string) {
  if (decade === "2020s") return classYear >= 2020;
  if (decade === "2010s") return classYear >= 2010 && classYear < 2020;
  if (decade === "2000s") return classYear >= 2000 && classYear < 2010;
  if (decade === "1990s") return classYear >= 1990 && classYear < 2000;
  return true;
}

export default function DirectoryView({ alumni }: { alumni: DirectoryAlumnus[] }) {
  const { session } = useApp();
  const { connect } = useConnect();
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("all");
  const [country, setCountry] = useState("all");
  const [decade, setDecade] = useState("all");
  const [mentorOnly, setMentorOnly] = useState(false);
  const [selected, setSelected] = useState<DirectoryAlumnus | null>(null);
  const [connectedIds, setConnectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const industries = useMemo(() => ["all", ...Array.from(new Set(alumni.map((a) => a.industry)))], [alumni]);
  const countries = useMemo(() => ["all", ...Array.from(new Set(alumni.map((a) => a.country)))], [alumni]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alumni.filter((a) => {
      if (mentorOnly && !a.isMentor) return false;
      if (industry !== "all" && a.industry !== industry) return false;
      if (country !== "all" && a.country !== country) return false;
      if (!matchesDecade(a.classYear, decade)) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.company.toLowerCase().includes(q) ||
        a.currentRole.toLowerCase().includes(q) ||
        a.industry.toLowerCase().includes(q) ||
        a.major.toLowerCase().includes(q) ||
        a.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [alumni, query, mentorOnly, industry, country, decade]);

  const hasActiveFilters = industry !== "all" || country !== "all" || decade !== "all" || mentorOnly || !!query;

  function resetFilters() {
    setQuery("");
    setIndustry("all");
    setCountry("all");
    setDecade("all");
    setMentorOnly(false);
  }

  async function handleConnect(e: React.MouseEvent, a: DirectoryAlumnus) {
    e.stopPropagation();
    if (!session) {
      setToast("Sign in to connect with alumni.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (connectedIds.includes(a.id)) return;
    const success = await connect(a.id);
    if (success) {
      setConnectedIds((prev) => [...prev, a.id]);
      setToast(`Connection request sent to ${a.name}!`);
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-slate-900 px-5 py-3 text-white shadow-xl">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold">✓</div>
          <span className="text-sm font-semibold">{toast}</span>
        </div>
      )}

      <h1 className="text-3xl font-black text-slate-900 sm:text-4xl">Global Alumni Directory</h1>
      <p className="mt-2 max-w-3xl text-slate-500">
        Search and connect with {alumni.length} verified IPAM graduates worldwide. Find industry peers, mentors, and
        fellow alumni by major, location, or class year.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, job title, company, degree, or skills…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-9 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Industry</label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind === "all" ? "All Industries" : ind}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {countries.map((c) => (
                <option key={c} value={c}>{c === "all" ? "All Countries" : c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Graduation Era</label>
            <select
              value={decade}
              onChange={(e) => setDecade(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
            >
              {DECADES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 hover:bg-slate-100">
              <input type="checkbox" checked={mentorOnly} onChange={(e) => setMentorOnly(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
              <span className="text-xs font-bold text-slate-900">Verified Mentors Only</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
          <span>Showing <strong>{filtered.length}</strong> alumni members</span>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="cursor-pointer font-bold text-emerald-700 hover:underline">
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <p className="mb-1 text-lg font-bold text-slate-950">No alumni found matching your criteria</p>
          <p className="mb-4 text-sm text-slate-500">Try clearing your filters or searching for another keyword.</p>
          <button onClick={resetFilters} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const isConnected = connectedIds.includes(a.id);
            return (
              <div
                key={a.id}
                onClick={() => setSelected(a)}
                className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-500/40 hover:shadow-lg"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    {a.avatar ? (
                      <img src={a.avatar} alt={a.name} className="h-16 w-16 shrink-0 rounded-full border-2 border-emerald-600 object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-lg font-bold text-emerald-700">
                        {a.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
                        Class of &apos;{a.classYear.toString().slice(-2)}
                      </span>
                      {a.isMentor && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <Sparkles className="h-2.5 w-2.5" /> Mentor
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-emerald-700">{a.name}</h3>
                  <p className="mb-0.5 text-xs font-semibold text-emerald-700">{a.currentRole}</p>
                  <p className="mb-3 text-xs text-slate-500">{a.company}</p>

                  <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{a.degree} · {a.major}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{a.location}, {a.country}</span>
                    </div>
                  </div>

                  {a.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {a.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                          {skill}
                        </span>
                      ))}
                      {a.skills.length > 3 && (
                        <span className="self-center text-[10px] font-semibold text-slate-500">+{a.skills.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 border-t border-slate-200 pt-4">
                  <button
                    onClick={(e) => handleConnect(e, a)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                      isConnected
                        ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                        : "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                    }`}
                  >
                    {isConnected ? (<><Check className="h-3.5 w-3.5" /><span>Pending</span></>) : (<><UserPlus className="h-3.5 w-3.5" /><span>Connect</span></>)}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelected(a); }}
                    title="View Full Profile"
                    className="rounded-lg bg-slate-100 p-2 text-slate-900 transition-colors hover:bg-slate-200"
                  >
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {selected.avatar ? (
                  <img src={selected.avatar} alt={selected.name} className="h-14 w-14 flex-shrink-0 rounded-full border-2 border-emerald-200 object-cover" />
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
              <button
                onClick={(e) => handleConnect(e, selected)}
                className={`ml-auto flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  connectedIds.includes(selected.id)
                    ? "border border-emerald-300 bg-emerald-100 text-emerald-800"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {connectedIds.includes(selected.id) ? (<><Check className="h-4 w-4" /> Pending</>) : (<><UserPlus className="h-4 w-4" /> Connect</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
