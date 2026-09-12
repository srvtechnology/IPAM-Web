"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import LeadershipModal, { type LeadershipModalMember } from "@/components/public/LeadershipModal";

export default function HomeLeadershipSection({ leaders }: { leaders: LeadershipModalMember[] }) {
  const [selected, setSelected] = useState<LeadershipModalMember | null>(null);

  if (leaders.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mb-10 text-center md:mb-12">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
          Executive Council
        </div>
        <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[36px]">
          Meet Our Global Leadership
        </h2>
        <p className="mx-auto max-w-xl text-sm text-slate-600 md:text-base">
          Dedicated alumni executives serving our global community and driving strategic initiatives for future generations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
        {leaders.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelected(l)}
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-lg"
          >
            <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-600 bg-emerald-50 shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
              {l.image ? (
                <img src={l.image} alt={l.role} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-700">
                  {l.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/20 transition-colors group-hover:bg-emerald-950/40">
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-900 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  View Profile
                </span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-lg">
              {l.name}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-emerald-700 sm:text-sm">{l.role}</p>
            <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {l.classYear}
            </span>

            <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-100 pt-3 text-xs font-bold text-emerald-700">
              <span>Read Bio & Vision</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </button>
        ))}
      </div>

      <LeadershipModal leader={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
