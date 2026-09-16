"use client";

import { useState } from "react";
import { Users, Globe2, Award, ChevronDown, ChevronUp } from "lucide-react";

type MetricKey = "alumni" | "countries" | "funds";

export default function HomeMetricsSection() {
  const [expanded, setExpanded] = useState<MetricKey | null>(null);

  function toggle(key: MetricKey) {
    setExpanded((cur) => (cur === key ? null : key));
  }

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Users className="h-3.5 w-3.5 text-emerald-600" />
          <span>Global Reach</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Our Impact in Numbers</h2>
        <p className="text-sm text-slate-600">
          A growing community spanning public governance, private industry, and international development.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div
          onClick={() => toggle("alumni")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-emerald-500/50 hover:bg-white hover:shadow-md md:p-8"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-100 text-emerald-800 transition-transform group-hover:scale-105">
            <Users className="h-6 w-6" />
          </div>
          <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">15,000+</div>
          <div className="text-lg font-bold text-slate-800">Total Alumni</div>
          <p className="mt-1 text-sm text-slate-500">Connecting graduates worldwide.</p>
          <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
            <span>{expanded === "alumni" ? "Hide Breakdown" : "View Demographics"}</span>
            {expanded === "alumni" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>

          {expanded === "alumni" && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
              <div className="flex justify-between text-slate-600"><span>Business & Finance:</span><span className="font-bold text-slate-900">38%</span></div>
              <div className="flex justify-between text-slate-600"><span>Tech & Computing:</span><span className="font-bold text-slate-900">29%</span></div>
              <div className="flex justify-between text-slate-600"><span>Public Sector & Law:</span><span className="font-bold text-slate-900">21%</span></div>
              <div className="flex justify-between text-slate-600"><span>Healthcare & Other:</span><span className="font-bold text-slate-900">12%</span></div>
            </div>
          )}
        </div>

        <div
          onClick={() => toggle("countries")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-emerald-500/50 hover:bg-white hover:shadow-md md:p-8"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200/60 bg-teal-100 text-teal-800 transition-transform group-hover:scale-105">
            <Globe2 className="h-6 w-6" />
          </div>
          <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">45+</div>
          <div className="text-lg font-bold text-slate-800">Countries Reached</div>
          <p className="mt-1 text-sm text-slate-500">A truly international footprint.</p>
          <div className="mt-4 flex items-center justify-center gap-1 font-bold text-teal-700">
            <span>{expanded === "countries" ? "Hide Chapters" : "View Top Regions"}</span>
            {expanded === "countries" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>

          {expanded === "countries" && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
              <div className="flex justify-between text-slate-600"><span>North America (USA & Canada):</span><span className="font-bold text-slate-900">4,200+ members</span></div>
              <div className="flex justify-between text-slate-600"><span>Europe & UK Chapter:</span><span className="font-bold text-slate-900">5,100+ members</span></div>
              <div className="flex justify-between text-slate-600"><span>Africa & Middle East:</span><span className="font-bold text-slate-900">4,800+ members</span></div>
              <div className="flex justify-between text-slate-600"><span>Asia-Pacific:</span><span className="font-bold text-slate-900">1,300+ members</span></div>
            </div>
          )}
        </div>

        <div
          onClick={() => toggle("funds")}
          className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-emerald-500/50 hover:bg-white hover:shadow-md md:p-8"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-100 text-amber-800 transition-transform group-hover:scale-105">
            <Award className="h-6 w-6" />
          </div>
          <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">$100k+</div>
          <div className="text-lg font-bold text-slate-800">Scholarship Support</div>
          <p className="mt-1 text-sm text-slate-500">Directly funding student success.</p>
          <div className="mt-4 flex items-center justify-center gap-1 font-bold text-amber-700">
            <span>{expanded === "funds" ? "Hide Impact" : "View Impact Areas"}</span>
            {expanded === "funds" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>

          {expanded === "funds" && (
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
              <div className="flex justify-between text-slate-600"><span>Merit Scholarships:</span><span className="font-bold text-slate-900">$45,000</span></div>
              <div className="flex justify-between text-slate-600"><span>Tech Lab Infrastructure:</span><span className="font-bold text-slate-900">$35,000</span></div>
              <div className="flex justify-between text-slate-600"><span>Emergency Hardship Grants:</span><span className="font-bold text-slate-900">$20,000+</span></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
