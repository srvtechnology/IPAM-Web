"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, GraduationCap } from "lucide-react";
import { useApp } from "@/lib/public/context";

const NAV_LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/jobs", label: "Jobs" },
  { href: "/events", label: "Events" },
  { href: "/businesses", label: "Businesses" },
  { href: "/giving", label: "Giving" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const { session } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
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

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition hover:text-emerald-700 ${
                pathname === link.href ? "text-emerald-700" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <>
              <Link href="/pass" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
                {session.profile?.name ?? session.email}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-emerald-700">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Join
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="py-1.5 text-sm font-medium text-slate-700">
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link href="/pass" className="py-1.5 text-sm font-medium text-slate-700">
                  My Virtual Pass
                </Link>
                <button onClick={handleLogout} className="py-1.5 text-left text-sm font-medium text-slate-700">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="py-1.5 text-sm font-medium text-slate-700">
                  Sign in
                </Link>
                <Link href="/register" className="py-1.5 text-sm font-semibold text-emerald-700">
                  Join
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
