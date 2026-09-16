"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Globe, Sparkles, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/public/context";

const TABS = [
  { value: "mission", label: "Core Mission" },
  { value: "pillars", label: "Key Pillars" },
  { value: "governance", label: "Constitution & Bylaws" },
] as const;

export default function HomeAboutSection() {
  const { setInfoModalType } = useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["value"]>("mission");

  return (
    <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
        {/* Left Text Content */}
        <div className="flex-1 space-y-5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Our Legacy & Vision</span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            About Our Global Association
          </h2>

          <p className="text-base font-normal leading-relaxed text-slate-700 sm:text-lg">
            The IPAM Alumni Association is dedicated to fostering a lifelong connection between the
            university and its graduates. Our mission is to empower our global network through
            professional development, mentorship, and exclusive networking opportunities.
          </p>

          <p className="text-sm leading-relaxed text-slate-500 sm:text-base">
            Since our founding in 1980, we have grown into a vibrant community of over 15,000
            professionals across 45 countries, all committed to the values of excellence and
            innovation that defined our time at IPAM.
          </p>

          <div className="pt-2">
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                    activeTab === tab.value
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-4 text-xs text-slate-600 sm:text-sm">
              {activeTab === "mission" && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Cultivate lifelong professional fellowship and career advancement</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Sustain educational scholarships and university research endowments</span>
                  </div>
                </div>
              )}

              {activeTab === "pillars" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                    <p className="text-xs font-bold text-slate-900">Mentorship</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">1-on-1 pairings for new grads</p>
                  </div>
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                    <p className="text-xs font-bold text-slate-900">Global Chapters</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">London, NY, Geneva, Lagos, etc.</p>
                  </div>
                </div>
              )}

              {activeTab === "governance" && (
                <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                  <span className="text-xs font-medium text-slate-700">Registered Non-Profit Alumni Body</span>
                  <button
                    onClick={() => setInfoModalType("bylaws")}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Read Constitution</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Visual Stats Card */}
        <div className="w-full space-y-6 rounded-3xl border border-slate-200/90 bg-slate-50 p-6 shadow-sm sm:p-8 md:w-[420px]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-100 text-emerald-700">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">International Network</h3>
              <p className="text-xs text-slate-500">Active across 5 continents</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
              <span className="text-slate-500">Founded</span>
              <span className="font-bold text-slate-900">1980 • Freetown, Sierra Leone</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
              <span className="text-slate-500">Parent University</span>
              <span className="font-bold text-emerald-700">University of Sierra Leone</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-xs">
              <span className="text-slate-500">Active Chapters</span>
              <span className="font-bold text-slate-900">12 Regional Chapters</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Executive Elections</span>
              <span className="font-bold text-slate-900">Bi-annual Member Vote</span>
            </div>
          </div>

          <button
            onClick={() => router.push("/directory")}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-emerald-800 shadow-xs transition-all hover:bg-slate-100"
          >
            <span>Explore All Global Chapters</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}
