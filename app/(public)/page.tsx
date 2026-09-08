import Link from "next/link";
import { db } from "@/lib/db";
import { Users, Briefcase, CalendarDays, Building2, ArrowRight } from "lucide-react";

export default async function HomePage() {
  const [alumniCount, jobs, events, leaders, businesses] = await Promise.all([
    db.alumniMember.count(),
    db.jobOpening.findMany({ orderBy: { postedDate: "desc" }, take: 3 }),
    db.alumniEvent.findMany({ orderBy: { date: "asc" }, take: 3 }),
    db.leadershipMember.findMany({ take: 3 }),
    db.alumniBusiness.findMany({ where: { featured: true }, take: 3 }),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            The Official Global Network for IPAM Alumni
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-emerald-100">
            Connect with graduates, discover opportunities, and stay part of the Institute of
            Public Administration &amp; Management community, wherever you are in the world.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              Join the Network
            </Link>
            <Link
              href="/directory"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse Directory
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="mx-auto -mt-10 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:grid-cols-4">
          <Metric icon={<Users className="h-5 w-5" />} label="Alumni" value={alumniCount} />
          <Metric icon={<Briefcase className="h-5 w-5" />} label="Open Jobs" value={jobs.length} />
          <Metric icon={<CalendarDays className="h-5 w-5" />} label="Upcoming Events" value={events.length} />
          <Metric icon={<Building2 className="h-5 w-5" />} label="Alumni Businesses" value={businesses.length} />
        </div>
      </section>

      {/* Leadership */}
      {leaders.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeading title="Executive Leadership" subtitle="Meet the alumni driving our association forward." />
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {leaders.map((l) => (
              <div key={l.id} className="rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100" />
                <h3 className="mt-4 font-bold text-slate-900">{l.name}</h3>
                <p className="text-sm text-emerald-700">{l.role}</p>
                <p className="mt-2 text-sm text-slate-500">{l.bio}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Latest jobs */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <SectionHeading title="Latest Job Openings" subtitle="Opportunities posted by fellow alumni." />
            <Link href="/jobs" className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {jobs.map((j) => (
              <Link
                key={j.id}
                href={`/jobs/${j.id}`}
                className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{j.company}</p>
                <h3 className="mt-1 font-bold text-slate-900">{j.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{j.location} · {j.type.replace("_", " ")}</p>
              </Link>
            ))}
            {jobs.length === 0 && <p className="text-sm text-slate-500">No job openings yet.</p>}
          </div>
        </div>
      </section>

      {/* Upcoming events */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <SectionHeading title="Upcoming Events" subtitle="Galas, workshops, and regional meetups." />
            <Link href="/events" className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.id}`}
                className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{e.category.replace("_", " ")}</p>
                <h3 className="mt-1 font-bold text-slate-900">{e.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{e.displayDate} · {e.location}</p>
              </Link>
            ))}
            {events.length === 0 && <p className="text-sm text-slate-500">No upcoming events yet.</p>}
          </div>
        </div>
      </section>

      {/* Business spotlight */}
      {businesses.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Alumni Business Spotlight" subtitle="Founded and led by fellow graduates." />
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {businesses.map((b) => (
                <Link
                  key={b.id}
                  href={`/businesses/${b.id}`}
                  className="rounded-2xl border border-slate-200 p-6 transition hover:border-emerald-300 hover:shadow-md"
                >
                  <h3 className="font-bold text-slate-900">{b.name}</h3>
                  <p className="mt-1 text-sm text-emerald-700">{b.industry}</p>
                  <p className="mt-2 text-sm text-slate-500">{b.tagline ?? b.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <div className="text-emerald-700">{icon}</div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-xs font-medium text-slate-500">{label}</div>
    </div>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
