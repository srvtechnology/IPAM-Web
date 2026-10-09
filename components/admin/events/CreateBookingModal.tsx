"use client";

import { useState, useEffect, type FormEvent } from "react";
import type { AdminEventItem } from "@/hooks/admin/useAdminEvents";

interface CreateBookingModalProps {
  events: AdminEventItem[];
  preselectedEventId?: string | null;
  onClose: () => void;
  onSave: (eventId: string, payload: Record<string, unknown>) => Promise<unknown>;
}

export default function CreateBookingModal({
  events,
  preselectedEventId,
  onClose,
  onSave,
}: CreateBookingModalProps) {
  const [selectedEventId, setSelectedEventId] = useState(
    preselectedEventId || (events.length > 0 ? events[0].id : "")
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const [attendeeName, setAttendeeName] = useState("");
  const [attendeeEmail, setAttendeeEmail] = useState("");
  const [attendeePhone, setAttendeePhone] = useState("");
  const [ticketCount, setTicketCount] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<
    "FREE" | "OFFLINE_CASH" | "STRIPE" | "BANK_TRANSFER" | "COMPLIMENTARY"
  >("OFFLINE_CASH");
  const [paymentStatus, setPaymentStatus] = useState<"FREE" | "PAID" | "PENDING">("PAID");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync paymentMethod and paymentStatus if event is Free
  useEffect(() => {
    if (selectedEvent && !selectedEvent.isPaid) {
      setPaymentMethod("FREE");
      setPaymentStatus("FREE");
    } else if (selectedEvent && selectedEvent.isPaid && paymentMethod === "FREE") {
      setPaymentMethod("OFFLINE_CASH");
      setPaymentStatus("PAID");
    }
  }, [selectedEvent, paymentMethod]);

  const unitPrice = selectedEvent ? (selectedEvent.isPaid ? selectedEvent.ticketPrice : 0) : 0;
  const totalAmount = unitPrice * ticketCount;
  const remainingSeats = selectedEvent
    ? Math.max(0, selectedEvent.capacity - (selectedEvent.totalBookedSeats || 0))
    : 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!selectedEventId) return setFormError("Please select an event");
    if (!attendeeName.trim()) return setFormError("Attendee name is required");
    if (!attendeeEmail.trim()) return setFormError("Attendee email is required");
    if (ticketCount <= 0) return setFormError("Ticket count must be at least 1");
    if (ticketCount > remainingSeats) {
      return setFormError(`Only ${remainingSeats} seat(s) remain for this event.`);
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        attendeeName: attendeeName.trim(),
        attendeeEmail: attendeeEmail.trim(),
        attendeePhone: attendeePhone.trim() || null,
        ticketCount: Number(ticketCount),
        currency: selectedEvent?.currency || "USD",
        paymentMethod: selectedEvent?.isPaid ? paymentMethod : "FREE",
        paymentStatus: selectedEvent?.isPaid ? paymentStatus : "FREE",
        notes: notes.trim() || null,
        source: "ADMIN_DESK",
      };

      const result = await onSave(selectedEventId, payload);
      if (result) {
        onClose();
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to record booking");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-secondary text-[24px]">
              confirmation_number
            </span>
            <h2 className="font-headline-md text-on-surface">Registrar Walk-in Booking</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-xl bg-error-container/40 p-3 text-xs font-medium text-error flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Select Event *
            </label>
            <select
              required
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.displayDate}) — {ev.isPaid ? `$${ev.ticketPrice} ${ev.currency}` : "FREE"} [
                  {ev.capacity - (ev.totalBookedSeats || 0)} seats left]
                </option>
              ))}
            </select>
          </div>

          {/* Event Info Snapshot */}
          {selectedEvent && (
            <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/60 p-3 flex items-center justify-between text-xs">
              <div>
                <span className="text-on-surface-variant font-medium">Pricing Tier: </span>
                <span className={`font-bold ${selectedEvent.isPaid ? "text-primary" : "text-emerald-400"}`}>
                  {selectedEvent.isPaid ? `Paid Admission ($${selectedEvent.ticketPrice} ${selectedEvent.currency})` : "Free / Complimentary"}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant font-medium">Availability: </span>
                <span className="font-bold text-secondary">{remainingSeats} seats available</span>
              </div>
            </div>
          )}

          {/* Attendee Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Attendee Full Name *
              </label>
              <input
                type="text"
                required
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="e.g. Samuel Koroma or Mariama Jalloh"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={attendeeEmail}
                onChange={(e) => setAttendeeEmail(e.target.value)}
                placeholder="attendee@example.com"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Contact Phone
              </label>
              <input
                type="tel"
                value={attendeePhone}
                onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="+232 76 000000"
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Ticket Count & Total Calculation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center rounded-xl bg-surface-container-lowest/80 p-3 border border-outline-variant/20">
            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Number of Tickets *
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, remainingSeats)}
                required
                value={ticketCount}
                onChange={(e) => setTicketCount(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm font-bold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="text-right">
              <p className="text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                Booking Total Due
              </p>
              <p className="font-headline-lg text-primary text-xl font-bold mt-0.5">
                {selectedEvent?.isPaid ? `$${totalAmount} ${selectedEvent.currency}` : "FREE ($0)"}
              </p>
              <p className="text-[10px] text-on-surface-variant font-mono">
                {ticketCount} x {selectedEvent?.isPaid ? `$${unitPrice}` : "$0"}
              </p>
            </div>
          </div>

          {/* Payment Section (if Paid) */}
          {selectedEvent?.isPaid && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) =>
                    setPaymentMethod(
                      e.target.value as "OFFLINE_CASH" | "STRIPE" | "BANK_TRANSFER" | "COMPLIMENTARY"
                    )
                  }
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="OFFLINE_CASH">Desk Cash Payment (Venue)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="STRIPE">Stripe / Online Card</option>
                  <option value="COMPLIMENTARY">Complimentary (Waived by Registrar)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Payment Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as "PAID" | "PENDING")}
                  className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm font-semibold text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="PAID">Collected & Paid (Settled)</option>
                  <option value="PENDING">Pending (Collect at Event Door)</option>
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Booking Notes / Special Accommodations
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP seating, dietary requests, table assignment"
              className="w-full rounded-lg bg-surface-container-high border border-outline-variant/30 px-3 py-2 text-sm text-on-surface focus:outline-hidden focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary/90 transition-colors shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {saving ? "sync" : "add_task"}
              </span>
              <span>{saving ? "Confirming..." : "Confirm Booking"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
