"use client";

import { useState } from "react";
import type { AdminBookingItem } from "@/hooks/admin/useAdminEvents";

interface BookingDetailsModalProps {
  booking: AdminBookingItem;
  onClose: () => void;
  onUpdate: (bookingId: string, payload: Record<string, unknown>) => Promise<unknown>;
  onDelete: (bookingId: string) => Promise<boolean>;
}

export default function BookingDetailsModal({
  booking,
  onClose,
  onUpdate,
  onDelete,
}: BookingDetailsModalProps) {
  const [loading, setLoading] = useState(false);

  const isAttended = booking.bookingStatus === "ATTENDED";
  const isCancelled = booking.bookingStatus === "CANCELLED";

  async function handleToggleAttendance() {
    setLoading(true);
    try {
      await onUpdate(booking.id, {
        bookingStatus: isAttended ? "CONFIRMED" : "ATTENDED",
        attendedAt: isAttended ? null : new Date().toISOString(),
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!confirm(`Confirm collection and payment settlement for booking ${booking.bookingReference}?`)) {
      return;
    }
    setLoading(true);
    try {
      await onUpdate(booking.id, {
        paymentStatus: "PAID",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking() {
    if (!confirm(`Are you sure you want to cancel booking ${booking.bookingReference}? This will release the seats.`)) {
      return;
    }
    setLoading(true);
    try {
      await onUpdate(booking.id, {
        bookingStatus: "CANCELLED",
      });
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container p-6 shadow-2xl border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Official Booking Pass
            </span>
            <h2 className="font-headline-md text-on-surface font-mono mt-0.5">
              {booking.bookingReference}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* E-Ticket Display Card */}
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-inner mb-5">
          {/* Top Banner */}
          <div className="bg-primary/10 border-b border-outline-variant/20 p-4 flex items-center justify-between">
            <div>
              <h3 className="font-headline-sm text-on-surface font-bold">{booking.eventTitle}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {booking.eventDate} • {booking.eventLocation}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-surface-container-highest text-primary">
              {booking.ticketCount} {booking.ticketCount === 1 ? "Ticket" : "Tickets"}
            </span>
          </div>

          {/* Ticket Details */}
          <div className="p-4 space-y-3.5 text-xs">
            {/* Attendee Details */}
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-outline-variant/15">
              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">
                  Attendee Name
                </span>
                <span className="text-on-surface font-bold text-sm">{booking.attendeeName}</span>
                {booking.user?.studentId && (
                  <span className="block font-mono text-[10px] text-secondary mt-0.5">
                    ID: {booking.user.studentId}
                  </span>
                )}
              </div>

              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">
                  Contact Information
                </span>
                <span className="text-on-surface block truncate font-medium">{booking.attendeeEmail}</span>
                {booking.attendeePhone && (
                  <span className="text-on-surface-variant font-mono text-[11px] block mt-0.5">
                    {booking.attendeePhone}
                  </span>
                )}
              </div>
            </div>

            {/* Financial & Status Breakdown */}
            <div className="grid grid-cols-3 gap-2 pb-3 border-b border-outline-variant/15">
              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">
                  Total Pricing
                </span>
                <span className="text-on-surface font-bold text-sm">
                  {booking.eventIsPaid ? `$${booking.totalAmount} ${booking.currency}` : "FREE"}
                </span>
                <span className="text-[10px] text-on-surface-variant block font-mono">
                  {booking.ticketCount} x {booking.eventIsPaid ? `$${booking.unitPrice}` : "$0"}
                </span>
              </div>

              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">
                  Payment Status
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    booking.paymentStatus === "PAID"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : booking.paymentStatus === "FREE"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {booking.paymentStatus}
                </span>
                <span className="text-[10px] text-on-surface-variant block font-mono mt-0.5">
                  {booking.paymentMethod || "N/A"}
                </span>
              </div>

              <div>
                <span className="text-on-surface-variant block text-[10px] uppercase font-bold">
                  Attendance
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                    isAttended
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isCancelled
                      ? "bg-error/20 text-error"
                      : "bg-surface-container-highest text-on-surface"
                  }`}
                >
                  {booking.bookingStatus}
                </span>
                {booking.attendedAt && (
                  <span className="text-[9px] text-on-surface-variant block mt-0.5">
                    {new Date(booking.attendedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            </div>

            {/* Notes & Registration Timestamp */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-on-surface-variant gap-2">
              <div>
                <span className="font-semibold text-on-surface">Booked on: </span>
                <span>{new Date(booking.registeredAt).toLocaleString()}</span>
                <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high">
                  {booking.source}
                </span>
              </div>
              {booking.notes && (
                <div className="w-full text-xs text-on-surface bg-surface-container-high/60 p-2 rounded-lg">
                  <span className="font-bold text-on-surface-variant">Note: </span>
                  {booking.notes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-lg border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            <span>Print E-Ticket</span>
          </button>

          <div className="flex items-center gap-2">
            {booking.paymentStatus === "PENDING" && (
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkPaid}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">payments</span>
                <span>Settle Paid</span>
              </button>
            )}

            {!isCancelled && (
              <button
                type="button"
                disabled={loading}
                onClick={handleToggleAttendance}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-50 ${
                  isAttended
                    ? "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                    : "bg-primary text-on-primary hover:bg-primary/90 shadow-xs"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isAttended ? "undo" : "how_to_reg"}
                </span>
                <span>{isAttended ? "Undo Check-in" : "Check-in Attendee"}</span>
              </button>
            )}

            {!isCancelled && (
              <button
                type="button"
                disabled={loading}
                onClick={handleCancelBooking}
                className="px-3 py-1.5 rounded-lg bg-error-container/20 text-error hover:bg-error-container/40 text-xs font-bold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
