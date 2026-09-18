"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  CheckCircle2,
  QrCode,
  Download,
  Video,
  Share2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Users,
  Check,
  Award,
  HelpCircle,
  Shirt,
  Info,
  ChevronDown,
  ChevronUp,
  PartyPopper,
  GraduationCap,
} from "lucide-react";
import { useRegisterForEvent } from "@/hooks/public/useEventActions";
import { useApp } from "@/lib/public/context";

export interface EventDetail {
  id: string;
  title: string;
  date: string;
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
  dressCode: string | null;
  highlights: string[] | null;
  faqs: { question: string; answer: string }[] | null;
  ticketPrice: string;
  currency: string;
  capacity: number;
  registeredCount: number;
  registered: boolean;
}

export interface RelatedEvent {
  id: string;
  title: string;
  displayDate: string;
  description: string;
  location: string;
  ticketPrice: string;
  currency: string;
}

function buildIcs(event: EventDetail) {
  const start = new Date(event.date);
  const dt = start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IPAM Alumni Association//Events//EN",
    "BEGIN:VEVENT",
    `DTSTART:${dt}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, " ")}`,
    `LOCATION:${event.location}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export default function EventDetailView({ event, relatedEvents }: { event: EventDetail; relatedEvents: RelatedEvent[] }) {
  const { session } = useApp();
  const { register, loading, error } = useRegisterForEvent(event.id);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadedCalendar, setDownloadedCalendar] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const full = event.registeredCount >= event.capacity;
  const percentageFilled = Math.min(100, Math.round((event.registeredCount / event.capacity) * 100));

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Join me at "${event.title}" on ${event.displayDate} via the IPAM Alumni Network!`,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
    } finally {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }

  function handleDownloadIcs() {
    const blob = new Blob([buildIcs(event)], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    setDownloadedCalendar(true);
    setTimeout(() => setDownloadedCalendar(false), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-800">
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white shadow-xs backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-hidden text-xs text-slate-500 sm:text-sm">
            <Link href="/" className="shrink-0 font-medium transition-colors hover:text-emerald-700">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <Link href="/events" className="shrink-0 font-medium transition-colors hover:text-emerald-700">
              Events &amp; Summits
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="max-w-[200px] truncate font-semibold text-slate-900 sm:max-w-xs md:max-w-md">{event.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/events"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Events</span>
            </Link>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 sm:text-sm"
              title="Share Event"
            >
              {copiedLink ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-slate-500" />
                  <span className="hidden md:inline">Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero header card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8 lg:p-10">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Sparkles className="h-3 w-3 text-emerald-600" />
                  {event.category.replace(/_/g, " ")}
                </span>
                {event.isVirtual ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                    <Video className="h-3.5 w-3.5 text-teal-600" />
                    Global Virtual Stream
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    In-Person Gathering
                  </span>
                )}
                {event.registered && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    RSVP Confirmed
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-[38px]">
                {event.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:text-sm">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{event.displayDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0 text-slate-400" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="max-w-xs truncate text-slate-700">{event.location}</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <Ticket className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{Number(event.ticketPrice) === 0 ? "Free Alumni Pass" : `${event.ticketPrice} ${event.currency}`}</span>
                </div>
              </div>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
              <a
                href="#registration-hub"
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3.5 text-center text-sm font-extrabold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-98"
              >
                <Ticket className="h-4 w-4" />
                <span>{event.registered ? "View Digital Pass" : "RSVP & Register"}</span>
              </a>
              <button
                onClick={handleDownloadIcs}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:bg-slate-50 sm:text-sm"
              >
                <Download className="h-4 w-4 text-slate-400" />
                <span>{downloadedCalendar ? "Calendar Saved!" : "Add to Calendar (.ics)"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-8 lg:col-span-2">
            <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                <Info className="h-5 w-5 text-emerald-600" />
                <h2>About This Gathering</h2>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 sm:text-base">{event.description}</p>
            </div>

            {event.highlights && event.highlights.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h2>Summit Highlights &amp; Features</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {event.highlights.map((hl, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span className="text-xs font-semibold leading-snug text-slate-700 sm:text-sm">{hl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.agenda && event.agenda.length > 0 && (
              <div className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-lg font-extrabold text-slate-900 sm:text-xl">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <h2>Official Event Program &amp; Timeline</h2>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                    {event.agenda.length} Scheduled Blocks
                  </span>
                </div>
                <div className="relative space-y-4 before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                  {event.agenda.map((item, idx) => (
                    <div key={idx} className="group relative flex items-start gap-4 pl-8">
                      <div className="absolute left-2 mt-1 h-3.5 w-3.5 rounded-full border-2 border-emerald-600 bg-white shadow-2xs transition-transform group-hover:scale-125" />
                      <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 transition-all group-hover:border-emerald-300">
                        <span className="mb-1 block font-mono text-xs font-bold text-emerald-700">{item.time}</span>
                        <h4 className="text-sm font-bold text-slate-900 sm:text-base">{item.activity}</h4>
                        {item.speaker && <p className="mt-1 text-xs font-medium text-slate-500">Speaker: {item.speaker}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.speakers && event.speakers.length > 0 && (
              <div className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <h2>Featured Keynote Speakers &amp; Alumni Leaders</h2>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {event.speakers.map((sp, idx) => (
                    <div key={idx} className="flex flex-col justify-between space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5">
                      <div className="flex items-center gap-3.5">
                        {sp.image ? (
                          <img src={sp.image} alt={sp.name} className="h-13 w-13 shrink-0 rounded-2xl border-2 border-emerald-600 object-cover" />
                        ) : (
                          <div className="h-13 w-13 flex shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-600 bg-emerald-100 text-lg font-bold text-emerald-700">
                            {sp.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-900 sm:text-base">{sp.name}</h4>
                          <p className="text-xs font-medium text-emerald-700">{sp.title}</p>
                        </div>
                      </div>
                      {sp.bio && (
                        <p className="border-t border-slate-200/60 pt-2.5 text-xs leading-relaxed text-slate-500">{sp.bio}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <h2>Venue &amp; Access Logistics</h2>
              </div>
              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Location</span>
                  <span className="text-xs font-bold text-emerald-700">{event.isVirtual ? "Virtual Auditorium" : "On-Site Venue"}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{event.location}</p>
                {event.venueDetails && (
                  <p className="border-t border-slate-200/60 pt-1 text-xs leading-relaxed text-slate-600">{event.venueDetails}</p>
                )}
              </div>
              {event.dressCode && (
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
                  <Shirt className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-slate-600">
                    <strong className="font-bold text-slate-900">Suggested Attire:</strong> {event.dressCode}
                  </span>
                </div>
              )}
            </div>

            {event.faqs && event.faqs.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-lg font-extrabold text-slate-900 sm:text-xl">
                  <HelpCircle className="h-5 w-5 text-emerald-600" />
                  <h2>Frequently Asked Questions</h2>
                </div>
                <div className="space-y-3">
                  {event.faqs.map((faq, idx) => {
                    const isExpanded = expandedFaq === idx;
                    return (
                      <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
                        <button
                          onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                          className="flex w-full items-center justify-between gap-3 p-4 text-left text-xs font-bold text-slate-900 sm:text-sm"
                        >
                          <span>{faq.question}</span>
                          {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />}
                        </button>
                        {isExpanded && (
                          <p className="px-4 pb-4 text-xs leading-relaxed text-slate-600 sm:text-sm">{faq.answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-32">
            <div id="registration-hub" className="space-y-5 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-7">
              {event.registered ? (
                <div className="space-y-5">
                  <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white shadow-md">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          Verified Digital Admission Pass
                        </span>
                        <h3 className="mt-0.5 text-base font-bold text-white">{event.title}</h3>
                      </div>
                      <div className="shrink-0 rounded-lg bg-white p-2">
                        <QrCode className="h-8 w-8 text-black" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 text-[11px]">
                      <div>
                        <span className="block text-slate-400">ATTENDEE</span>
                        <span className="font-bold text-white">{session?.profile?.name ?? session?.email}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">STUDENT ID</span>
                        <span className="font-bold text-white">{session?.studentId}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">DATE &amp; TIME</span>
                        <span className="font-bold text-white">{event.displayDate}</span>
                      </div>
                      <div>
                        <span className="block text-slate-400">PASS REF</span>
                        <span className="font-mono font-bold text-emerald-400">TKT-{event.id.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-slate-800 pt-2">
                      <button
                        onClick={handleDownloadIcs}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 text-xs font-extrabold text-slate-950 shadow-xs transition-colors hover:bg-emerald-400"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{downloadedCalendar ? "Calendar Saved!" : "Download Calendar Pass (.ics)"}</span>
                      </button>
                      {event.isVirtual && event.virtualLink && (
                        <a
                          href={event.virtualLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 py-2.5 text-center text-xs font-bold text-white transition-colors hover:bg-slate-700"
                        >
                          <Video className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Join Virtual Stream on Event Day</span>
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Registration Confirmed</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      A confirmation ticket with calendar invite has been delivered to <strong>{session?.email}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                      <Sparkles className="h-3 w-3 text-emerald-600" />
                      Online Registration
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Reserve Your Spot</h3>
                    <p className="mt-0.5 text-xs text-slate-500">Fast-track admission for verified alumni and distinguished guests</p>
                  </div>

                  {session ? (
                    <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5">
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">Primary Registrant</span>
                      <div className="flex items-center gap-3">
                        {session.profile?.avatar ? (
                          <img src={session.profile.avatar} alt={session.profile.name} className="h-10 w-10 rounded-full border-2 border-emerald-600 object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-100 text-sm font-bold text-emerald-700">
                            {(session.profile?.name ?? session.email).charAt(0)}
                          </div>
                        )}
                        <div className="text-xs">
                          <p className="font-bold text-slate-900">{session.profile?.name ?? session.email}</p>
                          {session.profile && (
                            <p className="text-slate-500">
                              {session.profile.degree} • Class of &apos;{String(session.profile.classYear).slice(-2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 border-t border-slate-200/60 pt-1 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Verified Alumni ID: {session.studentId}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-700">Sign in with your verified alumni account to register.</p>
                      <Link href="/login" className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                        Sign In to Register
                      </Link>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-900">Admission</p>
                    <p className="text-xs text-slate-500">
                      {Number(event.ticketPrice) === 0 ? "Free Alumni Pass" : `${event.ticketPrice} ${event.currency} per seat`}
                    </p>
                  </div>

                  {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

                  {session && (
                    <button
                      onClick={() => register()}
                      disabled={loading || full}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-extrabold text-white shadow-xs transition-all hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <Ticket className="h-4 w-4" />
                      <span>{full ? "Event Full" : loading ? "Confirming Registration..." : "Confirm Free RSVP Registration"}</span>
                    </button>
                  )}

                  <p className="text-center text-[11px] text-slate-500">Admission passes are non-transferable without prior verification.</p>
                </div>
              )}
            </div>

            <div className="space-y-3.5 rounded-3xl border border-slate-200/90 bg-white p-6 text-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-sm font-extrabold text-slate-900">Registration Capacity</span>
                <span className="font-bold text-emerald-700">
                  {event.registeredCount} / {event.capacity}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  <div className="h-2 rounded-full bg-emerald-600 transition-all duration-500" style={{ width: `${percentageFilled}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{percentageFilled}% Booked</span>
                  <span>{Math.max(0, event.capacity - event.registeredCount)} spots remaining</span>
                </div>
              </div>
              <div className="space-y-2 border-t border-slate-100 pt-2">
                <div className="flex justify-between text-slate-500">
                  <span>Format:</span>
                  <span className="font-bold text-slate-800">{event.isVirtual ? "Virtual Stream" : "In-Person"}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Organizer:</span>
                  <span className="font-bold text-slate-800">IPAM Alumni Relations</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {relatedEvents.length > 0 && (
          <div className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
            <div className="flex items-end justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                  <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Explore More</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight text-slate-900">More Events in the Alumni Calendar</h3>
              </div>
              <Link href="/events" className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 sm:text-sm">
                <span>View Full Calendar</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {relatedEvents.map((otherEvent, idx) => (
                <Link
                  key={otherEvent.id}
                  href={`/events/${otherEvent.id}`}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                >
                  <div
                    className={`relative flex h-32 items-center justify-center border-b border-slate-200/80 text-slate-900 ${
                      idx % 2 === 0 ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100" : "bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-100"
                    }`}
                  >
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-3 shadow-2xs">
                      {idx % 2 === 0 ? <PartyPopper className="h-6 w-6 text-emerald-700" /> : <GraduationCap className="h-6 w-6 text-teal-700" />}
                    </div>
                    {Number(otherEvent.ticketPrice) > 0 ? (
                      <span className="absolute right-2.5 top-2.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-0.5 text-[11px] font-extrabold text-slate-900 shadow-2xs">
                        {otherEvent.ticketPrice} {otherEvent.currency}
                      </span>
                    ) : (
                      <span className="absolute right-2.5 top-2.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800 shadow-2xs">
                        Free Pass
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-4 p-5">
                    <div>
                      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{otherEvent.displayDate}</span>
                      </div>
                      <h4 className="line-clamp-1 text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700">{otherEvent.title}</h4>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{otherEvent.description}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs">
                      <span className="max-w-[150px] truncate text-slate-500">{otherEvent.location}</span>
                      <span className="flex shrink-0 items-center gap-0.5 font-bold text-emerald-700 transition-transform group-hover:translate-x-1">
                        View Event &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
