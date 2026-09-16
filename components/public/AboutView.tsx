"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Globe2,
  Users,
  ShieldCheck,
  Award,
  BookOpen,
  ArrowRight,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import LeadershipModal, { type LeadershipModalMember } from "@/components/public/LeadershipModal";

const CAMPUS_HERO = "/images/ipam_university_campus_1788350001937.jpg";

type LegacyTab = "mission" | "pillars" | "governance";
type MetricKey = "alumni" | "countries" | "giving";

// Matches the static "15,000+ alumni across 45+ countries" figures used on the
// home page (HomeHeroSection/HomeAboutSection) — kept as shared marketing copy
// rather than a live DB count, so the same claim doesn't contradict itself
// across pages depending on how much demo data happens to be seeded.
const ALUMNI_COUNT_LABEL = "15,000+";

export default function AboutView({ leaders }: { leaders: LeadershipModalMember[] }) {
  const { setInfoModalType } = useApp();
  const [activeTab, setActiveTab] = useState<LegacyTab>("mission");
  const [expandedMetric, setExpandedMetric] = useState<MetricKey | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<LeadershipModalMember | null>(null);

  function toggleMetric(key: MetricKey) {
    setExpandedMetric((cur) => (cur === key ? null : key));
  }

  const alumniCountLabel = ALUMNI_COUNT_LABEL;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* 1. Header Banner */}
      <section className="relative flex min-h-[580px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[640px]">
        <div className="absolute inset-0 z-0">
          <img
            src={CAMPUS_HERO}
            alt="Institute of Public Administration and Management Campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300">
            <GraduationCap className="h-4 w-4 text-emerald-400" />
            <span>Institute of Public Administration and Management • University of Sierra Leone</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              A Legacy of Leadership, Innovation &amp; Global Impact
            </h1>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              Uniting thousands of graduates worldwide. For over four decades, IPAM has trained visionary public
              servants, chartered accountants, enterprise leaders, and technology trailblazers across Sierra Leone
              and the global diaspora.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">1980</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Founding Year</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{alumniCountLabel}</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Global Alumni</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">12+</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Global Chapters</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">$100k+</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Scholarships Awarded</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Container */}
      <div className="mx-auto mt-10 max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
        {/* Section A: Legacy, Vision & Interactive Pillars */}
        <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-12">
            <div className="w-full flex-1 space-y-5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Our Legacy &amp; Vision</span>
              </div>

              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                About Our Global Association
              </h2>

              <p className="text-base font-normal leading-relaxed text-slate-700">
                The IPAM Alumni Association is dedicated to fostering a lifelong connection between the university
                and its graduates. Our mission is to empower our global network through professional development,
                mentorship, and exclusive networking opportunities.
              </p>

              <p className="text-sm leading-relaxed text-slate-600">
                Since our founding in 1980, we have grown into a vibrant community of over {alumniCountLabel}{" "}
                professionals across 45 countries, committed to the values of excellence, ethical leadership, and
                innovation.
              </p>

              <div className="pt-2">
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActiveTab("mission")}
                    className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                      activeTab === "mission"
                        ? "border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 shadow-xs"
                        : "border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Core Mission
                  </button>
                  <button
                    onClick={() => setActiveTab("pillars")}
                    className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                      activeTab === "pillars"
                        ? "border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 shadow-xs"
                        : "border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Key Pillars
                  </button>
                  <button
                    onClick={() => setActiveTab("governance")}
                    className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold transition-colors sm:text-sm ${
                      activeTab === "governance"
                        ? "border border-emerald-200 bg-emerald-50 font-bold text-emerald-800 shadow-xs"
                        : "border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Constitution &amp; Bylaws
                  </button>
                </div>

                <div className="mt-3 text-xs text-slate-700 sm:text-sm">
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                        <p className="text-xs font-bold text-slate-900">Mentorship Network</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          1-on-1 pairings and career sponsorship for new grads
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5">
                        <p className="text-xs font-bold text-slate-900">Global Chapters</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">
                          Active hubs in London, Washington DC, Toronto, Lagos, and Freetown
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === "governance" && (
                    <div className="flex flex-col justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-medium text-slate-700">
                          Official Non-Profit Alumni Body Registered with USL
                        </span>
                      </div>
                      <button
                        onClick={() => setInfoModalType("bylaws")}
                        className="flex cursor-pointer items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Read Full Bylaws</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="group w-full flex-1 overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
              <img
                alt="IPAM Campus Networking and High Tech Center"
                className="h-[300px] w-full object-cover transition-transform duration-700 group-hover:scale-105 sm:h-[360px]"
                src={CAMPUS_HERO}
              />
            </div>
          </div>
        </section>

        {/* Section B: Heritage & Historical Milestones */}
        <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>Our Heritage &amp; Milestones</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Four Decades of Excellence</h2>
            </div>
            <p className="max-w-md text-sm text-slate-600">
              From foundational classrooms in Tower Hill, Freetown, to premier global institutions worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-100 text-sm font-black text-emerald-800">
                01
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Founding Mandate (1980)</h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Established as the premier civil service and management training institution under the University
                of Sierra Leone framework to build human resource capacity for national development.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-100 text-sm font-black text-emerald-800">
                02
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Academic Expansion</h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Pioneered cutting-edge degree programmes in Banking &amp; Finance, Information Systems, Applied
                Accounting, Procurement, and Public Sector Governance.
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-100 text-sm font-black text-emerald-800">
                03
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Global Digital Era</h3>
              <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                Today, IPAM Alumni Association connects alumni across London, Washington DC, Toronto, Lagos, and
                Freetown through digital verified credentials, mentoring, and investment networks.
              </p>
            </div>
          </div>
        </section>

        {/* Section C: Leadership Showcase */}
        {leaders.length > 0 && (
          <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
            <div className="mx-auto max-w-2xl space-y-2 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                <span>Executive Council</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Meet Our Global Leadership
              </h2>
              <p className="text-sm text-slate-600">
                Dedicated alumni executives serving our global community and driving strategic initiatives for
                future generations.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {leaders.map((leader) => (
                <button
                  key={leader.id}
                  onClick={() => setSelectedLeader(leader)}
                  className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                >
                  <div className="relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-emerald-600 bg-slate-100 shadow-xs transition-transform duration-300 group-hover:scale-105 sm:h-28 sm:w-28">
                    {leader.image ? (
                      <img alt={leader.role} className="h-full w-full object-cover" src={leader.image} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold text-emerald-700">
                        {leader.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 transition-colors group-hover:bg-slate-900/60">
                      <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-extrabold text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                        View Profile
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">
                    {leader.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-emerald-700">{leader.role}</p>
                  <span className="mt-1.5 inline-block rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {leader.classYear}
                  </span>

                  <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200/80 pt-3 text-xs font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span>Read Bio &amp; Vision</span>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Section D: Worldwide Chapters & Engagement */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-900/50 bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-8 text-white shadow-md sm:p-12">
          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-900/80 px-3 py-1 text-xs font-bold text-emerald-300">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              <span>Worldwide Network</span>
            </div>

            <h2 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">
              Connect with Your Local Chapter or Start One
            </h2>

            <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
              Whether you are based in Freetown, London, Texas, Ontario, or Accra, your IPAM community is always
              within reach. Participate in regional galas, professional mixers, and student mentoring initiatives.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/directory"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-95"
              >
                <span>Find Alumni in Your Area</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/giving"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800"
              >
                <HeartHandshake className="h-4 w-4 text-emerald-400" />
                <span>Support Student Endowments</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section E: Metrics Counter Cards */}
        <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span>Global Reach</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Our Impact in Numbers
            </h2>
            <p className="text-sm text-slate-600">
              A growing community spanning public governance, private industry, and international development.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 text-center md:grid-cols-3">
            {/* Metric 1 */}
            <div
              onClick={() => toggleMetric("alumni")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md md:p-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-100 text-emerald-800 transition-transform group-hover:scale-105">
                <Users className="h-6 w-6" />
              </div>
              <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700 md:text-5xl">
                {alumniCountLabel}
              </div>
              <div className="text-lg font-bold text-slate-800">Total Alumni</div>
              <p className="mt-1 text-sm text-slate-500">Connecting graduates worldwide.</p>
              <div className="mt-4 flex items-center justify-center gap-1 text-xs font-bold text-emerald-700">
                <span>{expandedMetric === "alumni" ? "Hide Breakdown" : "View Demographics"}</span>
                {expandedMetric === "alumni" ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>

              {expandedMetric === "alumni" && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Business &amp; Finance:</span>
                    <span className="font-bold text-slate-900">38%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tech &amp; Computing:</span>
                    <span className="font-bold text-slate-900">29%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Public Sector &amp; Law:</span>
                    <span className="font-bold text-slate-900">21%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Healthcare &amp; Other:</span>
                    <span className="font-bold text-slate-900">12%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metric 2 */}
            <div
              onClick={() => toggleMetric("countries")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-teal-300 hover:bg-white hover:shadow-md md:p-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200/60 bg-teal-100 text-teal-800 transition-transform group-hover:scale-105">
                <Globe2 className="h-6 w-6" />
              </div>
              <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-teal-700 md:text-5xl">
                45+
              </div>
              <div className="text-lg font-bold text-slate-800">Countries</div>
              <p className="mt-1 text-sm text-slate-500">A truly international footprint.</p>
              <div className="mt-4 flex items-center justify-center gap-1 font-bold text-teal-700">
                <span>{expandedMetric === "countries" ? "Hide Hubs" : "View Top Hubs"}</span>
                {expandedMetric === "countries" ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>

              {expandedMetric === "countries" && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sierra Leone (HQ):</span>
                    <span className="font-bold text-slate-900">55%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>United Kingdom:</span>
                    <span className="font-bold text-slate-900">18%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>United States &amp; Canada:</span>
                    <span className="font-bold text-slate-900">15%</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>West Africa &amp; Other:</span>
                    <span className="font-bold text-slate-900">12%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Metric 3 */}
            <div
              onClick={() => toggleMetric("giving")}
              className="group cursor-pointer rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-center shadow-xs transition-all duration-300 hover:border-amber-300 hover:bg-white hover:shadow-md md:p-8"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-100 text-amber-800 transition-transform group-hover:scale-105">
                <Award className="h-6 w-6" />
              </div>
              <div className="mb-1.5 text-4xl font-black tracking-tight text-slate-900 transition-colors group-hover:text-amber-700 md:text-5xl">
                $100k+
              </div>
              <div className="text-lg font-bold text-slate-800">Scholarship Support</div>
              <p className="mt-1 text-sm text-slate-500">Directly funding student success.</p>
              <div className="mt-4 flex items-center justify-center gap-1 font-bold text-amber-700">
                <span>{expandedMetric === "giving" ? "Hide Impact" : "View Impact Areas"}</span>
                {expandedMetric === "giving" ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </div>

              {expandedMetric === "giving" && (
                <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-left text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Merit Scholarships:</span>
                    <span className="font-bold text-slate-900">$45,000</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tech Lab Infrastructure:</span>
                    <span className="font-bold text-slate-900">$35,000</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Emergency Hardship Grants:</span>
                    <span className="font-bold text-slate-900">$20,000+</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <LeadershipModal leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
    </div>
  );
}
