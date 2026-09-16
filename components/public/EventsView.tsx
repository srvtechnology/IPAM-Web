"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  PartyPopper,
  GraduationCap,
  Video,
  CheckCircle2,
  Ticket,
  Sparkles,
  ArrowRight,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Send,
  Check,
  Building2,
} from "lucide-react";
import { useApp } from "@/lib/public/context";
import { useCreateEventProposal } from "@/hooks/public/useCreateEventProposal";

export interface EventListItem {
  id: string;
  title: string;
  displayDate: string;
  time: string;
  location: string;
  venueDetails: string | null;
  isVirtual: boolean;
  category: string;
  description: string;
  dressCode: string | null;
  highlights: string[] | null;
  ticketPrice: string;
  currency: string;
  capacity: number;
  registeredCount: number;
  isRegistered: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  GALA: "Gala",
  WEBINAR: "Webinar",
  REGIONAL_MEETUP: "Regional Meetup",
  NETWORKING: "Networking",
  CAREER_WORKSHOP: "Career Workshop",
};

const PROPOSAL_CATEGORIES = ["REGIONAL_MEETUP", "WEBINAR", "CAREER_WORKSHOP", "NETWORKING", "GALA"] as const;

const FAQS = [
  {
    q: "Do I need my IPAM Alumni Virtual ID Card to enter in-person events?",
    a: "Yes, your digital or physical Alumni ID card provides verified priority entry, discounted door tickets, and access to exclusive VIP alumni lounges at all campus and hotel venues.",
  },
  {
    q: "How and when do I receive virtual stream links for webinars?",
    a: "Once you register for any virtual session, your registration is confirmed instantly. The direct private link and calendar invite appear on your event pass and are emailed ahead of the broadcast.",
  },
  {
    q: "Can I invite a non-alumni guest or colleague?",
    a: "Most webinars and galas welcome registered guests. Some closed mentorship sessions may remain alumni-exclusive.",
  },
  {
    q: "What is the ticket refund and cancellation policy?",
    a: "Paid tickets can be fully refunded up to 7 days before the event start date. You can also reassign or transfer your pass to another verified alumnus at zero fee.",
  },
];

function getHeaderBg(index: number) {
  const patterns = [
    "bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100",
    "bg-gradient-to-br from-sky-50 via-indigo-50 to-slate-100",
    "bg-gradient-to-br from-amber-50 via-orange-50 to-slate-100",
    "bg-gradient-to-br from-purple-50 via-pink-50 to-slate-100",
  ];
  return patterns[index % patterns.length];
}

function getEventIcon(category: string) {
  if (category === "GALA") return <PartyPopper className="h-7 w-7 text-amber-600" />;
  if (category === "WEBINAR") return <Video className="h-7 w-7 text-teal-600" />;
  if (category === "CAREER_WORKSHOP") return <GraduationCap className="h-7 w-7 text-emerald-600" />;
  return <Users className="h-7 w-7 text-emerald-600" />;
}

export default function EventsView({ events }: { events: EventListItem[] }) {
  const { session } = useApp();
  const { createEventProposal, loading: proposalLoading, error: proposalError } = useCreateEventProposal();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "virtual" | "in-person">("all");
  const [showMyRsvpsOnly, setShowMyRsvpsOnly] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const [isProposingEvent, setIsProposingEvent] = useState(false);
  const [proposalSubmitted, setProposalSubmitted] = useState(false);
  const [proposalData, setProposalData] = useState({
    title: "",
    category: "REGIONAL_MEETUP" as (typeof PROPOSAL_CATEGORIES)[number],
    format: "In-Person",
    targetDate: "",
    location: "",
    description: "",
    organizerEmail: session?.email ?? "",
  });

  const categories = useMemo(() => {
    const cats = new Set(events.map((e) => e.category));
    return ["all", ...Array.from(cats)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === "" ||
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q);
      const matchesCat = selectedCategory === "all" || ev.category === selectedCategory;
      const matchesType = filterType === "all" || (filterType === "virtual" ? ev.isVirtual : !ev.isVirtual);
      const matchesRsvp = !showMyRsvpsOnly || ev.isRegistered;
      return matchesSearch && matchesCat && matchesType && matchesRsvp;
    });
  }, [events, searchQuery, selectedCategory, filterType, showMyRsvpsOnly]);

  const spotlightEvent = useMemo(() => events.find((e) => e.category === "GALA") ?? events[0], [events]);

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "all" || filterType !== "all" || showMyRsvpsOnly;

  function resetFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setFilterType("all");
    setShowMyRsvpsOnly(false);
  }

  async function handleProposalSubmit(e: FormEvent) {
    e.preventDefault();
    const result = await createEventProposal(proposalData);
    if (result) {
      setProposalSubmitted(true);
      setTimeout(() => {
        setIsProposingEvent(false);
        setProposalSubmitted(false);
        setProposalData({
          title: "",
          category: "REGIONAL_MEETUP",
          format: "In-Person",
          targetDate: "",
          location: "",
          description: "",
          organizerEmail: session?.email ?? "",
        });
      }, 2200);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-800">
      {/* Header banner */}
      <section className="relative flex min-h-[580px] w-full items-center overflow-hidden border-b border-slate-800 bg-slate-950 text-white md:min-h-[640px]">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/ipam_university_campus_1788350001937.jpg"
            alt="Institute of Public Administration and Management Campus"
            className="h-full w-full scale-105 transform object-cover object-center opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-emerald-950/80" />
          <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl space-y-6 px-4 py-16 sm:px-6 sm:py-20 md:py-24 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 shadow-xs backdrop-blur-md">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Official Calendar • IPAM Alumni Association Global Network</span>
          </div>

          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              Global Summits, Reunions & Professional Forums
            </h1>
            <p className="text-base leading-relaxed text-slate-300 sm:text-lg">
              Connect with world-class faculty, distinguished alumni, and international industry leaders. Register
              for grand galas, masterclasses, and regional chapter gatherings worldwide.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">{events.length}+</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Scheduled Events</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">
                {events.reduce((sum, e) => sum + e.registeredCount, 0)}+
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Registered Alumni</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">12+</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Global Chapters Hosting</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black text-emerald-400 sm:text-3xl">100%</div>
              <div className="mt-0.5 text-xs font-medium text-slate-400">Virtual Streams Included</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-10 max-w-7xl space-y-10 px-4 sm:mt-12 sm:space-y-12 sm:px-6 lg:px-8">
        {/* Spotlight flagship event */}
        {spotlightEvent && (
          <section className="group relative overflow-hidden rounded-3xl border border-slate-800/90 bg-slate-950 text-white shadow-xl">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src="/images/alumni_gala_event_1788454750646.jpg"
                alt={spotlightEvent.title}
                className="h-full w-full transform object-cover object-center opacity-35 transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/92 to-slate-950/75 lg:bg-gradient-to-r lg:from-slate-950/95 lg:via-slate-950/90 lg:to-slate-950/50" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] opacity-10 [background-size:24px_24px]" />
            </div>

            <div className="relative z-10 flex flex-col justify-between gap-3 border-b border-slate-800/80 px-6 pb-4 pt-6 sm:flex-row sm:items-center sm:px-10 sm:pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/80 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 shadow-xs backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Featured Flagship Gathering</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="tracking-wide">Priority Alumni Registration • Official Gala</span>
              </div>
            </div>

            <div className="relative z-10 flex flex-col items-start justify-between gap-8 p-6 sm:p-10 lg:flex-row lg:items-center lg:gap-10">
              <div className="max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-xs backdrop-blur-md">
                    <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                    {spotlightEvent.displayDate}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 px-3.5 py-1.5 text-xs font-bold text-slate-300 shadow-xs backdrop-blur-md">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {spotlightEvent.time}
                  </span>
                  {Number(spotlightEvent.ticketPrice) > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs">
                      {spotlightEvent.ticketPrice} {spotlightEvent.currency}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-xs">
                      Free Registration
                    </span>
                  )}
                  {spotlightEvent.dressCode && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                      {spotlightEvent.dressCode}
                    </span>
                  )}
                </div>

                <h2 className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                  {spotlightEvent.title}
                </h2>

                <p className="text-sm leading-relaxed text-slate-300 sm:text-base">{spotlightEvent.description}</p>

                <div className="flex items-start gap-2.5 text-xs text-slate-300 sm:text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white">{spotlightEvent.location}</span>
                    {spotlightEvent.venueDetails && (
                      <p className="mt-0.5 text-xs font-normal text-slate-400">{spotlightEvent.venueDetails}</p>
                    )}
                  </div>
                </div>

                {spotlightEvent.highlights && spotlightEvent.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {spotlightEvent.highlights.slice(0, 4).map((hl, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs text-slate-200 backdrop-blur-xs"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                        <span>{hl}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="max-w-md space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>RSVP Capacity</span>
                    <span className="text-emerald-300">
                      {spotlightEvent.registeredCount} / {spotlightEvent.capacity} Confirmed
                      {spotlightEvent.capacity - spotlightEvent.registeredCount > 0 && (
                        <span className="ml-1 font-normal text-slate-400">
                          ({spotlightEvent.capacity - spotlightEvent.registeredCount} remaining)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-slate-700/60 bg-slate-800/90">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round((spotlightEvent.registeredCount / spotlightEvent.capacity) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="w-full shrink-0 space-y-4 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-6 shadow-xl backdrop-blur-md sm:p-7 lg:w-80">
                <div className="space-y-2 border-b border-slate-800 pb-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Alumni Reservation</div>
                  <div className="text-2xl font-black text-white">
                    {Number(spotlightEvent.ticketPrice) > 0 ? (
                      <span>
                        {spotlightEvent.ticketPrice}{" "}
                        <span className="text-xs font-normal text-slate-400">/ {spotlightEvent.currency} per seat</span>
                      </span>
                    ) : (
                      <span>Free RSVP</span>
                    )}
                  </div>
                  <p className="text-[11px] font-normal text-slate-300">
                    Includes banquet, cocktail reception, award program & commemorative alumni gift.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <Link
                    href={`/events/${spotlightEvent.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 text-sm font-black text-slate-950 shadow-md transition-all hover:bg-emerald-400 active:scale-98"
                  >
                    <Ticket className="h-4 w-4 text-slate-950" />
                    <span>{spotlightEvent.isRegistered ? "View Your Event Pass" : "RSVP & Get Tickets"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href={`/events/${spotlightEvent.id}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-5 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 sm:text-sm"
                  >
                    <span>Agenda & Speaker Bios</span>
                  </Link>
                </div>

                <div className="flex items-center justify-center gap-2 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Official University Alumni Event</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Events calendar */}
        <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                <span>Alumni Event Calendar</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                All Upcoming Gatherings & Summits
              </h2>
              <p className="text-sm text-slate-600">
                Filter by format, category, or search by keyword to locate events in your region.
              </p>
            </div>

            <button
              onClick={() => setIsProposingEvent(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 sm:text-sm"
            >
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span>Propose an Event</span>
            </button>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by event title, location, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder-slate-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 self-start rounded-xl border border-slate-200 bg-white p-1 shadow-2xs md:self-auto">
                {(["all", "virtual", "in-person"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setFilterType(v)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      filterType === v ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {v === "all" ? "All Formats" : v === "virtual" ? "Virtual" : "In-Person"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowMyRsvpsOnly((v) => !v)}
                className={`flex items-center justify-center gap-1.5 self-start rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors md:self-auto ${
                  showMyRsvpsOnly
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className={`h-3.5 w-3.5 ${showMyRsvpsOnly ? "text-emerald-600" : "text-slate-400"}`} />
                <span>My Registered Events</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/60 pt-1">
              <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-500">Category:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${
                    selectedCategory === cat
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {cat === "all" ? "All Types" : (CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " "))}
                </button>
              ))}

              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="ml-auto flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-1 text-xs text-slate-500">
            <span>
              Showing <strong className="font-bold text-slate-800">{filteredEvents.length}</strong> event
              {filteredEvents.length === 1 ? "" : "s"}
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-2xs">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">No matching events found</h3>
              <p className="mx-auto max-w-sm text-sm text-slate-500">
                Try clearing your search query or selecting a different category to see more events.
              </p>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((event, index) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 shadow-xs transition-all duration-300 hover:border-emerald-300 hover:bg-white hover:shadow-md"
                >
                  <div
                    className={`relative flex h-40 items-center justify-center text-slate-900 transition-transform duration-300 group-hover:scale-101 sm:h-44 ${getHeaderBg(index)}`}
                  >
                    <div className="rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-xs">
                      {getEventIcon(event.category)}
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

                    {event.isRegistered && (
                      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-xs">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                        <span>RSVP&apos;d</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col justify-between space-y-4 p-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{event.displayDate}</span>
                        </span>
                        <span className="font-semibold normal-case text-slate-500">{event.time}</span>
                      </div>

                      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 md:text-xl">
                        {event.title}
                      </h3>

                      <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-3 border-t border-slate-200/80 pt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex max-w-[70%] items-center gap-1.5 truncate">
                          {event.isVirtual ? (
                            <Video className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          )}
                          <span className="truncate">{event.location}</span>
                        </div>
                        <span className="shrink-0 font-bold text-slate-700">
                          {event.registeredCount} / {event.capacity}
                        </span>
                      </div>

                      <div
                        className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold shadow-xs transition-all duration-200 sm:text-sm ${
                          event.isRegistered
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
                            : "border border-slate-200 bg-white text-slate-800 group-hover:border-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                        }`}
                      >
                        <Ticket className="h-3.5 w-3.5" />
                        <span>{event.isRegistered ? "View My Event Pass" : "View Details & RSVP"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Host / propose an event */}
        <section className="space-y-8 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <PartyPopper className="h-3.5 w-3.5 text-emerald-600" />
                <span>Alumni Initiatives</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Host a Chapter Meetup or Webinar
              </h2>
              <p className="text-sm text-slate-600">
                Are you a chapter lead or industry specialist? Partner with the Association to organize gatherings.
              </p>
            </div>
            <button
              onClick={() => setIsProposingEvent(true)}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 sm:text-sm"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Submit Event Proposal</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-emerald-700 shadow-2xs">
                <Users className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Official Association Reach</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                We broadcast approved events to verified alumni in your city, graduation year, or industry vertical
                through automated newsletters.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-teal-700 shadow-2xs">
                <Video className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Webinar Tech & Support</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Take advantage of our high-capacity webinar licenses, recording storage, and interactive Q&A tools
                for free.
              </p>
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-amber-700 shadow-2xs">
                <Ticket className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Registration & Ticketing</h4>
              <p className="text-xs leading-relaxed text-slate-600">
                Instant digital passes, QR code mobile check-in, and secure multi-currency ticket sales with
                transparent settlement.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-10">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Attendee Guide</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Event Policies & Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Important information regarding admission, virtual stream credentials, and guest access.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isExpanded = expandedFaq === idx;
              return (
                <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50 transition-all duration-200">
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700 sm:p-5 sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <div className="shrink-0 rounded-lg border border-slate-200 bg-white p-1 text-slate-500 shadow-2xs">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-200/60 px-4 pb-4 pt-1 text-xs leading-relaxed text-slate-600 sm:px-5 sm:text-sm">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Event proposal modal */}
      {isProposingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setIsProposingEvent(false)}
              className="absolute right-5 top-5 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>

            {proposalSubmitted ? (
              <div className="space-y-3 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Proposal Submitted!</h3>
                <p className="text-sm text-slate-600">
                  Thank you for proposing this event. The Alumni Executive Council will review your submission and
                  contact you within 48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProposalSubmit} className="space-y-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Submit Proposal</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Propose an Alumni Gathering</h3>
                  <p className="text-xs text-slate-500">
                    Fill out the form below to propose a regional reunion, technical workshop, or panel discussion.
                  </p>
                </div>

                {proposalError && (
                  <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{proposalError}</div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos Alumni Tech & Finance Mixer"
                    value={proposalData.title}
                    onChange={(e) => setProposalData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Category</label>
                    <select
                      value={proposalData.category}
                      onChange={(e) =>
                        setProposalData((p) => ({
                          ...p,
                          category: e.target.value as (typeof PROPOSAL_CATEGORIES)[number],
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {PROPOSAL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Format</label>
                    <select
                      value={proposalData.format}
                      onChange={(e) => setProposalData((p) => ({ ...p, format: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="In-Person">In-Person</option>
                      <option value="Virtual">Virtual</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Target Date</label>
                    <input
                      type="date"
                      value={proposalData.targetDate}
                      onChange={(e) => setProposalData((p) => ({ ...p, targetDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City / Platform</label>
                    <input
                      type="text"
                      placeholder="e.g. Freetown / Zoom"
                      value={proposalData.location}
                      onChange={(e) => setProposalData((p) => ({ ...p, location: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Brief Agenda & Target Audience</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe the objective, prospective speakers, and anticipated alumni attendance..."
                    value={proposalData.description}
                    onChange={(e) => setProposalData((p) => ({ ...p, description: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Email Address</label>
                  <input
                    type="email"
                    required
                    value={proposalData.organizerEmail}
                    onChange={(e) => setProposalData((p) => ({ ...p, organizerEmail: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProposingEvent(false)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={proposalLoading}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{proposalLoading ? "Submitting…" : "Submit Proposal"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
