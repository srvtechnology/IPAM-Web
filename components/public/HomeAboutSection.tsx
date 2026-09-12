"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/public/context";

const TABS = [
  { value: "mission", label: "Core Mission" },
  { value: "pillars", label: "Key Pillars" },
  { value: "governance", label: "Constitution & Bylaws" },
] as const;

export default function HomeAboutSection() {
  const { setInfoModalType } = useApp();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["value"]>("mission");

  return (
    <section className="border-y border-slate-200/80 bg-white py-12 shadow-sm md:py-16">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 sm:px-6 md:flex-row md:gap-12 lg:px-8">
        {/* Left Text Content */}
        <div className="flex-1 space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
            Our Legacy & Vision
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[34px]">
            About Our Global Association
          </h2>

          <p className="text-base leading-relaxed text-slate-600 sm:text-lg">
            The IPAM Alumni Association is dedicated to fostering a lifelong connection between the
            university and its graduates. Our mission is to empower our global network through
            professional development, mentorship, and exclusive networking opportunities.
          </p>

          <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
            Since our founding, we have grown into a vibrant community of over 15,000 professionals
            across 45 countries, all committed to the values of excellence and innovation that
            defined our time at IPAM.
          </p>

          <div className="pt-2">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors sm:text-sm ${
                    activeTab === tab.value
                      ? "border border-emerald-300 bg-emerald-100 text-emerald-900"
                      : "text-slate-600 hover:text-emerald-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-3 text-xs text-slate-600 sm:text-sm">
              {activeTab === "mission" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Cultivate lifelong professional fellowship and career advancement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Sustain educational scholarships and university research endowments</span>
                  </div>
                </div>
              )}

              {activeTab === "pillars" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-900">Mentorship</p>
                    <p className="text-[11px] text-slate-500">1-on-1 pairings for new grads</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-900">Global Chapters</p>
                    <p className="text-[11px] text-slate-500">London, NY, Geneva, Lagos, etc.</p>
                  </div>
                </div>
              )}

              {activeTab === "governance" && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-xs text-slate-600">Registered Non-Profit Alumni Body</span>
                  <button onClick={() => setInfoModalType("bylaws")} className="text-xs font-bold text-emerald-700 hover:underline">
                    Read Full Bylaws
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Image Container */}
        <div className="group w-full flex-1 overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
          <img
            alt="IPAM Campus Networking and High Tech Center"
            className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[380px]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBS7hGqBgF3dgTfpKzDMHjBes0gLp1Gg8NssFRxkciWqV1AaOoUiumq2dEgKnpXFj3rG3atl02_hyeBMiyhnueP70uRmMSJI1OEtF05i4yUd9mlwwhkvP4ry_Jfi2cH4B_66yRLrvnIFsJ8mJC6GHC7nsj7baT6b-MpHeOYBAHS8w9XwVF-aaBw8LM-CNjUnuc6sNLCZL4L-KShFDBFGT1fTq9-skZfec4kQQefTKTSn-QwZiVuxdmn"
          />
        </div>
      </div>
    </section>
  );
}
