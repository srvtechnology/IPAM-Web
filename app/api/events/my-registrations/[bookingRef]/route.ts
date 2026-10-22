import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingRef: string }> }
) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const { bookingRef } = await params;

  const reg = await db.eventRegistration.findFirst({
    where: {
      bookingReference: bookingRef,
      userId: session.sub,
    },
    include: { event: true },
  });

  if (!reg) return fail(404, "Event registration not found");

  return ok({
    ...reg,
    unitPrice: Number(reg.unitPrice),
    totalAmount: Number(reg.totalAmount),
    event: {
      ...reg.event,
      ticketPrice: Number(reg.event.ticketPrice),
    },
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ bookingRef: string }> }
) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const { bookingRef } = await params;

  const reg = await db.eventRegistration.findFirst({
    where: {
      bookingReference: bookingRef,
      userId: session.sub,
    },
    include: { event: true },
  });

  if (!reg) return fail(404, "Event registration not found");
  if (reg.bookingStatus === "CANCELLED") {
    return fail(400, "Registration is already cancelled");
  }

  // Check if event has already passed
  if (new Date(reg.event.date) < new Date()) {
    return fail(400, "Cannot cancel registration for a past event");
  }

  await db.$transaction([
    db.eventRegistration.update({
      where: { id: reg.id },
      data: { bookingStatus: "CANCELLED" },
    }),
    db.alumniEvent.update({
      where: { id: reg.eventId },
      data: {
        registeredCount: {
          decrement: Math.min(reg.ticketCount, reg.event.registeredCount),
        },
      },
    }),
  ]);

  return ok({ message: "Registration cancelled successfully", bookingReference: bookingRef });
}
