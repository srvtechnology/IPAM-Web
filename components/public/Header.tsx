"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  BookmarkCheck,
  LogOut,
  Globe2,
  Briefcase,
  Calendar,
  Building2,
  Info,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/public/context";

const NAV_LINKS: { href: string; label: string; icon?: typeof HeartHandshake }[] = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Directory" },
  { href: "/events", label: "Events" },
  { href: "/jobs", label: "Careers" },
  { href: "/businesses", label: "Enterprises" },
  { href: "/giving", label: "Giving", icon: HeartHandshake },
  { href: "/about", label: "About Us" },
];

const MOBILE_NAV_LINKS: { href: string; label: string; icon: typeof HeartHandshake }[] = [
  { href: "/", label: "Home Overview", icon: GraduationCap },
  { href: "/directory", label: "Alumni Directory", icon: Search },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/jobs", label: "Careers", icon: Briefcase },
  { href: "/businesses", label: "Alumni Enterprises", icon: Building2 },
  { href: "/giving", label: "Endowment & Giving", icon: HeartHandshake },
  { href: "/about", label: "About Us", icon: Info },
];

export default function Header() {
  const { session, setIsPassModalOpen, setPassModalTab } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    if (showUserDropdown) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserDropdown]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function openPassModal() {
    setPassModalTab("virtual");
    setIsPassModalOpen(true);
  }

  async function handleLogout() {
    setShowUserDropdown(false);
    setMobileOpen(false);
    await fetch("/api/auth/alumni/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950 shadow-lg">
      {/* Top institutional utility strip */}
      <div className="border-b border-slate-800/80 bg-slate-950 text-xs text-slate-400">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[11px] font-medium tracking-wide sm:gap-3">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Globe2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">University of Sierra Leone</span>
              <span className="sm:hidden">IPAM USL</span>
            </span>
            <span className="hidden text-slate-700 md:inline">•</span>
            <span className="hidden text-slate-400 md:inline">Institute of Public Administration and Management</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="hidden items-center gap-3 font-medium text-slate-300 lg:flex">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-2.5 py-0.5 text-emerald-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                5,400+ Verified Alumni Worldwide
              </span>
            </div>
            <Link href="/about" className="text-slate-400 transition-colors hover:text-slate-200">
              Heritage & Chapters
            </Link>
            <Link
              href="/giving"
              className="flex items-center gap-1 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
              <span>Giving Fund</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-[4.5rem] items-center justify-between">
            <Link href="/" className="group flex items-center gap-3.5">
              <div className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 text-white shadow-md ring-1 ring-emerald-500/30 transition-transform duration-200 group-hover:scale-105">
                  <GraduationCap className="h-6 w-6 text-emerald-100" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-900 bg-amber-400 shadow-xs">
                  <span className="text-[8px] font-black text-slate-950">★</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold leading-none tracking-tight text-white transition-colors group-hover:text-emerald-300 md:text-xl">
                  IPAM ALUMNI
                </span>
                <span className="mt-0.5 text-[10px] font-bold uppercase leading-none tracking-wider text-emerald-400">
                  Association • Global Portal
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                    isActive(link.href)
                      ? "border border-emerald-500/40 bg-emerald-950/80 font-bold text-emerald-300 shadow-sm"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4 text-emerald-400" />}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              {session ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowUserDropdown((v) => !v)}
                    className="flex items-center gap-2.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-white shadow-sm transition-all hover:bg-slate-800"
                  >
                    <div className="relative">
                      {session.profile?.avatar ? (
                        <img
                          src={session.profile.avatar}
                          alt={session.profile.name}
                          className="h-7 w-7 rounded-full object-cover ring-2 ring-emerald-500"
                        />
                      ) : (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-950 text-xs font-bold text-emerald-300 ring-2 ring-emerald-500">
                          {(session.profile?.name ?? session.email).charAt(0)}
                        </span>
                      )}
                      <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
                    </div>
                    <div className="hidden flex-col text-left sm:flex">
                      <span className="text-xs font-bold leading-tight text-white">
                        {(session.profile?.name ?? session.email).split(" ")[0]}
                      </span>
                      {session.profile?.classYear && (
                        <span className="text-[10px] font-semibold leading-tight text-emerald-400">
                          Class of &apos;{String(session.profile.classYear).slice(-2)}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${showUserDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl">
                      <div className="mb-1 rounded-lg border border-slate-800/80 bg-slate-950 p-3">
                        <div className="flex items-center gap-2.5">
                          {session.profile?.avatar ? (
                            <img
                              src={session.profile.avatar}
                              alt={session.profile.name}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-emerald-500"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-950 text-sm font-bold text-emerald-300 ring-2 ring-emerald-500">
                              {(session.profile?.name ?? session.email).charAt(0)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-extrabold text-white">
                              {session.profile?.name ?? session.email}
                            </p>
                            <p className="truncate text-xs text-slate-400">{session.email}</p>
                          </div>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                          <span className="flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-950/80 px-2 py-0.5 font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            {session.membershipTier.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium text-slate-400">ID: {session.studentId}</span>
                        </div>
                      </div>

                      <div className="space-y-0.5 py-1 text-xs font-semibold text-slate-300">
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            openPassModal();
                          }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-emerald-950/60 hover:text-emerald-300"
                        >
                          <QrCode className="h-4 w-4 text-emerald-400" />
                          <span>Show Digital Pass & QR</span>
                        </button>
                        <Link
                          href="/pass"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-emerald-950/60 hover:text-emerald-300"
                        >
                          <CreditCard className="h-4 w-4 text-emerald-400" />
                          <span>Full Virtual Card Page</span>
                        </Link>
                        <Link
                          href="/jobs"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-emerald-950/60 hover:text-emerald-300"
                        >
                          <span className="flex items-center gap-2.5">
                            <BookmarkCheck className="h-4 w-4 text-emerald-400" />
                            <span>Saved Job Openings</span>
                          </span>
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                            {session.savedJobsCount}
                          </span>
                        </Link>
                        <Link
                          href="/directory"
                          onClick={() => setShowUserDropdown(false)}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-emerald-950/60 hover:text-emerald-300"
                        >
                          <Search className="h-4 w-4 text-emerald-400" />
                          <span>Search Directory Network</span>
                        </Link>
                      </div>

                      <div className="mt-1 border-t border-slate-800 pt-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-bold text-rose-400 transition-colors hover:bg-rose-950/50"
                        >
                          <LogOut className="h-4 w-4 text-rose-400" />
                          <span>Sign Out / Switch User</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg px-3.5 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white sm:text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-emerald-500/20 active:scale-95 sm:text-sm"
                  >
                    <span>Register</span>
                    <ArrowRight className="hidden h-3.5 w-3.5 text-slate-950 sm:inline" />
                  </Link>
                </div>
              )}

              <button
                className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white lg:hidden"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-2 border-b border-slate-800 bg-slate-900 px-4 py-4 shadow-2xl lg:hidden">
          <nav className="space-y-1">
            {MOBILE_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-sm font-bold transition-colors ${
                  isActive(link.href)
                    ? "border border-emerald-500/40 bg-emerald-950/80 text-emerald-300"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <link.icon className="h-4 w-4 text-emerald-400" />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            {!session ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-center text-sm font-bold text-slate-950 shadow-md hover:bg-emerald-400"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/pass"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700"
                >
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <span>Virtual Alumni Card</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-800/40 bg-rose-950/50 py-2.5 text-sm font-bold text-rose-300 hover:bg-rose-900/50"
                >
                  <LogOut className="h-4 w-4 text-rose-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
