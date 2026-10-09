"use client";

import { useState, useCallback, useEffect } from "react";

export interface AdminEventItem {
  id: string;
  title: string;
  category: "GALA" | "WEBINAR" | "REGIONAL_MEETUP" | "NETWORKING" | "CAREER_WORKSHOP";
  date: string;
  displayDate: string;
  time: string;
  location: string;
  venueDetails: string | null;
  isVirtual: boolean;
  virtualLink: string | null;
  isPaid: boolean;
  ticketPrice: number;
  currency: string;
  capacity: number;
  registeredCount: number;
  totalBookedSeats: number;
  totalRevenue: number;
  pendingRevenue: number;
  dressCode: string | null;
  description: string;
  agenda?: Array<{ time: string; activity: string; speaker?: string }> | null;
  speakers?: Array<{ name: string; title: string; image?: string; company?: string }> | null;
  highlights?: string[] | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  status: "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED";
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  bookingsCount: number;
}

export interface AdminBookingItem {
  id: string;
  bookingReference: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventIsPaid: boolean;
  ticketCount: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  paymentStatus: "FREE" | "PAID" | "PENDING" | "REFUNDED";
  paymentMethod: "FREE" | "STRIPE" | "OFFLINE_CASH" | "BANK_TRANSFER" | "COMPLIMENTARY" | null;
  paymentRef: string | null;
  bookingStatus: "CONFIRMED" | "ATTENDED" | "CANCELLED";
  attendedAt: string | null;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  notes: string | null;
  source: "SELF_SERVICE" | "ADMIN_DESK";
  registeredAt: string;
  user: {
    id: string;
    email: string;
    studentId: string | null;
    membershipTier: string;
    name?: string;
    classYear?: number | null;
    degree?: string | null;
    company?: string | null;
    currentRole?: string | null;
    avatar?: string | null;
  } | null;
}

export function useAdminEvents() {
  const [events, setEvents] = useState<AdminEventItem[]>([]);
  const [bookings, setBookings] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/events", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setEvents(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch admin events:", err);
    }
  }, []);

  const fetchBookings = useCallback(
    async (params?: { eventId?: string; paymentStatus?: string; bookingStatus?: string; search?: string }) => {
      try {
        const query = new URLSearchParams();
        if (params?.eventId && params.eventId !== "ALL") query.set("eventId", params.eventId);
        if (params?.paymentStatus && params.paymentStatus !== "ALL") query.set("paymentStatus", params.paymentStatus);
        if (params?.bookingStatus && params.bookingStatus !== "ALL") query.set("bookingStatus", params.bookingStatus);
        if (params?.search) query.set("search", params.search);

        const res = await fetch(`/api/admin/events/bookings?${query.toString()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const json = await res.json();
        if (res.ok && Array.isArray(json.data)) {
          setBookings(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch admin event bookings:", err);
      }
    },
    []
  );

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchEvents(), fetchBookings()]);
    setLoading(false);
  }, [fetchEvents, fetchBookings]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Actions
  async function createEvent(payload: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create event");
      await refreshAll();
      return json.data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation error");
      return null;
    }
  }

  async function updateEvent(id: string, payload: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update event");
      await refreshAll();
      return json.data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update error");
      return null;
    }
  }

  async function deleteEvent(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete event");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion error");
      return false;
    }
  }

  async function createManualBooking(eventId: string, payload: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create booking");
      await refreshAll();
      return json.data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Booking error");
      return null;
    }
  }

  async function updateBooking(bookingId: string, payload: Record<string, unknown>) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update booking");
      await refreshAll();
      return json.data;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update error");
      return null;
    }
  }

  async function deleteBooking(bookingId: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/events/bookings/${bookingId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete booking");
      await refreshAll();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Deletion error");
      return false;
    }
  }

  return {
    events,
    bookings,
    loading,
    error,
    setError,
    refetch: refreshAll,
    fetchBookings,
    createEvent,
    updateEvent,
    deleteEvent,
    createManualBooking,
    updateBooking,
    deleteBooking,
  };
}
