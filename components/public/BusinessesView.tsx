"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Building2, Search, Star, MapPin, Users, X } from "lucide-react";
import { useApp } from "@/lib/public/context";
import SubmitBusinessModal from "@/components/public/SubmitBusinessModal";

export interface BusinessListItem {
  id: string;
  name: string;
  founders: string;
  classYear: string;
  category: string;
  industry: string;
  tagline: string | null;
  description: string;
  location: string;
  featured: boolean;
  image: string | null;
  services: string[];
}

export default function BusinessesView({ businesses }: { businesses: BusinessListItem[] }) {
  const { session, isSubmitBusinessOpen, setIsSubmitBusinessOpen } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const categories = useMemo(() => ["All", ...Array.from(new Set(businesses.map((b) => b.category || "Other")))], [businesses]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: businesses.length };
    businesses.forEach((b) => {
      const cat = b.category || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (category !== "All" && (b.category || "Other") !== category) return false;
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.founders.toLowerCase().includes(q) ||
        b.industry.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
      );
    });
  }, [businesses, query, category]);

  const hasActiveFilters = category !== "All" || !!query;
  function resetFilters() { setQuery(""); setCategory("All"); }

  const industryCount = Math.max(categories.length - 1, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Top institutional banner */}
      <section className="relative flex min-h-[580px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[640px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ipam_university_campus_1788350001937.jpg"
            alt="Institute of Public Administration and Management Campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <Building2 className="h-4 w-4 text-emerald-400" />
            <span>Alumni Commerce &amp; Founders Network • IPAM Enterprises</span>
          </div>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-3">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
                Support Alumni-Led Enterprises
              </h1>
              <p className="text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
                Discover, patronize, and partner with innovative commercial ventures and startups founded by IPAM
                alumni. Connect directly with founders across every industry represented in the directory.
              </p>
            </div>

            <button
              onClick={() => (session ? setIsSubmitBusinessOpen(true) : (window.location.href = "/login"))}
              className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-900/40 active:scale-98"
            >
              <Plus className="h-5 w-5" />
              <span>Submit Your Business</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{businesses.length}+</div>
              <div className="text-xs font-medium text-slate-300">Registered Enterprises</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{industryCount || 12}+</div>
              <div className="text-xs font-medium text-slate-300">Industry Sectors</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">$45M+</div>
              <div className="text-xs font-medium text-slate-300">Combined Economic Impact</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</div>
              <div className="text-xs font-medium text-slate-300">Alumni Founded &amp; Owned</div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative z-20 mx-auto -mt-8 max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="shrink-0 cursor-pointer appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3.5 text-xs font-bold text-slate-700 focus:bg-white focus:outline-emerald-600 sm:w-72 sm:text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-white text-slate-900">
                  {c === "All" ? `All Categories (${categoryCounts.All || 0})` : `${c} (${categoryCounts[c] || 0})`}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by business name, founder, service, keyword, or city…"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-emerald-600 md:text-base"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 px-1 pt-2 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900">{filtered.length}</strong> of{" "}
              <strong className="text-slate-900">{businesses.length}</strong> alumni enterprises
              {category !== "All" && (
                <>
                  {" "}
                  in{" "}
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800">
                    {category}
                  </span>
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button onClick={resetFilters} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline">
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b) => (
              <Link
                key={b.id}
                href={`/businesses/${b.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {b.image ? (
                      <img src={b.image} alt={b.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                        <Building2 className="h-8 w-8 text-emerald-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {b.featured && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                          <Star className="h-3 w-3 fill-white" /> Featured
                        </span>
                      )}
                      <span className="flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-slate-800 backdrop-blur-md">
                        {b.category || "Venture"}
                      </span>
                    </div>

                    <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[11px] font-bold text-emerald-800 shadow-xs backdrop-blur-md">
                      {b.classYear}
                    </span>

                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-white drop-shadow-xs">{b.industry}</span>
                    </div>
                  </div>

                  <div className="space-y-3 p-6">
                    <h3 className="text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-emerald-700">
                      {b.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-slate-500">Founders:</span>
                      <span className="font-bold text-slate-800">{b.founders}</span>
                    </div>

                    <p className="line-clamp-3 text-xs leading-[1.6] text-slate-600 sm:text-sm">{b.description}</p>

                    {b.services.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.services.slice(0, 2).map((s) => (
                          <span key={s} className="max-w-full truncate rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {s}
                          </span>
                        ))}
                        {b.services.length > 2 && (
                          <span className="py-0.5 text-[11px] font-semibold text-slate-500">+{b.services.length - 2} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{b.location}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <span className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-center text-xs font-bold text-slate-800 transition-all group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                    View Business Profile
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              No Businesses Found in {category === "All" ? "Directory" : `"${category}"`}
            </h3>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              {query
                ? `No alumni enterprises matched your search query "${query}". Try resetting filters or search by founder name.`
                : "We haven't listed any businesses in this category yet. Be the first to register your enterprise!"}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={resetFilters}
                className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
              >
                Reset All Filters
              </button>
              <button
                onClick={() => (session ? setIsSubmitBusinessOpen(true) : (window.location.href = "/login"))}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                <span>Submit Business</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isSubmitBusinessOpen && <SubmitBusinessModal onClose={() => setIsSubmitBusinessOpen(false)} />}
    </div>
  );
}
