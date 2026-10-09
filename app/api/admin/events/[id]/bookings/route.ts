import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { createBookingSchema } from "@/lib/validation/events";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

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

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = createBookingSchema.safeParse({ ...body, eventId });
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const {
    userId,
    attendeeName,
    attendeeEmail,
    attendeePhone,
    ticketCount,
    currency,
    paymentStatus,
    paymentMethod,
    paymentRef,
    bookingStatus,
    notes,
    source,
  } = parsed.data;

  // Capacity check
  const currentOccupancy = event.registrations
    .filter((r) => r.bookingStatus !== "CANCELLED")
    .reduce((sum, r) => sum + r.ticketCount, 0);

  if (currentOccupancy + ticketCount > event.capacity) {
    return fail(409, `Exceeds capacity. Only ${event.capacity - currentOccupancy} seats remain.`);
  }

  // Price calculation
  const unitPrice = event.isPaid ? Number(event.ticketPrice) : 0;
  const totalAmount = unitPrice * ticketCount;
  const computedPaymentStatus = event.isPaid ? paymentStatus : "FREE";
  const computedPaymentMethod = event.isPaid ? paymentMethod : "FREE";

  const bookingReference = `BK-EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const booking = await db.eventRegistration.create({
    data: {
      bookingReference,
      eventId,
      userId: userId || null,
      ticketCount,
      unitPrice,
      totalAmount,
      currency: currency || event.currency,
      paymentStatus: computedPaymentStatus,
      paymentMethod: computedPaymentMethod,
      paymentRef: paymentRef || null,
      bookingStatus,
      attendeeName,
      attendeeEmail,
      attendeePhone: attendeePhone || null,
      notes: notes || null,
      source: source || "ADMIN_DESK",
    },
    include: {
      event: true,
      user: { include: { profile: true } },
    },
  });

  // Update registeredCount on event
  await db.alumniEvent.update({
    where: { id: eventId },
    data: { registeredCount: { increment: ticketCount } },
  });

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });
  const { ipAddress, location: loc, deviceInfo } = requestMeta(req);

  await writeAuditLog({
    actorAdminId: session.sub,
    actorName: admin?.name ?? "Admin",
    actorEmail: admin?.email ?? "admin@ipam.edu",
    actorRole: admin?.role.name ?? "Administrator",
    action: "EVENT_BOOKING_CREATED",
    actionLabel: "Event Booking Created",
    category: "COMMERCIAL_FINANCE",
    target: booking.bookingReference,
    targetType: "EventRegistration",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location: loc,
    deviceInfo,
    details: `Manual booking ${booking.bookingReference} for "${event.title}": ${ticketCount} ticket(s) for ${attendeeName} (${attendeeEmail}). Payment: ${computedPaymentStatus} (${computedPaymentMethod}). Total: $${totalAmount}.`,
    afterState: booking as unknown as Prisma.InputJsonValue,
  });

  return ok(booking, 201);
}
