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
    <section className="my-8 border-y border-slate-200/80 bg-white py-12 shadow-sm md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3 md:gap-8">
          {/* Metric 1 */}
          <div
            onClick={() => toggle("alumni")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-6 text-center shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md md:p-8"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 text-emerald-700 shadow-sm">
              <Users className="h-6 w-6" />
            </div>
            <div className="mb-1.5 text-4xl font-extrabold tracking-tight text-emerald-800 transition-transform group-hover:scale-105 md:text-5xl">
              15,000+
            </div>
            <div className="text-lg font-bold text-slate-900 md:text-xl">Total Alumni</div>
            <p className="mt-1 text-sm text-slate-600">Connecting graduates worldwide.</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700">
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

          {/* Metric 2 */}
          <div
            onClick={() => toggle("countries")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-6 text-center shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md md:p-8"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200 bg-teal-100/80 text-teal-800 shadow-sm">
              <Globe2 className="h-6 w-6" />
            </div>
            <div className="mb-1.5 text-4xl font-extrabold tracking-tight text-teal-800 transition-transform group-hover:scale-105 md:text-5xl">
              45+
            </div>
            <div className="text-lg font-bold text-slate-900 md:text-xl">Countries Reached</div>
            <p className="mt-1 text-sm text-slate-600">A truly international footprint.</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-teal-800">
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

          {/* Metric 3 */}
          <div
            onClick={() => toggle("funds")}
            className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-6 text-center shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50/40 hover:shadow-md md:p-8"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 text-emerald-700 shadow-sm">
              <Award className="h-6 w-6" />
            </div>
            <div className="mb-1.5 text-4xl font-extrabold tracking-tight text-emerald-800 transition-transform group-hover:scale-105 md:text-5xl">
              $2M+
            </div>
            <div className="text-lg font-bold text-slate-900 md:text-xl">Funds Raised</div>
            <p className="mt-1 text-sm text-slate-600">Supporting student scholarships.</p>
            <div className="mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-emerald-700">
              <span>{expanded === "funds" ? "Hide Impact" : "View Impact Allocation"}</span>
              {expanded === "funds" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>

            {expanded === "funds" && (
              <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
                <div className="flex justify-between text-slate-600"><span>Undergraduate Merit Grants:</span><span className="font-bold text-slate-900">$1,150,000</span></div>
                <div className="flex justify-between text-slate-600"><span>Emergency Student Relief Fund:</span><span className="font-bold text-slate-900">$450,000</span></div>
                <div className="flex justify-between text-slate-600"><span>Campus Tech Lab Upgrades:</span><span className="font-bold text-slate-900">$520,000</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
