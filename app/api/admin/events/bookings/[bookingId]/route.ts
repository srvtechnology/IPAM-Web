import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { updateBookingSchema } from "@/lib/validation/events";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { bookingId } = await params;
  const booking = await db.eventRegistration.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      user: { include: { profile: true } },
    },
  });

  if (!booking) return fail(404, "Booking not found");

  return ok({
    ...booking,
    unitPrice: Number(booking.unitPrice),
    totalAmount: Number(booking.totalAmount),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { bookingId } = await params;
  const existing = await db.eventRegistration.findUnique({
    where: { id: bookingId },
    include: { event: true },
  });
  if (!existing) return fail(404, "Booking not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateBookingSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };

  // If status changed to ATTENDED, auto-set attendedAt if not provided
  if (parsed.data.bookingStatus === "ATTENDED" && !parsed.data.attendedAt) {
    updateData.attendedAt = new Date();
  } else if (parsed.data.bookingStatus === "CONFIRMED" && existing.bookingStatus === "ATTENDED") {
    updateData.attendedAt = null;
  }

  // If status is transitioning to/from CANCELLED, adjust registeredCount on AlumniEvent
  if (parsed.data.bookingStatus === "CANCELLED" && existing.bookingStatus !== "CANCELLED") {
    await db.alumniEvent.update({
      where: { id: existing.eventId },
      data: { registeredCount: { decrement: existing.ticketCount } },
    });
  } else if (existing.bookingStatus === "CANCELLED" && parsed.data.bookingStatus && parsed.data.bookingStatus !== "CANCELLED") {
    await db.alumniEvent.update({
      where: { id: existing.eventId },
      data: { registeredCount: { increment: existing.ticketCount } },
    });
  }

  const updated = await db.eventRegistration.update({
    where: { id: bookingId },
    data: updateData,
    include: {
      event: true,
      user: { include: { profile: true } },
    },
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
    action: "EVENT_BOOKING_UPDATED",
    actionLabel: "Event Booking Updated",
    category: "COMMERCIAL_FINANCE",
    target: existing.bookingReference,
    targetType: "EventRegistration",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location: loc,
    deviceInfo,
    details: `Updated booking ${existing.bookingReference} for "${existing.event.title}". Status: ${updated.bookingStatus}, Payment: ${updated.paymentStatus}.`,
    beforeState: existing as unknown as Prisma.InputJsonValue,
    afterState: updated as unknown as Prisma.InputJsonValue,
  });

  return ok({
    ...updated,
    unitPrice: Number(updated.unitPrice),
    totalAmount: Number(updated.totalAmount),
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { bookingId } = await params;
  const existing = await db.eventRegistration.findUnique({
    where: { id: bookingId },
    include: { event: true },
  });
  if (!existing) return fail(404, "Booking not found");

  if (existing.bookingStatus !== "CANCELLED") {
    await db.alumniEvent.update({
      where: { id: existing.eventId },
      data: { registeredCount: { decrement: existing.ticketCount } },
    });
  }

  await db.eventRegistration.delete({ where: { id: bookingId } });

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
    action: "EVENT_BOOKING_DELETED",
    actionLabel: "Event Booking Deleted",
    category: "COMMERCIAL_FINANCE",
    target: existing.bookingReference,
    targetType: "EventRegistration",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location: loc,
    deviceInfo,
    details: `Deleted booking ${existing.bookingReference} for "${existing.event.title}".`,
    beforeState: existing as unknown as Prisma.InputJsonValue,
  });

  return ok({ deleted: true, bookingId });
}
