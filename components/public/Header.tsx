"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  GraduationCap,
  QrCode,
  HeartHandshake,
  ChevronDown,
  ShieldCheck,
  CreditCard,
  Search,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/lib/public/context";

const NAV_LINKS: { href: string; label: string; icon?: typeof HeartHandshake }[] = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/jobs", label: "Job Portal" },
  { href: "/businesses", label: "Businesses" },
  { href: "/giving", label: "Giving", icon: HeartHandshake },
];

const MOBILE_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Alumni Directory" },
  { href: "/events", label: "Events & Galas" },
  { href: "/jobs", label: "Job Portal" },
  { href: "/businesses", label: "Alumni Businesses" },
  { href: "/giving", label: "Giving & Scholarships" },
];

export default function Header() {
  const { session, setIsPassModalOpen, setPassModalTab } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  function openPassModal() {
    setPassModalTab("virtual");
    setIsPassModalOpen(true);
  }

  async function handleLogout() {
    setShowUserDropdown(false);
    await fetch("/api/auth/alumni/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-emerald-700">
          <GraduationCap className="h-6 w-6" />
          <span>IPAM Alumni</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                pathname === link.href
                  ? "border border-emerald-200/60 bg-emerald-50 font-bold text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-emerald-700"
              }`}
            >
              {link.icon && <link.icon className="h-4 w-4 text-emerald-600" />}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={openPassModal}
            title="View Your Virtual Alumni ID & QR Code"
            className="hidden items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100/80 sm:flex md:text-sm"
          >
            <QrCode className="h-4 w-4 text-emerald-700" />
            <span className="hidden md:inline">Digital Pass & QR</span>
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
              >
                {session.profile?.avatar ? (
                  <img
                    src={session.profile.avatar}
                    alt={session.profile.name}
                    className="h-7 w-7 rounded-full border-2 border-emerald-600 object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {(session.profile?.name ?? session.email).charAt(0)}
                  </span>
                )}
                <span className="hidden text-xs font-medium sm:inline md:text-sm">
                  {session.profile?.name ?? session.email}
                </span>
                {session.profile?.classYear && (
                  <span className="hidden rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 md:inline">
                    Verified &apos;{String(session.profile.classYear).slice(-2)}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                  <div className="border-b border-slate-100 p-3">
                    <p className="text-sm font-bold text-slate-900">{session.profile?.name ?? session.email}</p>
                    <p className="text-xs text-slate-500">{session.email}</p>
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{session.membershipTier.replace(/_/g, " ")} Member</span>
                    </div>
                  </div>
                  <div className="space-y-0.5 py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        openPassModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Digital Pass & QR Code</span>
                    </button>
                    <Link
                      href="/pass"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Full Virtual Card Page</span>
                    </Link>
                    <Link
                      href="/directory"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <Search className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Search Alumni Directory</span>
                    </Link>
                    <Link
                      href="/jobs"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-800"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Browse {session.savedJobsCount} Saved Jobs</span>
                    </Link>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Switch Account / Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="space-y-1.5">
            {MOBILE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  pathname === link.href
                    ? "border border-emerald-200/60 bg-emerald-50 font-bold text-emerald-800"
                    : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            {!session && (
              <div className="grid grid-cols-2 gap-2 pb-1">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-center text-sm font-bold text-slate-900 hover:bg-slate-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Register
                </Link>
              </div>
            )}

            {session && (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    openPassModal();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-800"
                >
                  <QrCode className="h-4 w-4 text-emerald-700" />
                  <span>Digital Alumni Pass & QR</span>
                </button>
                <Link
                  href="/pass"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white"
                >
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Full Digital Card Page</span>
                </Link>
                {/* Not in the reference (its mock session is always signed in, so it
                    never needed a mobile sign-out affordance) — kept here since a
                    real account needs a way to sign out on mobile too. */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-rose-600"
                >
                  Switch Account / Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
