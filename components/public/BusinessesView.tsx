"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { useApp } from "@/lib/public/context";
import SubmitBusinessModal from "@/components/public/SubmitBusinessModal";

export interface BusinessListItem {
  id: string;
  name: string;
  industry: string;
  tagline: string | null;
  location: string;
  featured: boolean;
  image: string | null;
}

export default function BusinessesView({ businesses }: { businesses: BusinessListItem[] }) {
  const { session, isSubmitBusinessOpen, setIsSubmitBusinessOpen } = useApp();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Alumni Business Directory</h1>
          <p className="mt-1 text-slate-500">Businesses founded and led by IPAM graduates.</p>
        </div>
        <button
          onClick={() => (session ? setIsSubmitBusinessOpen(true) : (window.location.href = "/login"))}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> List Your Business
        </button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <Link
            key={b.id}
            href={`/businesses/${b.id}`}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-300 hover:shadow-md"
          >
            <div className="relative h-40 overflow-hidden bg-slate-900">
              {b.image ? (
                <img src={b.image} alt={b.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                  <Building2 className="h-8 w-8 text-emerald-300" />
                </div>
              )}
              {b.featured && (
                <span className="absolute top-3 left-3 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Featured
                </span>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-slate-900">{b.name}</h3>
              <p className="text-sm text-emerald-700">{b.industry}</p>
              <p className="mt-2 text-sm text-slate-500">{b.tagline ?? b.location}</p>
            </div>
          </Link>
        ))}
        {businesses.length === 0 && <p className="text-sm text-slate-500">No businesses listed yet.</p>}
      </div>

      {isSubmitBusinessOpen && <SubmitBusinessModal onClose={() => setIsSubmitBusinessOpen(false)} />}
    </div>
  );
}
