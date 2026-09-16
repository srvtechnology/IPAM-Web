"use client";

import { useState } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import LeadershipModal, { type LeadershipModalMember } from "@/components/public/LeadershipModal";

export default function HomeLeadershipSection({ leaders }: { leaders: LeadershipModalMember[] }) {
  const [selected, setSelected] = useState<LeadershipModalMember | null>(null);

  if (leaders.length === 0) return null;

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Executive Council</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Meet Our Global Leadership
        </h2>
        <p className="text-sm text-slate-600">
          Dedicated alumni executives serving our global community and driving strategic initiatives for future generations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {leaders.map((l) => (
          <button
            key={l.id}
            onClick={() => setSelected(l)}
            className="group rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
          >
            <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-600 bg-slate-100 shadow-xs transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
              {l.image ? (
                <img src={l.image} alt={l.role} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-700">
                  {l.name.charAt(0)}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-colors group-hover:bg-slate-900/60">
                <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                  View Profile
                </span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
              {l.name}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-emerald-700">{l.role}</p>
            <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
              {l.classYear}
            </span>

            <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200/80 pt-3 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
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
