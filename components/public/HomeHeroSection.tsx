"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Globe, ShieldCheck, Search, GraduationCap, Users, Building2 } from "lucide-react";
import { useApp } from "@/lib/public/context";

export default function HomeHeroSection() {
  const { session } = useApp();
  const router = useRouter();

  function handleRegisterClick() {
    router.push(session ? "/directory" : "/register");
  }

  return (
    <section className="relative flex min-h-[580px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[640px]">
      <div className="absolute inset-0 z-0">
        <img
          src="/images/ipam_university_campus_1788350001937.jpg"
          alt="Institute of Public Administration and Management (IPAM) University of Sierra Leone Campus"
          className="h-full w-full scale-105 transform object-cover object-center transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-bold tracking-wide text-emerald-300 shadow-sm backdrop-blur-md">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <GraduationCap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="uppercase">University of Sierra Leone • IPAM Global Network</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Connect.{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Empower.
              </span>{" "}
              Excel.
            </h1>
            <p className="text-xl font-bold tracking-tight text-slate-200 sm:text-2xl">
              The Official Association for IPAM Graduates Worldwide
            </p>
          </div>

          <p className="max-w-2xl text-base font-normal leading-relaxed text-slate-300 sm:text-lg">
            Uniting over 15,000 public servants, enterprise executives, chartered accountants, and tech pioneers
            across 45+ countries. Access verified credentials, executive mentoring, and exclusive career
            opportunities.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-3">
            <button
              onClick={handleRegisterClick}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition-all hover:bg-emerald-500 hover:shadow-emerald-600/30 active:scale-95"
            >
              <span>Join Alumni Network</span>
              <ArrowRight className="h-4 w-4 text-slate-950" />
            </button>

            <Link
              href="/jobs"
              className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/80 px-5 py-3.5 text-sm font-bold text-white shadow-sm backdrop-blur-md transition-all hover:border-emerald-500/50 hover:bg-slate-800 active:scale-95 sm:px-6"
            >
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Explore Careers</span>
            </Link>

            <Link
              href="/directory"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3.5 text-sm font-bold text-slate-200 backdrop-blur-md transition-all hover:bg-white/15 hover:text-white active:scale-95"
            >
              <Search className="h-4 w-4 text-emerald-300" />
              <span>Find Classmates</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-6 sm:grid-cols-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">15,000+</p>
                <p className="text-[11px] text-slate-400">Global Alumni</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Globe className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">45+ Nations</p>
                <p className="text-[11px] text-slate-400">Active Chapters</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <Building2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Est. 1980</p>
                <p className="text-[11px] text-slate-400">Freetown, SL</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-800/50 bg-emerald-950/60">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-white">Verified</p>
                <p className="text-[11px] text-slate-400">Registrar Records</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
