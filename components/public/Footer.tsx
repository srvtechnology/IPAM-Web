"use client";

import Link from "next/link";
import { GraduationCap, MapPin, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/public/context";

export default function Footer() {
  const { setInfoModalType } = useApp();

  return (
    <footer className="relative w-full border-t border-slate-200 bg-white py-12 text-slate-600 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="group flex items-center gap-2.5 text-xl font-extrabold text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs transition-colors group-hover:bg-emerald-700">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="leading-none tracking-tight text-slate-900">IPAM ALUMNI</span>
                <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Association</span>
              </div>
            </Link>
            <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              Official global alumni network for the Institute of Public Administration & Management, University of
              Sierra Leone.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Tower Hill, Freetown, Sierra Leone</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Explore Portal</h4>
            <ul className="space-y-2 text-xs text-slate-600 sm:text-sm">
              <li><Link href="/directory" className="transition-colors hover:text-emerald-700">Alumni Directory</Link></li>
              <li><Link href="/events" className="transition-colors hover:text-emerald-700">Upcoming Events</Link></li>
              <li><Link href="/jobs" className="transition-colors hover:text-emerald-700">Career Openings</Link></li>
              <li><Link href="/businesses" className="transition-colors hover:text-emerald-700">Alumni Businesses</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Community & Impact</h4>
            <ul className="space-y-2 text-xs text-slate-600 sm:text-sm">
              <li><Link href="/about" className="transition-colors hover:text-emerald-700">About Our History</Link></li>
              <li><Link href="/giving" className="transition-colors hover:text-emerald-700">Scholarship Fund</Link></li>
              <li>
                <button onClick={() => setInfoModalType("bylaws")} className="transition-colors hover:text-emerald-700">
                  Constitution & Bylaws
                </button>
              </li>
              <li>
                <button onClick={() => setInfoModalType("contact")} className="transition-colors hover:text-emerald-700">
                  Contact Secretariat
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Trust & Records</h4>
            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>USL Registrar Verified</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                All alumni records are authenticated against official University of Sierra Leone academic archives.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-xs text-slate-500 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <button onClick={() => setInfoModalType("privacy")} className="transition-colors hover:text-slate-900">Privacy Policy</button>
            <button onClick={() => setInfoModalType("terms")} className="transition-colors hover:text-slate-900">Terms of Service</button>
            <button onClick={() => setInfoModalType("contact")} className="transition-colors hover:text-slate-900">Contact Us</button>
            <button onClick={() => setInfoModalType("bylaws")} className="transition-colors hover:text-slate-900">Bylaws</button>
            <Link href="/admin/login" className="transition-colors hover:text-slate-900">Admin Portal</Link>
          </div>

          <div>
            © {new Date().getFullYear()} IPAM Alumni Association • University of Sierra Leone. Powered by SRV Technology.
          </div>
        </div>
      </div>
    </footer>
  );
}
