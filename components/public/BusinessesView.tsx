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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Alumni Business Directory</h1>
          <p className="mt-1 max-w-2xl text-slate-500">
            Discover, patronize, and partner with innovative enterprises founded by IPAM graduates.
          </p>
        </div>
        <button
          onClick={() => (session ? setIsSubmitBusinessOpen(true) : (window.location.href = "/login"))}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> List Your Business
        </button>
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none sm:w-64"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by business name, founder, service, or city…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-9 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-1 pt-2 text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900">{filtered.length}</strong> of <strong className="text-slate-900">{businesses.length}</strong> alumni enterprises</span>
          {hasActiveFilters && (
            <button onClick={resetFilters} className="font-bold text-emerald-700 hover:underline">Reset Filters</button>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <Link
            key={b.id}
            href={`/businesses/${b.id}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="relative h-44 overflow-hidden bg-slate-900">
              {b.image ? (
                <img src={b.image} alt={b.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                  <Building2 className="h-8 w-8 text-emerald-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                {b.featured && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                    <Star className="h-3 w-3 fill-white" /> Featured
                  </span>
                )}
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                  {b.category || "Venture"}
                </span>
              </div>
              <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-extrabold text-slate-900 backdrop-blur-md">
                {b.classYear}
              </span>
              <div className="absolute bottom-3 left-3 right-3">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-300">{b.industry}</span>
                {b.tagline && <span className="mt-0.5 block truncate text-sm font-semibold text-white">{b.tagline}</span>}
              </div>
            </div>
            <div className="space-y-2 p-6">
              <h3 className="text-lg font-black text-slate-900">{b.name}</h3>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-slate-500">Founders:</span>
                <span className="font-bold text-slate-900">{b.founders}</span>
              </div>
              {b.services.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {b.services.slice(0, 2).map((s) => (
                    <span key={s} className="truncate rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{s}</span>
                  ))}
                  {b.services.length > 2 && <span className="py-0.5 text-[11px] font-semibold text-slate-400">+{b.services.length - 2} more</span>}
                </div>
              )}
              <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                <span className="truncate">{b.location}</span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-bold text-slate-950">No businesses found</p>
            <p className="mt-1 text-sm text-slate-500">Try resetting your filters or be the first to list one.</p>
          </div>
        )}
      </div>

      {isSubmitBusinessOpen && <SubmitBusinessModal onClose={() => setIsSubmitBusinessOpen(false)} />}
    </div>
  );
}
