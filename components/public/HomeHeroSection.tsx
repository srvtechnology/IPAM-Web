"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, QrCode, Briefcase, Globe, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "@/lib/public/context";

export default function HomeHeroSection() {
  const { session, setIsPassModalOpen, setPassModalTab } = useApp();
  const router = useRouter();

  function handleOrderIdClick() {
    if (!session) {
      router.push("/login");
      return;
    }
    setPassModalTab("order");
    setIsPassModalOpen(true);
  }

  return (
    <section className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-8 sm:px-6 md:flex-row md:gap-12 md:py-16 lg:px-8">
      {/* Left Text Column */}
      <div className="z-10 flex-1 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
          <Globe className="h-3.5 w-3.5 text-emerald-600" />
          <span>Official Global Network</span>
        </div>

        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-[52px]">
          Connect. <span className="text-emerald-600">Empower.</span> Excel.
        </h1>

        <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Join the global network of IPAM graduates. Access exclusive resources, mentor the next
          generation, and advance your career within a prestigious community built on excellence
          and innovation.
        </p>

        <div className="flex flex-wrap gap-3 pt-2 sm:gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-95"
          >
            <span>Register as Alumni</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <button
            onClick={handleOrderIdClick}
            className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-white px-5 py-3.5 text-sm font-bold text-emerald-900 shadow-sm transition-all hover:border-emerald-400 hover:bg-emerald-50/70 active:scale-95 sm:px-6"
          >
            <QrCode className="h-4 w-4 text-emerald-700" />
            <span>Digital Pass & QR</span>
          </button>

          <Link
            href="/jobs"
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95 sm:px-6"
          >
            <Briefcase className="h-4 w-4 text-emerald-400" />
            <span>Explore Jobs</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-5 pt-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Registrar Verified Portal</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">45+ Active Country Chapters</span>
          </div>
        </div>
      </div>

      {/* Right Hero Visual Column */}
      <div className="group relative h-[380px] w-full flex-1 overflow-hidden rounded-3xl border border-slate-200/80 shadow-xl sm:h-[460px] md:h-[500px]">
        <img
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt="A diverse group of professional alumni networking at a high-end, modern corporate event"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPRqjDx1rSUK5N34mRZRpy5vhVY-qWwFCp_oq0IRHrgppRAyHUdYHv--UaGtprGA173-WQRtyNUg3yVKAe5gk_dl-CQp0bkrH6qmYyr-qfgSTGyllwWJrUhlceuYCCTHxC1HhZ_et_UcOVXmj21_cIdz7Ec8u2x-qq3Ad8ph160p8rW-14dERGCzAChfRz2td8f8EiAXkJEldUJxjmq3lwhfFMyPmoj79XmE3wZ98PpNmWRGd17gdd"
        />
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/80 bg-white/95 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-xs font-extrabold text-white shadow-sm">
              IPAM
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Global Alumni Summit 2025</p>
              <p className="text-[11px] text-slate-500">Connecting 15,000+ Leaders Worldwide</p>
            </div>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-800">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            Active
          </span>
        </div>
      </div>
    </section>
  );
}
