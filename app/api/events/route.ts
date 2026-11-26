import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const isPaidParam = searchParams.get("isPaid");
  const upcoming = searchParams.get("upcoming") === "true";

  const events = await db.alumniEvent.findMany({
    where: {
      ...(category && category !== "ALL" && category !== "All" ? { category: category as never } : {}),
      ...(isPaidParam === "true" ? { isPaid: true } : isPaidParam === "false" ? { isPaid: false } : {}),
      ...(upcoming ? { date: { gte: new Date() } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { location: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: { registrations: true } },
    },
    orderBy: { date: "asc" },
  });

  const registeredEventMap = new Map<string, { bookingReference: string; ticketCount: number; paymentStatus: string }>();
  if (session) {
    const regs = await db.eventRegistration.findMany({
      where: {
        userId: session.sub,
        bookingStatus: { not: "CANCELLED" },
      },
      select: {
        eventId: true,
        bookingReference: true,
        ticketCount: true,
        paymentStatus: true,
      },
    });
    for (const r of regs) {
      registeredEventMap.set(r.eventId, r);
    }
  }

  return ok(
    events.map((e) => {
      const reg = registeredEventMap.get(e.id);
      const isConfirmed = reg ? reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE" : false;
      return {
        ...e,
        ticketPrice: Number(e.ticketPrice),
        registeredCount: e._count.registrations,
        _count: undefined,
        registered: isConfirmed,
        registrationRef: reg?.bookingReference || null,
        registrationTicketCount: reg?.ticketCount || 1,
        registrationPaymentStatus: reg?.paymentStatus || null,
      };
    })
  );
}
