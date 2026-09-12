"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Users, Video, Ticket, CheckCircle2 } from "lucide-react";

export interface EventListItem {
  id: string;
  title: string;
  displayDate: string;
  time: string;
  location: string;
  isVirtual: boolean;
  category: string;
  ticketPrice: string;
  currency: string;
  capacity: number;
  registeredCount: number;
  isRegistered: boolean;
}

const CATEGORIES = ["all", "GALA", "WEBINAR", "REGIONAL_MEETUP", "NETWORKING", "CAREER_WORKSHOP"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  all: "All Event Types",
  GALA: "Gala",
  WEBINAR: "Webinar",
  REGIONAL_MEETUP: "Regional Meetup",
  NETWORKING: "Networking",
  CAREER_WORKSHOP: "Career Workshop",
};

export default function EventsView({ events }: { events: EventListItem[] }) {
  const [category, setCategory] = useState<string>("all");
  const [venueType, setVenueType] = useState<"all" | "virtual" | "in-person">("all");

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesCategory = category === "all" || e.category === category;
      const matchesVenue =
        venueType === "all" || (venueType === "virtual" ? e.isVirtual : !e.isVirtual);
      return matchesCategory && matchesVenue;
    });
  }, [events, category, venueType]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-black text-slate-900">Alumni Events</h1>
      <p className="mt-1 text-slate-500">Galas, webinars, regional meetups, and career workshops.</p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all sm:text-sm ${
                category === c ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {(["all", "virtual", "in-person"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVenueType(v)}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${
                venueType === v ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {v === "all" ? "All" : v === "virtual" ? "Virtual Only" : "In-Person"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-emerald-300 hover:shadow-lg"
          >
            <div className="relative flex h-24 items-center justify-between bg-gradient-to-br from-emerald-700 to-teal-800 px-4 text-white">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                {CATEGORY_LABELS[e.category] ?? e.category.replace(/_/g, " ")}
              </span>
              {Number(e.ticketPrice) > 0 ? (
                <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-bold backdrop-blur-sm">
                  {e.ticketPrice} {e.currency}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-bold">Free</span>
              )}
              {e.isRegistered && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 shadow-sm">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> RSVP&apos;d
                </span>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-slate-900">{e.title}</h3>
              <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                <p className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{e.displayDate} · {e.time}</p>
                <p className="flex items-center gap-1.5">
                  {e.isVirtual ? <Video className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  {e.isVirtual ? "Virtual" : e.location}
                </p>
                <p className="flex items-center gap-1.5"><Users className="h-4 w-4" />{e.registeredCount}/{e.capacity} registered</p>
              </div>
              <div
                className={`mt-4 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold ${
                  e.isRegistered ? "border border-emerald-300 bg-emerald-50 text-emerald-800" : "bg-emerald-600 text-white"
                }`}
              >
                <Ticket className="h-3.5 w-3.5" />
                {e.isRegistered ? "View Event Pass" : "RSVP & Get Tickets"}
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg font-bold text-slate-950">No events match your filters</p>
            <p className="mt-1 text-sm text-slate-500">Try a different event type or venue filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
