"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Briefcase, CreditCard, ArrowRight, Sparkles } from "lucide-react";
import { useApp } from "@/lib/public/context";

export default function HomeFeaturesSection() {
  const { session, setIsPassModalOpen, setPassModalTab } = useApp();
  const router = useRouter();

  function handleOpenVirtualId() {
    if (!session) {
      router.push("/login");
      return;
    }
    setPassModalTab("virtual");
    setIsPassModalOpen(true);
  }

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span>Alumni Ecosystem</span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Comprehensive Platform Features
        </h2>
        <p className="text-sm text-slate-600">
          Everything you need to stay connected, advance your career, and give back to the IPAM community.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <button
          onClick={handleOpenVirtualId}
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-6 text-left shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200/60 bg-emerald-100 text-emerald-800 transition-transform group-hover:scale-105">
              <BadgeCheck className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 md:text-xl">
              Virtual ID Cards
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Access your digital alumni ID card anytime, anywhere. Use it to gain entry to campus
              events, unlock partner discounts, and verify your alumni status instantly.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-200/80 pt-4 text-xs font-bold text-emerald-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Generate / View Card</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>

        <Link
          href="/jobs"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-6 shadow-xs transition-all duration-300 hover:border-teal-300 hover:bg-white hover:shadow-md md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200/60 bg-teal-100 text-teal-800 transition-transform group-hover:scale-105">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-teal-700 md:text-xl">
              Job Matching Portal
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Discover exclusive career opportunities posted by fellow alumni and top-tier corporate
              partners. Let our intelligent algorithm match you with your next big role.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-200/80 pt-4 text-xs font-bold text-teal-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Browse Job Openings</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/giving"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50 p-6 shadow-xs transition-all duration-300 hover:border-amber-300 hover:bg-white hover:shadow-md md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200/60 bg-amber-100 text-amber-800 transition-transform group-hover:scale-105">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-amber-700 md:text-xl">
              Global & Local Payments
            </h3>
            <p className="text-sm leading-relaxed text-slate-600">
              Seamlessly process alumni dues, event tickets, and donations using our secure,
              multi-currency payment gateway designed for our global community.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-200/80 pt-4 text-xs font-bold text-amber-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Manage Dues & Giving</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </section>
  );
}
