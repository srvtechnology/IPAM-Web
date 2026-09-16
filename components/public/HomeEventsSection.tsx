import Link from "next/link";
import { PartyPopper, GraduationCap, Users, Calendar, MapPin, ArrowRight, Sparkles } from "lucide-react";

export interface HomeEventItem {
  id: string;
  title: string;
  displayDate: string;
  description: string;
  location: string;
  ticketPrice: string;
  currency: string;
}

const EVENT_ICONS = [
  <PartyPopper key="0" className="h-8 w-8 text-emerald-700" />,
  <GraduationCap key="1" className="h-8 w-8 text-teal-700" />,
  <Users key="2" className="h-8 w-8 text-emerald-700" />,
];

const HEADER_BG = [
  "bg-emerald-50 border-b border-emerald-100",
  "bg-teal-50 border-b border-teal-100",
  "bg-slate-100 border-b border-slate-200",
];

export default function HomeEventsSection({ events }: { events: HomeEventItem[] }) {
  const featuredEvents = events.slice(0, 3);

  return (
    <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Gatherings & Summits</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Recent & Upcoming Events
          </h2>
          <p className="text-sm text-slate-600">
            Connect with fellow alumni at galas, professional webinars, and regional meetups.
          </p>
        </div>
        <Link
          href="/events"
          className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-emerald-700 hover:text-emerald-800"
        >
          <span>Explore All Events</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {featuredEvents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredEvents.map((event, index) => (
            <div
              key={event.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
            >
              <div className={`relative flex h-40 items-center justify-center text-slate-900 sm:h-44 ${HEADER_BG[index % HEADER_BG.length]}`}>
                <div className="rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-xs">
                  {EVENT_ICONS[index % EVENT_ICONS.length]}
                </div>
                {Number(event.ticketPrice) > 0 ? (
                  <span className="absolute right-3 top-3 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-extrabold text-slate-900 shadow-xs">
                    {event.ticketPrice} {event.currency}
                  </span>
                ) : (
                  <span className="absolute right-3 top-3 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-xs">
                    Free / Virtual
                  </span>
                )}
              </div>

              <div className="flex flex-grow flex-col justify-between p-6">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
                    <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{event.displayDate}</span>
                  </div>
                  <h3 className="mb-2.5 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 md:text-xl">
                    {event.title}
                  </h3>
                  <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {event.description}
                  </p>
                </div>

                <div>
                  <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  <Link
                    href={`/events/${event.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-extrabold text-slate-800 shadow-xs transition-all duration-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white sm:text-sm"
                  >
                    <span>View Event Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No upcoming events yet.</p>
      )}
    </section>
  );
}
