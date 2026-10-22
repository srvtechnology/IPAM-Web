import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const registrations = await db.eventRegistration.findMany({
    where: {
      userId: session.sub,
    },
    include: {
      event: true,
    },
    orderBy: {
      registeredAt: "desc",
    },
  });

  return ok(
    registrations.map((reg) => ({
      id: reg.id,
      bookingReference: reg.bookingReference,
      ticketCount: reg.ticketCount,
      unitPrice: Number(reg.unitPrice),
      totalAmount: Number(reg.totalAmount),
      currency: reg.currency,
      paymentStatus: reg.paymentStatus,
      paymentMethod: reg.paymentMethod,
      bookingStatus: reg.bookingStatus,
      attendeeName: reg.attendeeName,
      attendeeEmail: reg.attendeeEmail,
      attendeePhone: reg.attendeePhone,
      notes: reg.notes,
      registeredAt: reg.registeredAt.toISOString(),
      event: {
        id: reg.event.id,
        title: reg.event.title,
        description: reg.event.description,
        date: reg.event.date.toISOString(),
        location: reg.event.location,
        category: reg.event.category,
        capacity: reg.event.capacity,
        registeredCount: reg.event.registeredCount,
        bannerImage: reg.event.bannerImage,
        image: reg.event.bannerImage,
        isPaid: reg.event.isPaid,
        ticketPrice: Number(reg.event.ticketPrice),
        currency: reg.event.currency,
      },
    }))
  );
}
