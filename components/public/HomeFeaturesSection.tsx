"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Briefcase, CreditCard, ArrowRight } from "lucide-react";
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
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
      <div className="mb-10 text-center md:mb-12">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
          Alumni Ecosystem
        </div>
        <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[34px]">
          Comprehensive Platform Features
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Everything you need to stay connected, advance your career, and give back to the IPAM community.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <button
          onClick={handleOpenVirtualId}
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-xl md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 shadow-sm transition-transform group-hover:scale-110">
              <BadgeCheck className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-800 md:text-xl">
              Virtual ID Cards
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              Access your digital alumni ID card anytime, anywhere. Use it to gain entry to campus
              events, unlock partner discounts, and verify your alumni status instantly.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs font-bold text-emerald-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Generate / View Card</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>

        <Link
          href="/jobs"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-xl md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200 bg-teal-100/80 shadow-sm transition-transform group-hover:scale-110">
              <Briefcase className="h-6 w-6 text-teal-800" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-800 md:text-xl">
              Job Matching Portal
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              Discover exclusive career opportunities posted by fellow alumni and top-tier corporate
              partners. Let our intelligent algorithm match you with your next big role.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs font-bold text-emerald-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Browse Job Openings</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/giving"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-emerald-400 hover:shadow-xl md:p-8"
        >
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 shadow-sm transition-transform group-hover:scale-110">
              <CreditCard className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="mb-3 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-800 md:text-xl">
              Global & Local Payments
            </h3>
            <p className="text-sm leading-relaxed text-slate-600 md:text-base">
              Seamlessly process alumni dues, event tickets, and donations using our secure,
              multi-currency payment gateway designed for our global community.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 border-t border-slate-100 pt-4 text-xs font-bold text-emerald-700 transition-transform group-hover:translate-x-1 sm:text-sm">
            <span>Manage Dues & Giving</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </Link>
      </div>
    </section>
  );
}
