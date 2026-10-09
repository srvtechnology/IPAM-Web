import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

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
    return ok({
      registered: true,
      alreadyRegistered: true,
      bookingReference: existing.bookingReference,
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
  const paymentMethod = event.isPaid ? (body.paymentMethod || "STRIPE") : "FREE";

  const bookingReference = `BK-EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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

  return ok(
    {
      registered: true,
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
