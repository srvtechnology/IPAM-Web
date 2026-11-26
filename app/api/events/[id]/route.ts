import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { getAlumniSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.alumniEvent.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return fail(404, "Event not found");

  const session = await getAlumniSession(req);
  let registered = false;
  let registrationRef: string | null = null;
  let registrationTicketCount = 1;
  let registrationPaymentStatus: string | null = null;

  if (session) {
    const reg = await db.eventRegistration.findFirst({
      where: { eventId: id, userId: session.sub, bookingStatus: { not: "CANCELLED" } },
    });
    if (reg) {
      registrationRef = reg.bookingReference;
      registrationTicketCount = reg.ticketCount;
      registrationPaymentStatus = reg.paymentStatus;
      registered = reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE";
    }
  }

  return ok({
    ...event,
    ticketPrice: Number(event.ticketPrice),
    registeredCount: event._count.registrations,
    _count: undefined,
    registered,
    registrationRef,
    registrationTicketCount,
    registrationPaymentStatus,
  });
}
