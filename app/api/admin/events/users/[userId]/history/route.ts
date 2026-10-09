import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { userId } = await params;

  const user = await db.alumniUser.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user) return fail(404, "Alumni user not found");

  const registrations = await db.eventRegistration.findMany({
    where: { userId },
    include: {
      event: true,
    },
    orderBy: { registeredAt: "desc" },
  });

  const totalSpent = registrations
    .filter((r) => r.bookingStatus !== "CANCELLED" && r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const totalTickets = registrations
    .filter((r) => r.bookingStatus !== "CANCELLED")
    .reduce((sum, r) => sum + r.ticketCount, 0);

  return ok({
    user: {
      id: user.id,
      email: user.email,
      studentId: user.studentId,
      status: user.status,
      membershipTier: user.membershipTier,
      name: user.profile?.name || user.email,
      avatar: user.profile?.avatar,
      classYear: user.profile?.classYear,
      degree: user.profile?.degree,
      company: user.profile?.company,
      currentRole: user.profile?.currentRole,
      location: user.profile?.location,
    },
    totalSpent,
    totalTickets,
    bookingsCount: registrations.length,
    bookings: registrations.map((r) => ({
      id: r.id,
      bookingReference: r.bookingReference,
      eventId: r.eventId,
      eventTitle: r.event.title,
      eventDate: r.event.displayDate,
      eventTime: r.event.time,
      eventLocation: r.event.location,
      eventCategory: r.event.category,
      isPaid: r.event.isPaid,
      ticketCount: r.ticketCount,
      unitPrice: Number(r.unitPrice),
      totalAmount: Number(r.totalAmount),
      currency: r.currency,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      paymentRef: r.paymentRef,
      bookingStatus: r.bookingStatus,
      attendedAt: r.attendedAt ? r.attendedAt.toISOString() : null,
      notes: r.notes,
      source: r.source,
      registeredAt: r.registeredAt.toISOString(),
    })),
  });
}
