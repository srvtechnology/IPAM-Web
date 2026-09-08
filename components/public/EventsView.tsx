import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";

export interface EventListItem {
  id: string;
  title: string;
  displayDate: string;
  time: string;
  location: string;
  isVirtual: boolean;
  category: string;
  capacity: number;
  registeredCount: number;
}

export default function EventsView({ events }: { events: EventListItem[] }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900">Alumni Events</h1>
      <p className="mt-1 text-slate-500">Galas, webinars, regional meetups, and career workshops.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {e.category.replace(/_/g, " ")}
            </span>
            <h3 className="mt-3 font-bold text-slate-900">{e.title}</h3>
            <div className="mt-3 space-y-1.5 text-sm text-slate-500">
              <p className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{e.displayDate} · {e.time}</p>
              <p className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{e.isVirtual ? "Virtual" : e.location}</p>
              <p className="flex items-center gap-1.5"><Users className="h-4 w-4" />{e.registeredCount}/{e.capacity} registered</p>
            </div>
          </Link>
        ))}
        {events.length === 0 && <p className="text-sm text-slate-500">No events scheduled yet.</p>}
      </div>
    </div>
  );
}
