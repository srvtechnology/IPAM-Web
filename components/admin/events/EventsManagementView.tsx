"use client";

import { useState, useMemo } from "react";
import {
  useAdminEvents,
  type AdminEventItem,
  type AdminBookingItem,
} from "@/hooks/admin/useAdminEvents";
import CreateEditEventModal from "./CreateEditEventModal";
import CreateBookingModal from "./CreateBookingModal";
import BookingDetailsModal from "./BookingDetailsModal";

export default function EventsManagementView() {
  const {
    events,
    bookings,
    loading,
    error,
    refetch,
    createEvent,
    updateEvent,
    deleteEvent,
    createManualBooking,
    updateBooking,
    deleteBooking,
  } = useAdminEvents();

  // Tab state
  const [activeTab, setActiveTab] = useState<"events" | "bookings" | "history">("events");

  // Modals state
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AdminEventItem | null>(null);
  const [createBookingOpen, setCreateBookingOpen] = useState(false);
  const [bookingEventId, setBookingEventId] = useState<string | null>(null);
  const [inspectingBooking, setInspectingBooking] = useState<AdminBookingItem | null>(null);

  // Event Tab Filters
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string>("ALL");
  const [eventPricingFilter, setEventPricingFilter] = useState<"ALL" | "PAID" | "FREE">("ALL");
  const [eventFeaturedFilter, setEventFeaturedFilter] = useState<"ALL" | "FEATURED" | "STANDARD">("ALL");
  const [eventSearch, setEventSearch] = useState("");

  // Bookings Tab Filters
  const [bookingEventFilter, setBookingEventFilter] = useState<string>("ALL");
  const [bookingPaymentFilter, setBookingPaymentFilter] = useState<string>("ALL");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("ALL");
  const [bookingSearch, setBookingSearch] = useState("");

  // History Tab User Search
  const [historySearch, setHistorySearch] = useState("");

  // Metric Computations
  const totalBookedSeats = useMemo(
    () =>
      bookings
        .filter((b) => b.bookingStatus !== "CANCELLED")
        .reduce((sum, b) => sum + b.ticketCount, 0),
    [bookings]
  );

  const totalRevenue = useMemo(
    () =>
      bookings
        .filter((b) => b.bookingStatus !== "CANCELLED" && b.paymentStatus === "PAID")
        .reduce((sum, b) => sum + b.totalAmount, 0),
    [bookings]
  );

  const totalAttended = useMemo(
    () => bookings.filter((b) => b.bookingStatus === "ATTENDED").length,
    [bookings]
  );

  const paidEventsCount = events.filter((e) => e.isPaid).length;
  const freeEventsCount = events.filter((e) => !e.isPaid).length;
  const featuredEventsCount = events.filter((e) => e.featured).length;

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (eventCategoryFilter !== "ALL" && e.category !== eventCategoryFilter) return false;
      if (eventPricingFilter === "PAID" && !e.isPaid) return false;
      if (eventPricingFilter === "FREE" && e.isPaid) return false;
      if (eventFeaturedFilter === "FEATURED" && !e.featured) return false;
      if (eventFeaturedFilter === "STANDARD" && e.featured) return false;
      if (eventSearch) {
        const query = eventSearch.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(query);
        const matchesLocation = e.location.toLowerCase().includes(query);
        const matchesCategory = e.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesLocation && !matchesCategory) return false;
      }
      return true;
    });
  }, [events, eventCategoryFilter, eventPricingFilter, eventFeaturedFilter, eventSearch]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (bookingEventFilter !== "ALL" && b.eventId !== bookingEventFilter) return false;
      if (bookingPaymentFilter !== "ALL" && b.paymentStatus !== bookingPaymentFilter) return false;
      if (bookingStatusFilter !== "ALL" && b.bookingStatus !== bookingStatusFilter) return false;
      if (bookingSearch) {
        const query = bookingSearch.toLowerCase();
        const matchesRef = b.bookingReference.toLowerCase().includes(query);
        const matchesName = b.attendeeName.toLowerCase().includes(query);
        const matchesEmail = b.attendeeEmail.toLowerCase().includes(query);
        const matchesEvent = b.eventTitle.toLowerCase().includes(query);
        const matchesPhone = b.attendeePhone?.toLowerCase().includes(query) ?? false;
        const matchesStudentId = b.user?.studentId?.toLowerCase().includes(query) ?? false;
        if (!matchesRef && !matchesName && !matchesEmail && !matchesEvent && !matchesPhone && !matchesStudentId) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, bookingEventFilter, bookingPaymentFilter, bookingStatusFilter, bookingSearch]);

  // Grouped Bookings for History Tab
  const userHistoryGroups = useMemo(() => {
    const map = new Map<string, { userKey: string; name: string; email: string; studentId: string | null; bookings: AdminBookingItem[]; totalSpent: number; totalTickets: number }>();

    bookings.forEach((b) => {
      const key = b.user?.id || b.attendeeEmail.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          userKey: key,
          name: b.attendeeName,
          email: b.attendeeEmail,
          studentId: b.user?.studentId || null,
          bookings: [],
          totalSpent: 0,
          totalTickets: 0,
        });
      }
      const entry = map.get(key)!;
      entry.bookings.push(b);
      if (b.bookingStatus !== "CANCELLED") {
        entry.totalTickets += b.ticketCount;
        if (b.paymentStatus === "PAID") {
          entry.totalSpent += b.totalAmount;
        }
      }
    });

    const list = Array.from(map.values());
    if (!historySearch.trim()) return list;

    const query = historySearch.toLowerCase();
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.studentId && u.studentId.toLowerCase().includes(query))
    );
  }, [bookings, historySearch]);

  // Export Bookings CSV
  function handleExportCsv() {
    if (filteredBookings.length === 0) return alert("No bookings to export");
    const headers = [
      "Booking Reference",
      "Event Title",
      "Event Date",
      "Attendee Name",
      "Attendee Email",
      "Phone",
      "Alumni Student ID",
      "Tickets",
      "Pricing",
      "Total Amount",
      "Currency",
      "Payment Status",
      "Payment Method",
      "Booking Status",
      "Registered At",
    ];
    const rows = filteredBookings.map((b) => [
      `"${b.bookingReference}"`,
      `"${b.eventTitle.replace(/"/g, '""')}"`,
      `"${b.eventDate}"`,
      `"${b.attendeeName.replace(/"/g, '""')}"`,
      `"${b.attendeeEmail}"`,
      `"${b.attendeePhone || ""}"`,
      `"${b.user?.studentId || ""}"`,
      b.ticketCount,
      b.eventIsPaid ? "Paid" : "Free",
      b.totalAmount,
      b.currency,
      b.paymentStatus,
      b.paymentMethod || "",
      b.bookingStatus,
      `"${new Date(b.registeredAt).toLocaleString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_bookings_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[28px]">event</span>
            <h1 className="font-headline-lg text-on-surface">Events & Bookings Desk</h1>
          </div>
          <p className="font-body-default text-on-surface-variant mt-1 text-xs sm:text-sm">
            Event lifecycle planning, Paid & Free ticketing tiers, attendee roster, and live check-in management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBookingEventId(null);
              setCreateBookingOpen(true);
            }}
            className="rounded-lg border border-secondary/40 bg-secondary/10 px-3.5 py-2 text-xs font-bold text-secondary hover:bg-secondary/20 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">confirmation_number</span>
            <span>New Walk-in Booking</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setCreateEventOpen(true);
            }}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[17px]">add_circle</span>
            <span>Create Event</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Total Events
            </span>
            <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">{events.length}</span>
            <span className="text-xs text-on-surface-variant">
              ({paidEventsCount} Paid, {freeEventsCount} Free • {featuredEventsCount} Featured)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-on-surface-variant">
            {events.filter((e) => e.status === "PUBLISHED").length} published live
          </div>
        </div>

        {/* Total Bookings & Seats */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Seats Booked
            </span>
            <span className="material-symbols-outlined text-secondary text-[22px]">how_to_vote</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {totalBookedSeats}
            </span>
            <span className="text-xs text-on-surface-variant">
              across {bookings.length} reservations
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
            {bookings.filter((b) => b.bookingStatus === "CONFIRMED").length} active reservations
          </div>
        </div>

        {/* Total Ticket Revenue */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Ticket Revenue
            </span>
            <span className="material-symbols-outlined text-tertiary text-[22px]">payments</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-tertiary">
              ${totalRevenue.toLocaleString()}
            </span>
            <span className="text-xs text-on-surface-variant">settled</span>
          </div>
          <div className="mt-2 text-[11px] text-on-surface-variant">
            {bookings.filter((b) => b.paymentStatus === "PENDING").length} pending cash collections
          </div>
        </div>

        {/* Attendee Check-ins */}
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Check-in Rate
            </span>
            <span className="material-symbols-outlined text-emerald-400 text-[22px]">fact_check</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-headline-lg text-2xl font-bold text-on-surface">
              {totalAttended}
            </span>
            <span className="text-xs text-on-surface-variant">
              / {totalBookedSeats || 1} attendees ({Math.round((totalAttended / (totalBookedSeats || 1)) * 100)}%)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
            Live venue verification
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-outline-variant/20 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("events")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "events"
              ? "bg-primary-container text-on-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          <span>All Events ({events.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "bookings"
              ? "bg-primary-container text-on-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">table_rows</span>
          <span>Master Bookings Roster ({bookings.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "history"
              ? "bg-primary-container text-on-primary-container shadow-xs"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">badge</span>
          <span>User Booking History ({userHistoryGroups.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ALL EVENTS DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === "events" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  placeholder="Search events by title, location, category..."
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/20 pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Category Filter */}
              <select
                value={eventCategoryFilter}
                onChange={(e) => setEventCategoryFilter(e.target.value)}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Categories</option>
                <option value="GALA">Gala & Formal</option>
                <option value="WEBINAR">Webinar & Online</option>
                <option value="NETWORKING">Networking & Mixer</option>
                <option value="CAREER_WORKSHOP">Career Workshop</option>
                <option value="REGIONAL_MEETUP">Regional Meetup</option>
              </select>

              {/* Pricing Filter */}
              <select
                value={eventPricingFilter}
                onChange={(e) => setEventPricingFilter(e.target.value as "ALL" | "PAID" | "FREE")}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Pricing Tiers</option>
                <option value="PAID">Paid Events ($)</option>
                <option value="FREE">Free Events ($0)</option>
              </select>

              {/* Featured Filter */}
              <select
                value={eventFeaturedFilter}
                onChange={(e) => setEventFeaturedFilter(e.target.value as "ALL" | "FEATURED" | "STANDARD")}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Spotlight Statuses</option>
                <option value="FEATURED">★ Featured on Banner ({featuredEventsCount})</option>
                <option value="STANDARD">Standard Events ({events.length - featuredEventsCount})</option>
              </select>
            </div>

            <span className="text-xs text-on-surface-variant font-mono">
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>

          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((ev) => {
              const bookedSeats = ev.totalBookedSeats || 0;
              const fillRate = Math.min(100, Math.round((bookedSeats / (ev.capacity || 1)) * 100));

              return (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-hidden flex flex-col justify-between hover:border-outline-variant/40 transition-all shadow-xs group"
                >
                  <div>
                    {/* Event Banner Cover Image */}
                    <div className="relative h-36 w-full overflow-hidden bg-surface-container-highest">
                      <img
                        src={ev.bannerImage || "/images/alumni_gala_event_1788454750646.jpg"}
                        alt={ev.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/alumni_gala_event_1788454750646.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-white border border-white/20 font-mono">
                            {ev.category.replace("_", " ")}
                          </span>
                          {ev.isVirtual ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/80 backdrop-blur-xs text-cyan-300 border border-cyan-500/30 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">videocam</span>
                              Online
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 backdrop-blur-xs text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[12px]">pin_drop</span>
                              In-Person
                            </span>
                          )}
                        </div>

                        {/* Pricing Tag */}
                        {ev.isPaid ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-on-primary shadow-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">payments</span>
                            ${ev.ticketPrice} {ev.currency}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            FREE
                          </span>
                        )}
                      </div>

                      {/* Bottom Banner Indicators */}
                      <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-[11px] text-white">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await updateEvent(ev.id, { featured: !ev.featured });
                            } catch (err) {
                              console.error("Failed to toggle featured status:", err);
                            }
                          }}
                          title={ev.featured ? "Featured on Banner (Click to unfeature)" : "Click to feature this event on banner"}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs transition-all cursor-pointer ${
                            ev.featured
                              ? "bg-amber-400 text-slate-950 hover:bg-amber-300 ring-1 ring-amber-300 font-bold"
                              : "bg-black/60 hover:bg-amber-400 hover:text-slate-950 text-slate-200 backdrop-blur-xs border border-white/20"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {ev.featured ? "star" : "star_border"}
                          </span>
                          <span>{ev.featured ? "Featured" : "Set Featured"}</span>
                        </button>

                        {ev.bannerImages && ev.bannerImages.length > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 border border-white/20">
                            <span className="material-symbols-outlined text-[12px]">photo_library</span>
                            {ev.bannerImages.length} Photos
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface line-clamp-1">
                          {ev.title}
                        </h3>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-1">
                          {ev.description}
                        </p>
                      </div>

                      <div className="space-y-1 text-xs text-on-surface-variant font-medium">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            calendar_today
                          </span>
                          <span>
                            {ev.displayDate} • {ev.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            location_on
                          </span>
                          <span className="truncate">{ev.location}</span>
                        </div>
                      </div>

                      {/* Capacity Progress Bar */}
                      <div className="space-y-1.5 pt-2 border-t border-outline-variant/10">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-on-surface-variant">Occupancy</span>
                          <span className="text-on-surface font-mono">
                            {bookedSeats} / {ev.capacity} seats ({fillRate}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-surface-container-highest overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              fillRate >= 90
                                ? "bg-error"
                                : fillRate >= 60
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${fillRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Revenue Pill if Paid */}
                      {ev.isPaid && (
                        <div className="flex items-center justify-between text-xs rounded-lg bg-surface-container-highest/60 p-2">
                          <span className="text-on-surface-variant text-[11px]">Revenue Collected:</span>
                          <span className="font-bold text-tertiary">
                            ${(ev.totalRevenue || 0).toLocaleString()} {ev.currency}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-4 pt-2 border-t border-outline-variant/15 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingEventFilter(ev.id);
                        setActiveTab("bookings");
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">group</span>
                      <span>Roster ({ev.bookingsCount})</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setBookingEventId(ev.id);
                          setCreateBookingOpen(true);
                        }}
                        title="Book Walk-in Attendee"
                        className="p-1.5 rounded-lg bg-secondary/15 text-secondary hover:bg-secondary/25 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await updateEvent(ev.id, { featured: !ev.featured });
                          } catch (err) {
                            console.error("Failed to toggle featured status:", err);
                          }
                        }}
                        title={ev.featured ? "Remove from Featured Banner" : "Mark as Featured Banner Event"}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          ev.featured
                            ? "bg-amber-400/20 text-amber-400 hover:bg-amber-400/30"
                            : "border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {ev.featured ? "star" : "star_border"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingEvent(ev);
                          setCreateEventOpen(true);
                        }}
                        title="Edit Event"
                        className="p-1.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete event "${ev.title}"? This cannot be undone.`)) {
                            await deleteEvent(ev.id);
                          }
                        }}
                        title="Delete Event"
                        className="p-1.5 rounded-lg bg-error-container/20 text-error hover:bg-error-container/40 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block">event_busy</span>
                <p className="font-headline-md text-base text-on-surface">No events found matching filters</p>
                <p className="text-xs mt-1">Adjust search parameters or create a new event above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MASTER BOOKINGS ROSTER DESK */}
      {/* ========================================================= */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low p-3 rounded-xl border border-outline-variant/20">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
                  search
                </span>
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search by name, email, student ID, booking ref..."
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/20 pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Event Filter */}
              <select
                value={bookingEventFilter}
                onChange={(e) => setBookingEventFilter(e.target.value)}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary max-w-[200px] truncate"
              >
                <option value="ALL">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>

              {/* Payment Status Filter */}
              <select
                value={bookingPaymentFilter}
                onChange={(e) => setBookingPaymentFilter(e.target.value)}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">PAID</option>
                <option value="FREE">FREE</option>
                <option value="PENDING">PENDING</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>

              {/* Booking Status Filter */}
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="rounded-lg bg-surface-container-high border border-outline-variant/20 px-3 py-2 text-xs font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="ATTENDED">ATTENDED (Checked-in)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-2 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Export CSV</span>
              </button>
              <span className="text-xs text-on-surface-variant font-mono">
                {filteredBookings.length} bookings
              </span>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-highest/60 text-on-surface-variant font-table-header uppercase text-[10px] tracking-wider border-b border-outline-variant/20">
                  <tr>
                    <th className="p-3 pl-4">Booking Ref</th>
                    <th className="p-3">Attendee Details</th>
                    <th className="p-3">Event</th>
                    <th className="p-3">Seats</th>
                    <th className="p-3">Pricing & Paid</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15 text-on-surface font-body-medium">
                  {filteredBookings.map((b) => {
                    const isAttended = b.bookingStatus === "ATTENDED";
                    const isCancelled = b.bookingStatus === "CANCELLED";

                    return (
                      <tr key={b.id} className="hover:bg-surface-container-high/40 transition-colors">
                        {/* Booking Ref */}
                        <td className="p-3 pl-4 whitespace-nowrap font-mono text-[11px] font-bold text-primary">
                          <button
                            type="button"
                            onClick={() => setInspectingBooking(b)}
                            className="hover:underline text-left"
                          >
                            {b.bookingReference}
                          </button>
                          <span className="block text-[10px] text-on-surface-variant font-normal">
                            {new Date(b.registeredAt).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Attendee Details */}
                        <td className="p-3">
                          <div className="font-bold text-on-surface">{b.attendeeName}</div>
                          <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                            {b.attendeeEmail}
                          </div>
                          {b.user?.studentId && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded font-mono text-[9px] bg-secondary/15 text-secondary">
                              ID: {b.user.studentId}
                            </span>
                          )}
                        </td>

                        {/* Event */}
                        <td className="p-3 max-w-[200px]">
                          <div className="font-semibold line-clamp-1">{b.eventTitle}</div>
                          <div className="text-[11px] text-on-surface-variant">{b.eventDate}</div>
                        </td>

                        {/* Seats */}
                        <td className="p-3 font-mono font-bold whitespace-nowrap">
                          {b.ticketCount} {b.ticketCount === 1 ? "seat" : "seats"}
                        </td>

                        {/* Pricing & Paid */}
                        <td className="p-3 whitespace-nowrap">
                          <div className="font-bold">
                            {b.eventIsPaid ? `$${b.totalAmount} ${b.currency}` : "FREE"}
                          </div>
                          <div className="text-[10px] text-on-surface-variant font-mono">
                            {b.eventIsPaid ? `$${b.unitPrice} / seat` : "Complimentary"}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              b.paymentStatus === "PAID"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : b.paymentStatus === "FREE"
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                          <span className="block text-[10px] text-on-surface-variant font-mono mt-0.5">
                            {b.paymentMethod || "N/A"}
                          </span>
                        </td>

                        {/* Status & Attendance */}
                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              isAttended
                                ? "bg-emerald-500/20 text-emerald-400"
                                : isCancelled
                                ? "bg-error/20 text-error"
                                : "bg-surface-container-highest text-on-surface"
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                          {b.attendedAt && (
                            <span className="block text-[9px] text-on-surface-variant mt-0.5">
                              Checked in {new Date(b.attendedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3 pr-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {/* Fast Check-in Toggle */}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await updateBooking(b.id, {
                                    bookingStatus: isAttended ? "CONFIRMED" : "ATTENDED",
                                    attendedAt: isAttended ? null : new Date().toISOString(),
                                  });
                                }}
                                title={isAttended ? "Undo Check-in" : "Check-in Attendee"}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isAttended
                                    ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                    : "bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[17px]">
                                  {isAttended ? "check_circle" : "how_to_reg"}
                                </span>
                              </button>
                            )}

                            {/* Mark Paid if Pending */}
                            {b.paymentStatus === "PENDING" && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Confirm settlement for ${b.bookingReference}?`)) {
                                    await updateBooking(b.id, { paymentStatus: "PAID" });
                                  }
                                }}
                                title="Collect & Settle Payment"
                                className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[17px]">payments</span>
                              </button>
                            )}

                            {/* View / Print Ticket */}
                            <button
                              type="button"
                              onClick={() => setInspectingBooking(b)}
                              title="View Booking Pass / Receipt"
                              className="p-1.5 rounded-lg border border-outline-variant/30 text-on-surface hover:bg-surface-container-high transition-colors"
                            >
                              <span className="material-symbols-outlined text-[17px]">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-3xl mb-1 block">confirmation_number</span>
                        <span>No bookings match your current criteria.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: USER BOOKING HISTORY & PROFILE LOOKUP */}
      {/* ========================================================= */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* User Search Bar */}
          <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/20 flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search alumni by name, email, matriculation ID..."
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/20 pl-9 pr-3 py-2 text-xs text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
            <span className="text-xs text-on-surface-variant font-mono">
              {userHistoryGroups.length} attendees on record
            </span>
          </div>

          {/* User History Cards */}
          <div className="space-y-4">
            {userHistoryGroups.map((u) => (
              <div
                key={u.userKey}
                className="rounded-2xl border border-outline-variant/20 bg-surface-container p-5 space-y-4 shadow-xs"
              >
                {/* User Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                      {u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
                        <span>{u.name}</span>
                        {u.studentId && (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary/15 text-secondary">
                            {u.studentId}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-on-surface-variant font-mono">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                        Total Tickets Booked
                      </span>
                      <span className="font-mono font-bold text-sm text-on-surface">
                        {u.totalTickets} seats ({u.bookings.length} events)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                        Total Paid
                      </span>
                      <span className="font-mono font-bold text-sm text-tertiary">
                        ${u.totalSpent.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* List of Bookings for this User */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {u.bookings.map((bk) => (
                    <div
                      key={bk.id}
                      onClick={() => setInspectingBooking(bk)}
                      className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-3 cursor-pointer hover:border-primary/40 transition-colors space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[11px] text-primary">
                          {bk.bookingReference}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            bk.bookingStatus === "ATTENDED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : bk.bookingStatus === "CANCELLED"
                              ? "bg-error/20 text-error"
                              : "bg-surface-container-highest text-on-surface"
                          }`}
                        >
                          {bk.bookingStatus}
                        </span>
                      </div>

                      <div className="font-bold text-on-surface line-clamp-1">{bk.eventTitle}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        {bk.eventDate} • {bk.ticketCount} {bk.ticketCount === 1 ? "ticket" : "tickets"}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10 text-[11px]">
                        <span className="text-on-surface-variant">
                          {bk.eventIsPaid ? `$${bk.totalAmount} ${bk.currency}` : "FREE"}
                        </span>
                        <span
                          className={`font-bold ${
                            bk.paymentStatus === "PAID"
                              ? "text-emerald-400"
                              : bk.paymentStatus === "FREE"
                              ? "text-cyan-400"
                              : "text-amber-400"
                          }`}
                        >
                          {bk.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {userHistoryGroups.length === 0 && (
              <div className="rounded-2xl border border-dashed border-outline-variant/30 p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
                <p className="font-headline-md text-base text-on-surface">No alumni booking histories match search</p>
                <p className="text-xs mt-1">Try another search term.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}
      {/* Create / Edit Event Modal */}
      {createEventOpen && (
        <CreateEditEventModal
          event={editingEvent}
          onClose={() => {
            setCreateEventOpen(false);
            setEditingEvent(null);
          }}
          onSave={async (payload) => {
            if (editingEvent) {
              return await updateEvent(editingEvent.id, payload);
            }
            return await createEvent(payload);
          }}
        />
      )}

      {/* Manual / Walk-in Booking Modal */}
      {createBookingOpen && (
        <CreateBookingModal
          events={events}
          preselectedEventId={bookingEventId}
          onClose={() => {
            setCreateBookingOpen(false);
            setBookingEventId(null);
          }}
          onSave={async (eventId, payload) => {
            return await createManualBooking(eventId, payload);
          }}
        />
      )}

      {/* Inspect Booking / E-Ticket Modal */}
      {inspectingBooking && (
        <BookingDetailsModal
          booking={inspectingBooking}
          onClose={() => setInspectingBooking(null)}
          onUpdate={async (bookingId, payload) => {
            return await updateBooking(bookingId, payload);
          }}
          onDelete={async (bookingId) => {
            return await deleteBooking(bookingId);
          }}
        />
      )}
    </div>
  );
}
