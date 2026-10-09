import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const paymentStatus = searchParams.get("paymentStatus");
  const bookingStatus = searchParams.get("bookingStatus");
  const search = searchParams.get("search")?.trim().toLowerCase();

  const whereClause: Prisma.EventRegistrationWhereInput = {};

  if (eventId && eventId !== "ALL") {
    whereClause.eventId = eventId;
  }
  if (paymentStatus && paymentStatus !== "ALL") {
    whereClause.paymentStatus = paymentStatus;
  }
  if (bookingStatus && bookingStatus !== "ALL") {
    whereClause.bookingStatus = bookingStatus;
  }
  if (search) {
    whereClause.OR = [
      { bookingReference: { contains: search } },
      { attendeeName: { contains: search } },
      { attendeeEmail: { contains: search } },
      { attendeePhone: { contains: search } },
      { user: { email: { contains: search } } },
      { user: { studentId: { contains: search } } },
      { user: { profile: { name: { contains: search } } } },
      { event: { title: { contains: search } } },
    ];
  }

  const bookings = await db.eventRegistration.findMany({
    where: whereClause,
    include: {
      event: {
        select: {
          id: true,
          title: true,
          displayDate: true,
          time: true,
          location: true,
          isPaid: true,
          ticketPrice: true,
          currency: true,
          capacity: true,
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: { registeredAt: "desc" },
  });

  const formatted = bookings.map((b) => ({
    id: b.id,
    bookingReference: b.bookingReference,
    eventId: b.eventId,
    eventTitle: b.event.title,
    eventDate: b.event.displayDate,
    eventLocation: b.event.location,
    eventIsPaid: b.event.isPaid,
    ticketCount: b.ticketCount,
    unitPrice: Number(b.unitPrice),
    totalAmount: Number(b.totalAmount),
    currency: b.currency,
    paymentStatus: b.paymentStatus,
    paymentMethod: b.paymentMethod,
    paymentRef: b.paymentRef,
    bookingStatus: b.bookingStatus,
    attendedAt: b.attendedAt ? b.attendedAt.toISOString() : null,
    attendeeName: b.attendeeName || b.user?.profile?.name || b.user?.email || "Guest Attendee",
    attendeeEmail: b.attendeeEmail || b.user?.email || "N/A",
    attendeePhone: b.attendeePhone || null,
    notes: b.notes,
    source: b.source,
    registeredAt: b.registeredAt.toISOString(),
    user: b.user
      ? {
          id: b.user.id,
          email: b.user.email,
          studentId: b.user.studentId,
          membershipTier: b.user.membershipTier,
          name: b.user.profile?.name,
          classYear: b.user.profile?.classYear,
          degree: b.user.profile?.degree,
          company: b.user.profile?.company,
          currentRole: b.user.profile?.currentRole,
          avatar: b.user.profile?.avatar,
        }
      : null,
  }));

  return ok(formatted);
}
