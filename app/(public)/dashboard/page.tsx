import { redirect } from "next/navigation";
import Link from "next/link";
import { getAlumniSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  GraduationCap,
  CreditCard,
  Sparkles,
  User,
  ShieldCheck,
  Briefcase,
  Search,
  Bell,
  ArrowRight,
  QrCode,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import AlumniNotificationsView from "@/components/public/notifications/AlumniNotificationsView";

export const metadata = {
  title: "Alumni Dashboard & Announcements | IPAM Alumni Portal",
  description: "Official alumni dashboard with administrative dispatches, notifications, and portal services.",
};

export default async function AlumniDashboardPage() {
  const session = await getAlumniSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: {
      profile: true,
    },
  });

  if (!user || user.status !== "APPROVED") {
    redirect("/");
  }

  const [savedJobsCount, applicationsCount] = await Promise.all([
    db.savedJob.count({ where: { userId: user.id } }),
    db.jobOpeningApplication.count({ where: { alumniUserId: user.id } }),
  ]);

  const userName = user.profile?.name || user.email.split("@")[0];
  const classYear = user.profile?.classYear;
  const avatar = user.profile?.avatar;

  return (
    <div className="min-h-screen bg-slate-950 py-10 text-slate-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Welcome & Identity Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={userName}
                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-2 ring-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-emerald-950 text-2xl font-black text-emerald-300 ring-2 ring-emerald-500 shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-sm ring-2 ring-slate-900">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    Welcome, {userName}
                  </h1>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                    Verified Member
                  </span>
                </div>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {user.profile?.currentRole
                    ? `${user.profile.currentRole} ${user.profile.company ? `at ${user.profile.company}` : ""}`
                    : "IPAM Alumni Community Member"}
                  {classYear ? ` • Class of '${String(classYear).slice(-2)}` : ""}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400">
                    ID: {user.studentId}
                  </span>
                  <span>•</span>
                  <span>Tier: {user.membershipTier.replace(/_/g, " ")}</span>
                  <span>•</span>
                  <span>{user.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Link
                href="/pass"
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-emerald-400 hover:shadow-emerald-500/20 active:scale-95 sm:text-sm"
              >
                <QrCode className="h-4 w-4" />
                <span>Digital Pass</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-200 transition-colors hover:bg-slate-700 hover:text-white sm:text-sm"
              >
                <User className="h-4 w-4 text-emerald-400" />
                <span>Edit Profile</span>
              </Link>
              <Link
                href="/subscription"
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-950/50 px-4 py-2.5 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-900/50 sm:text-sm"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Subscription</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Portal Services Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Link
            href="/pass"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-emerald-500/40 hover:bg-slate-900 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 transition-transform group-hover:scale-105">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-extrabold text-white group-hover:text-emerald-300">
              Virtual ID Card
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Active biometric pass &amp; QR verification
            </p>
          </Link>

          <Link
            href="/jobs/manage?tab=applied"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-emerald-500/40 hover:bg-slate-900 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20 transition-transform group-hover:scale-105">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-extrabold text-white group-hover:text-blue-300">
              Job Applications
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {applicationsCount} applied • {savedJobsCount} saved openings
            </p>
          </Link>

          <Link
            href="/directory"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-emerald-500/40 hover:bg-slate-900 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20 transition-transform group-hover:scale-105">
              <Search className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-extrabold text-white group-hover:text-teal-300">
              Alumni Directory
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Search 5,400+ verified worldwide peers
            </p>
          </Link>

          <Link
            href="/events"
            className="group rounded-2xl border border-slate-800 bg-slate-900/70 p-4 transition-all hover:border-emerald-500/40 hover:bg-slate-900 shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 ring-1 ring-indigo-500/20 transition-transform group-hover:scale-105">
              <Calendar className="h-5 w-5" />
            </div>
            <h3 className="mt-3 text-sm font-extrabold text-white group-hover:text-indigo-300">
              Events &amp; Galas
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              Upcoming networking &amp; webinars
            </p>
          </Link>
        </div>

        {/* Main Section: Administrative Dispatches & Broadcast Messages */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 shadow-2xl">
          <AlumniNotificationsView />
        </div>
      </div>
    </div>
  );
}
