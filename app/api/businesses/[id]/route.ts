import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { updateBusinessSchema } from "@/lib/validation/businesses";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");

  if (business.status !== "APPROVED") {
    const adminSession = await getAdminSession();
    const alumniSession = await getAlumniSession();
    const isOwner = alumniSession && business.userId === alumniSession.sub;
    if (!adminSession && !isOwner) {
      return fail(404, "Business not found or pending review");
    }
  }

  return ok(business);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  const isOwner = alumniSession && business.userId === alumniSession.sub;
  const isAdmin = !!adminSession;

  if (!isAdmin && !isOwner) {
    return fail(403, "You do not have permission to modify this business listing");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  // Update data construction
  const updateData: Record<string, unknown> = {
    ...parsed.data,
    updatedAt: new Date(),
  };

  if (!isAdmin) {
    // Alumni cannot elevate status or self-feature
    delete updateData.featured;

    // If an alumni edits a rejected listing, set back to PENDING_APPROVAL for re-review
    if (business.status === "REJECTED") {
      updateData.status = "PENDING_APPROVAL";
      updateData.rejectionReason = null;
    } else {
      delete updateData.status;
      delete updateData.rejectionReason;
    }
  }

  const updated = await db.alumniBusiness.update({
    where: { id },
    data: updateData as any,
  });

  if (isAdmin) {
    const roleName = (await db.adminRoleDefinition.findUnique({
      where: { id: adminSession.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

    const adminUser = await db.adminUser.findUnique({
      where: { id: adminSession.sub },
      select: { name: true },
    });
    const actorName = adminUser?.name ?? "Administrator";

    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: adminSession.sub,
      actorName,
      actorEmail: adminSession.email,
      actorRole: roleName,
      action: "ALUMNI_BUSINESS_UPDATED",
      actionLabel: "Admin Updated Alumni Business Listing",
      category: "COMMERCIAL_FINANCE",
      target: `Business: ${updated.name} (${updated.id})`,
      targetType: "Alumni Business",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Admin updated listing details for "${updated.name}". Status: ${updated.status}.`,
    });
  }

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  const isOwner = alumniSession && business.userId === alumniSession.sub;
  const isAdmin = !!adminSession;

  if (!isAdmin && !isOwner) {
    return fail(403, "You do not have permission to delete this business listing");
  }

  await db.alumniBusiness.delete({ where: { id } });

  if (isAdmin) {
    const roleName = (await db.adminRoleDefinition.findUnique({
      where: { id: adminSession.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

    const adminUser = await db.adminUser.findUnique({
      where: { id: adminSession.sub },
      select: { name: true },
    });
    const actorName = adminUser?.name ?? "Administrator";

    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: adminSession.sub,
      actorName,
      actorEmail: adminSession.email,
      actorRole: roleName,
      action: "ALUMNI_BUSINESS_DELETED",
      actionLabel: "Admin Deleted Alumni Business Listing",
      category: "COMMERCIAL_FINANCE",
      target: `Business: ${business.name} (${business.id})`,
      targetType: "Alumni Business",
      status: "SUCCESS",
      severity: "WARNING",
      ipAddress,
      location,
      deviceInfo,
      details: `Admin removed business "${business.name}" from directory.`,
    });
  }

  return ok({ success: true, id });
}
