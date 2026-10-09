import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { updateEventSchema } from "@/lib/validation/events";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;

  const event = await db.alumniEvent.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { registeredAt: "desc" },
      },
    },
  });

  if (!event) return fail(404, "Event not found");

  const totalBookedSeats = event.registrations
    .filter((r) => r.bookingStatus !== "CANCELLED")
    .reduce((sum, r) => sum + r.ticketCount, 0);

  const totalRevenue = event.registrations
    .filter((r) => r.bookingStatus !== "CANCELLED" && r.paymentStatus === "PAID")
    .reduce((sum, r) => sum + Number(r.totalAmount), 0);

  return ok({
    ...event,
    ticketPrice: Number(event.ticketPrice),
    totalBookedSeats,
    totalRevenue,
    registrations: event.registrations.map((r) => ({
      id: r.id,
      bookingReference: r.bookingReference,
      ticketCount: r.ticketCount,
      unitPrice: Number(r.unitPrice),
      totalAmount: Number(r.totalAmount),
      currency: r.currency,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      paymentRef: r.paymentRef,
      bookingStatus: r.bookingStatus,
      attendedAt: r.attendedAt?.toISOString() || null,
      attendeeName: r.attendeeName || r.user?.profile?.name || "Anonymous",
      attendeeEmail: r.attendeeEmail || r.user?.email || "",
      attendeePhone: r.attendeePhone || "",
      notes: r.notes,
      source: r.source,
      registeredAt: r.registeredAt.toISOString(),
      user: r.user
        ? {
            id: r.user.id,
            email: r.user.email,
            studentId: r.user.studentId,
            membershipTier: r.user.membershipTier,
            profile: r.user.profile
              ? {
                  name: r.user.profile.name,
                  classYear: r.user.profile.classYear,
                  degree: r.user.profile.degree,
                  company: r.user.profile.company,
                  currentRole: r.user.profile.currentRole,
                  avatar: r.user.profile.avatar,
                }
              : null,
          }
        : null,
    })),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const existing = await db.alumniEvent.findUnique({ where: { id } });
  if (!existing) return fail(404, "Event not found");

  const dataToUpdate: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.date) {
    dataToUpdate.date = new Date(parsed.data.date);
  }
  if (parsed.data.isPaid !== undefined) {
    dataToUpdate.isPaid = parsed.data.isPaid;
    if (!parsed.data.isPaid) {
      dataToUpdate.ticketPrice = 0;
    }
  }
  if (parsed.data.bannerImages !== undefined || parsed.data.bannerImage !== undefined) {
    const rawImages = parsed.data.bannerImages !== undefined
      ? parsed.data.bannerImages
      : (existing.bannerImages as string[]) || [];

    let bannerImagesArr = Array.isArray(rawImages)
      ? rawImages.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
      : [];

    let defaultImg = parsed.data.bannerImage !== undefined
      ? parsed.data.bannerImage?.trim()
      : existing.bannerImage;

    if (!defaultImg && bannerImagesArr.length > 0) {
      defaultImg = bannerImagesArr[0];
    }
    if (defaultImg && !bannerImagesArr.includes(defaultImg)) {
      bannerImagesArr = [defaultImg, ...bannerImagesArr];
    }

    dataToUpdate.bannerImage = defaultImg || "/images/alumni_gala_event_1788454750646.jpg";
    dataToUpdate.bannerImages = bannerImagesArr.length > 0 ? bannerImagesArr : [dataToUpdate.bannerImage];
  }

  const updated = await db.alumniEvent.update({
    where: { id },
    data: dataToUpdate,
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
      action: "EVENT_UPDATED",
      actionLabel: "Event Updated",
      category: "COMMERCIAL_FINANCE",
      target: updated.title,
      targetType: "AlumniEvent",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location: loc,
      deviceInfo,
      details: `Updated event "${updated.title}". Status: ${updated.status}. Price: ${updated.isPaid ? `$${updated.ticketPrice}` : "Free"}.`,
      beforeState: existing as unknown as Prisma.InputJsonValue,
      afterState: updated as unknown as Prisma.InputJsonValue,
    });
  } catch (auditErr) {
    console.error("Non-fatal: Failed to write audit log for event update:", auditErr);
  }

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const existing = await db.alumniEvent.findUnique({ where: { id } });
  if (!existing) return fail(404, "Event not found");

  await db.eventRegistration.deleteMany({ where: { eventId: id } });
  await db.alumniEvent.delete({ where: { id } });

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
      action: "EVENT_DELETED",
      actionLabel: "Event Deleted",
      category: "COMMERCIAL_FINANCE",
      target: existing.title,
      targetType: "AlumniEvent",
      status: "SUCCESS",
      severity: "WARNING",
      ipAddress,
      location: loc,
      deviceInfo,
      details: `Deleted event "${existing.title}".`,
      beforeState: existing as unknown as Prisma.InputJsonValue,
    });
  } catch (auditErr) {
    console.error("Non-fatal: Failed to write audit log for event deletion:", auditErr);
  }

  return ok({ deleted: true, id });
}
