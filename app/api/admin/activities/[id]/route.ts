import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { updateActivitySchema, normalizeActivityPhotos } from "@/lib/validation/activities";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(req);
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const existing = await db.alumniActivity.findUnique({ where: { id } });
  if (!existing) return fail(404, "Activity not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateActivitySchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const updated = await db.alumniActivity.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.displayDate !== undefined ? { displayDate: parsed.data.displayDate || null } : {}),
      ...(parsed.data.location !== undefined ? { location: parsed.data.location || null } : {}),
      ...(parsed.data.category !== undefined ? { category: parsed.data.category || null } : {}),
      ...(parsed.data.photos !== undefined ? { photos: parsed.data.photos } : {}),
      ...(parsed.data.featured !== undefined ? { featured: parsed.data.featured } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
  });

  try {
    const adminUser = await db.adminUser.findUnique({
      where: { id: session.sub },
      include: { role: true },
    });
    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: adminUser?.name ?? "Admin",
      actorEmail: session.email,
      actorRole: adminUser?.role?.name ?? "Admin",
      action: "ACTIVITY_UPDATED",
      actionLabel: "Activity Gallery Updated",
      category: "SYSTEM_CORE",
      target: `Activity: ${updated.title} (${updated.id})`,
      targetType: "AlumniActivity",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Updated activity "${updated.title}" (${updated.status}).`,
      beforeState: { title: existing.title, status: existing.status },
      afterState: { title: updated.title, status: updated.status },
    });
  } catch (err) {
    console.error("Failed to write audit log for activity update:", err);
  }

  return ok({
    ...updated,
    photos: normalizeActivityPhotos(updated.photos),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession(req);
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const existing = await db.alumniActivity.findUnique({ where: { id } });
  if (!existing) return fail(404, "Activity not found");

  await db.alumniActivity.delete({ where: { id } });

  try {
    const adminUser = await db.adminUser.findUnique({
      where: { id: session.sub },
      include: { role: true },
    });
    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: adminUser?.name ?? "Admin",
      actorEmail: session.email,
      actorRole: adminUser?.role?.name ?? "Admin",
      action: "ACTIVITY_DELETED",
      actionLabel: "Activity Gallery Deleted",
      category: "SYSTEM_CORE",
      target: `Activity: ${existing.title} (${existing.id})`,
      targetType: "AlumniActivity",
      status: "SUCCESS",
      severity: "WARNING",
      ipAddress,
      location,
      deviceInfo,
      details: `Deleted activity gallery "${existing.title}".`,
      beforeState: { id: existing.id, title: existing.title, status: existing.status },
    });
  } catch (err) {
    console.error("Failed to write audit log for activity delete:", err);
  }

  return ok({ deleted: true, id });
}
