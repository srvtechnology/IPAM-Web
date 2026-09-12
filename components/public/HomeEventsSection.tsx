import Link from "next/link";
import { PartyPopper, GraduationCap, Users, Calendar, MapPin, ArrowRight } from "lucide-react";

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
  <PartyPopper key="0" className="h-10 w-10 text-white" />,
  <GraduationCap key="1" className="h-10 w-10 text-white" />,
  <Users key="2" className="h-10 w-10 text-white" />,
];

const HEADER_BG = [
  "bg-gradient-to-br from-emerald-600 to-teal-700",
  "bg-gradient-to-br from-slate-800 to-slate-950",
  "bg-gradient-to-br from-teal-600 to-emerald-800",
];

export default function HomeEventsSection({ events }: { events: HomeEventItem[] }) {
  const featuredEvents = events.slice(0, 3);

  return (
    <section className="border-y border-slate-200/80 bg-white py-12 shadow-sm md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row md:mb-10">
          <div className="text-center sm:text-left">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
              Gatherings & Summits
            </div>
            <h2 className="mb-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl md:text-[34px]">
              Recent & Upcoming Events
            </h2>
            <p className="text-sm text-slate-600 md:text-base">
              Connect with fellow alumni at galas, professional webinars, and regional meetups.
            </p>
          </div>
          <Link
            href="/events"
            className="group flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-bold text-emerald-700 hover:text-emerald-900 md:text-base"
          >
            <span>Explore All Events</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {featuredEvents.map((event, index) => (
              <div
                key={event.id}
                className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-xl"
              >
                <div className={`relative flex h-40 items-center justify-center text-white transition-transform duration-500 group-hover:scale-[1.02] sm:h-44 ${HEADER_BG[index % HEADER_BG.length]}`}>
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3.5 shadow-sm backdrop-blur-sm">
                    {EVENT_ICONS[index % EVENT_ICONS.length]}
                  </div>
                  {Number(event.ticketPrice) > 0 ? (
                    <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {event.ticketPrice} {event.currency}
                    </span>
                  ) : (
                    <span className="absolute right-3 top-3 rounded-full border border-white/20 bg-emerald-700/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                      Free / Virtual
                    </span>
                  )}
                </div>

                <div className="flex flex-grow flex-col justify-between p-6">
                  <div>
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{event.displayDate}</span>
                    </div>
                    <h3 className="mb-2.5 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 md:text-xl">
                      {event.title}
                    </h3>
                    <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {event.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">{event.location}</span>
                    </div>

                    <Link
                      href={`/events/${event.id}`}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No upcoming events yet.</p>
        )}
      </div>
    </section>
  );
}
