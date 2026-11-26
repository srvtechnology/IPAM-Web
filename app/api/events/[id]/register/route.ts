import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { notifyEventRegistrationConfirmed } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to register for an event");
  const { id: eventId } = await params;

  const event = await db.alumniEvent.findUnique({
    where: { id: eventId },
    include: {
      registrations: {
        select: { ticketCount: true, bookingStatus: true },
      },
    },
  });
  if (!event) return fail(404, "Event not found");

  const body = await req.json().catch(() => ({}));
  const ticketCount = Math.max(1, Number(body.ticketCount) || 1);

  // Check if alumni already has an active booking for this event
  const existing = await db.eventRegistration.findFirst({
    where: {
      eventId,
      userId: session.sub,
      bookingStatus: { not: "CANCELLED" },
    },
  });
  if (existing) {
    // If existing registration is already PAID or FREE
    if (existing.paymentStatus === "PAID" || existing.paymentStatus === "FREE") {
      return ok({
        registered: true,
        alreadyRegistered: true,
        bookingReference: existing.bookingReference,
        ticketCount: existing.ticketCount,
        totalAmount: Number(existing.totalAmount),
        paymentStatus: existing.paymentStatus,
        paymentMethod: existing.paymentMethod,
      });
    }

    // If existing registration is PENDING and user has now completed payment
    if (body.paymentRef) {
      const updated = await db.eventRegistration.update({
        where: { id: existing.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: body.paymentMethod || "FLOT",
          paymentRef: body.paymentRef,
          attendeePhone: body.attendeePhone || existing.attendeePhone,
        },
      });

      await db.transaction.updateMany({
        where: {
          OR: [
            { refId: `TXN-${existing.bookingReference}` },
            { refId: `TXN-${body.bookingReference}` },
          ],
        },
        data: {
          status: "SETTLED",
          method: "Flot Event Booking",
          methodColor: "PRIMARY",
        },
      });

      const attendeeName = body.attendeeName || existing.attendeeName;
      const attendeeEmail = body.attendeeEmail || existing.attendeeEmail;

      notifyEventRegistrationConfirmed({
        userId: session.sub,
        attendeeEmail: attendeeEmail || session.email,
        attendeeName: attendeeName || null,
        eventTitle: event.title,
        eventDate: event.date,
        bookingReference: updated.bookingReference,
        location: event.location,
        ticketCount: updated.ticketCount,
        totalAmount: Number(updated.totalAmount),
        currency: updated.currency,
        paymentStatus: updated.paymentStatus,
      }).catch((err) => console.error("[Events] RSVP Notification error:", err));

      return ok({
        registered: true,
        alreadyRegistered: true,
        bookingReference: updated.bookingReference,
        ticketCount: updated.ticketCount,
        totalAmount: Number(updated.totalAmount),
        paymentStatus: updated.paymentStatus,
        paymentMethod: updated.paymentMethod,
      });
    }

    // If existing registration is PENDING and user is updating ticket count or reference
    const newBookingReference = body.bookingReference || existing.bookingReference;
    const newTotalAmount = (event.isPaid ? Number(event.ticketPrice) : 0) * ticketCount;
    const updated = await db.eventRegistration.update({
      where: { id: existing.id },
      data: {
        bookingReference: newBookingReference,
        ticketCount,
        totalAmount: newTotalAmount,
        attendeePhone: body.attendeePhone || existing.attendeePhone,
        paymentMethod: body.paymentMethod || "FLOT",
      },
    });

    const txnRef = `TXN-${newBookingReference}`;
    const existingTxn = await db.transaction.findFirst({
      where: { OR: [{ refId: txnRef }, { refId: `TXN-${existing.bookingReference}` }] },
    });
    if (existingTxn) {
      await db.transaction.update({
        where: { id: existingTxn.id },
        data: {
          refId: txnRef,
          amount: newTotalAmount,
          method: "Flot Event Booking",
          status: "PENDING",
        },
      });
    } else {
      await db.transaction.create({
        data: {
          refId: txnRef,
          method: "Flot Event Booking",
          methodColor: "PRIMARY",
          amount: newTotalAmount,
          currency: event.currency === "SLE" ? "SLE" : "USD",
          tier: `Event Registration - ${event.title}`,
          status: "PENDING",
          alumniName: existing.attendeeName || "Alumni Attendee",
        },
      });
    }

    return ok({
      registered: false,
      alreadyRegistered: false,
      bookingReference: updated.bookingReference,
      ticketCount: updated.ticketCount,
      totalAmount: Number(updated.totalAmount),
      paymentStatus: updated.paymentStatus,
      paymentMethod: updated.paymentMethod,
    });
  }

  // Capacity check
  const bookedSeats = event.registrations
    .filter((r) => r.bookingStatus !== "CANCELLED")
    .reduce((sum, r) => sum + r.ticketCount, 0);

  if (bookedSeats + ticketCount > event.capacity) {
    return fail(409, `This event is at capacity. Only ${Math.max(0, event.capacity - bookedSeats)} seats remain.`);
  }

  const alumniUser = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });

  const attendeeName = body.attendeeName || alumniUser?.profile?.name || alumniUser?.email || "Alumni Attendee";
  const attendeeEmail = body.attendeeEmail || alumniUser?.email || "";
  const attendeePhone = body.attendeePhone || null;

  const unitPrice = event.isPaid ? Number(event.ticketPrice) : 0;
  const totalAmount = unitPrice * ticketCount;
  const paymentStatus = event.isPaid ? (body.paymentRef ? "PAID" : "PENDING") : "FREE";
  const paymentMethod = event.isPaid ? (body.paymentMethod || "FLOT") : "FREE";

  const bookingReference =
    body.bookingReference ||
    `BK-EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const registration = await db.eventRegistration.create({
    data: {
      bookingReference,
      eventId,
      userId: session.sub,
      ticketCount,
      unitPrice,
      totalAmount,
      currency: event.currency,
      paymentStatus,
      paymentMethod,
      paymentRef: body.paymentRef || null,
      bookingStatus: "CONFIRMED",
      attendeeName,
      attendeeEmail,
      attendeePhone,
      notes: body.notes || null,
      source: "SELF_SERVICE",
    },
  });

  await db.alumniEvent.update({
    where: { id: eventId },
    data: { registeredCount: { increment: ticketCount } },
  });

  // Record in Finance Transactions ledger for Admin Panel
  if (totalAmount > 0) {
    try {
      await db.transaction.create({
        data: {
          refId: `TXN-${registration.bookingReference}`,
          method: paymentMethod === "FLOT" ? "Flot Event Booking" : "Online Card Payment",
          methodColor: "PRIMARY",
          amount: totalAmount,
          currency: event.currency === "SLE" ? "SLE" : "USD",
          tier: `Event Registration - ${event.title}`,
          status: paymentStatus === "PAID" ? "SETTLED" : "PENDING",
          alumniName: attendeeName,
        },
      });
    } catch (err) {
      console.error("Failed to record transaction for event registration:", err);
    }
  }

  // Dispatch push, in-app, and email confirmation notification when free or already paid
  if (paymentStatus !== "PENDING") {
    notifyEventRegistrationConfirmed({
      userId: session.sub,
      attendeeEmail: attendeeEmail || session.email,
      attendeeName: attendeeName || null,
      eventTitle: event.title,
      eventDate: event.date,
      bookingReference: registration.bookingReference,
      location: event.location,
      ticketCount: registration.ticketCount,
      totalAmount: Number(registration.totalAmount),
      currency: registration.currency,
      paymentStatus: registration.paymentStatus,
    }).catch((err) => console.error("[Events] RSVP Notification error:", err));
  }

  return ok(
    {
      registered: paymentStatus === "PAID" || paymentStatus === "FREE",
      alreadyRegistered: false,
      bookingReference: registration.bookingReference,
      ticketCount: registration.ticketCount,
      totalAmount: Number(registration.totalAmount),
      paymentStatus: registration.paymentStatus,
      paymentMethod: registration.paymentMethod,
    },
    201
  );
}
