"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users, Ticket } from "lucide-react";
import { useRegisterForEvent } from "@/hooks/public/useEventActions";
import { useApp } from "@/lib/public/context";

export interface EventDetail {
  id: string;
  title: string;
  displayDate: string;
  time: string;
  location: string;
  venueDetails: string | null;
  isVirtual: boolean;
  virtualLink: string | null;
  category: string;
  description: string;
  agenda: { time: string; activity: string; speaker?: string }[] | null;
  speakers: { name: string; title: string; bio?: string; image?: string }[] | null;
  ticketPrice: string;
  currency: string;
  capacity: number;
  registeredCount: number;
  registered: boolean;
}

export default function EventDetailView({ event }: { event: EventDetail }) {
  const { session } = useApp();
  const { register, loading, error } = useRegisterForEvent(event.id);
  const full = event.registeredCount >= event.capacity;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 text-slate-800">
      <Link href="/events" className="flex items-center gap-1.5 text-sm font-bold text-slate-600 transition-colors hover:text-emerald-700">
        <ArrowLeft className="h-4 w-4 text-slate-500" /> Back to Events
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs">
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
          {event.category.replace(/_/g, " ")}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold text-slate-900">{event.title}</h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1 font-semibold text-emerald-700"><CalendarDays className="h-4 w-4 text-emerald-600" />{event.displayDate} · {event.time}</span>
          <span className="flex items-center gap-1 text-slate-700"><MapPin className="h-4 w-4 text-emerald-600" />{event.isVirtual ? "Virtual Auditorium" : event.location}</span>
          <span className="flex items-center gap-1"><Users className="h-4 w-4 text-slate-400" />{event.registeredCount}/{event.capacity} registered</span>
          <span className="flex items-center gap-1 font-semibold text-slate-900"><Ticket className="h-4 w-4 text-emerald-600" />{Number(event.ticketPrice) > 0 ? `${event.ticketPrice} ${event.currency}` : "Free"}</span>
        </div>

        <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">{event.description}</p>

        {event.agenda && event.agenda.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Agenda</h2>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              {event.agenda.map((a, i) => (
                <li key={i}><span className="font-medium text-slate-800">{a.time}</span> — {a.activity}{a.speaker ? ` (${a.speaker})` : ""}</li>
              ))}
            </ul>
          </section>
        )}

        {event.speakers && event.speakers.length > 0 && (
          <section className="mt-6">
            <h2 className="font-bold text-slate-900">Speakers</h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {event.speakers.map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3">
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-12 w-12 flex-shrink-0 rounded-2xl border-2 border-emerald-600 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 font-bold text-emerald-700">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {error && <div className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="mt-6">
          {event.registered ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-2.5 text-sm font-bold text-emerald-700">
              Registration Confirmed
            </span>
          ) : (
            <button
              onClick={() => (session ? register() : (window.location.href = "/login"))}
              disabled={loading || full}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-extrabold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-60"
            >
              {full ? "Event full" : loading ? "Registering…" : "Register"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
