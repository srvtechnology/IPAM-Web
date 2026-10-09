import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { createEventSchema } from "@/lib/validation/events";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const events = await db.alumniEvent.findMany({
    include: {
      registrations: {
        select: {
          id: true,
          ticketCount: true,
          totalAmount: true,
          paymentStatus: true,
          bookingStatus: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });

  const formatted = events.map((ev) => {
    const totalBookedSeats = ev.registrations
      .filter((r) => r.bookingStatus !== "CANCELLED")
      .reduce((sum, r) => sum + r.ticketCount, 0);

    const totalRevenue = ev.registrations
      .filter((r) => r.bookingStatus !== "CANCELLED" && r.paymentStatus === "PAID")
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    const pendingRevenue = ev.registrations
      .filter((r) => r.bookingStatus !== "CANCELLED" && r.paymentStatus === "PENDING")
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    return {
      id: ev.id,
      title: ev.title,
      category: ev.category,
      date: ev.date.toISOString(),
      displayDate: ev.displayDate,
      time: ev.time,
      location: ev.location,
      venueDetails: ev.venueDetails,
      isVirtual: ev.isVirtual,
      virtualLink: ev.virtualLink,
      isPaid: ev.isPaid,
      ticketPrice: Number(ev.ticketPrice),
      currency: ev.currency,
      capacity: ev.capacity,
      registeredCount: ev.registeredCount,
      totalBookedSeats,
      totalRevenue,
      pendingRevenue,
      dressCode: ev.dressCode,
      description: ev.description,
      agenda: ev.agenda,
      speakers: ev.speakers,
      highlights: ev.highlights,
      faqs: ev.faqs,
      status: ev.status,
      featured: ev.featured,
      bannerImage: ev.bannerImage || "/images/alumni_gala_event_1788454750646.jpg",
      bannerImages: Array.isArray(ev.bannerImages) && (ev.bannerImages as string[]).length > 0
        ? (ev.bannerImages as string[])
        : [ev.bannerImage || "/images/alumni_gala_event_1788454750646.jpg"],
      createdAt: ev.createdAt.toISOString(),
      updatedAt: ev.updatedAt.toISOString(),
      bookingsCount: ev.registrations.length,
    };
  });

  return ok(formatted);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const {
    title,
    category,
    date,
    displayDate,
    time,
    location,
    venueDetails,
    isVirtual,
    virtualLink,
    isPaid,
    ticketPrice,
    currency,
    capacity,
    dressCode,
    description,
    bannerImage,
    bannerImages,
    agenda,
    speakers,
    highlights,
    faqs,
    status,
    featured,
  } = parsed.data;

  const DEFAULT_BANNER = "/images/alumni_gala_event_1788454750646.jpg";

  let finalBannerImages: string[] = [];
  if (Array.isArray(bannerImages) && bannerImages.length > 0) {
    finalBannerImages = bannerImages.filter(
      (img): img is string => typeof img === "string" && img.trim().length > 0
    );
  }

  let finalDefaultBanner = bannerImage?.trim() || "";
  if (!finalDefaultBanner && finalBannerImages.length > 0) {
    finalDefaultBanner = finalBannerImages[0];
  }
  if (!finalDefaultBanner) {
    finalDefaultBanner = DEFAULT_BANNER;
  }
  if (!finalBannerImages.includes(finalDefaultBanner)) {
    finalBannerImages = [finalDefaultBanner, ...finalBannerImages];
  }

  const event = await db.alumniEvent.create({
    data: {
      title,
      category,
      date: new Date(date),
      displayDate,
      time,
      location,
      venueDetails: venueDetails || null,
      isVirtual,
      virtualLink: virtualLink || null,
      isPaid,
      ticketPrice: isPaid ? ticketPrice : 0,
      currency,
      capacity,
      registeredCount: 0,
      dressCode: dressCode || null,
      description,
      bannerImage: finalDefaultBanner,
      bannerImages: finalBannerImages,
      agenda: agenda || undefined,
      speakers: speakers || undefined,
      highlights: highlights || undefined,
      faqs: faqs || undefined,
      status,
      featured,
    },
  });

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });
  const { ipAddress, location: loc, deviceInfo } = requestMeta(req);

  try {
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: admin?.name ?? "Admin",
      actorEmail: admin?.email ?? "admin@ipam.edu",
      actorRole: admin?.role.name ?? "Administrator",
      action: "EVENT_CREATED",
      actionLabel: "Event Created",
      category: "COMMERCIAL_FINANCE",
      target: event.title,
      targetType: "AlumniEvent",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location: loc,
      deviceInfo,
      details: `Created new event "${event.title}" (${event.category}) - ${isPaid ? `Paid ($${ticketPrice})` : "Free/Unpaid"}. Capacity: ${capacity}.`,
      afterState: event as unknown as Prisma.InputJsonValue,
    });
  } catch (auditErr) {
    console.error("Non-fatal: Failed to write audit log for event creation:", auditErr);
  }

  return ok(event, 201);
}
