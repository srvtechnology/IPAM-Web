import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { updateBusinessSchema } from "@/lib/validation/businesses";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          email: true,
          studentId: true,
          profile: {
            select: {
              name: true,
              avatar: true,
              company: true,
            },
          },
        },
      },
    },
  });

  if (!business) return fail(404, "Business not found");
  return ok(business);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const roleName =
    (await db.adminRoleDefinition.findUnique({
      where: { id: admin.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateBusinessSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const prevStatus = business.status;
  const newStatus = parsed.data.status ?? business.status;

  const updated = await db.alumniBusiness.update({
    where: { id },
    data: {
      ...parsed.data,
      services: parsed.data.services ?? undefined,
      keyProducts: parsed.data.keyProducts ?? undefined,
      certifications: parsed.data.certifications ?? undefined,
      updatedAt: new Date(),
    } as any,
    include: {
      user: {
        select: {
          email: true,
          studentId: true,
          profile: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  const actionLabel =
    prevStatus !== newStatus
      ? `Business Status Changed: ${prevStatus} -> ${newStatus}`
      : "Admin Updated Alumni Business Listing";

  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: prevStatus !== newStatus ? "ALUMNI_BUSINESS_STATUS_UPDATED" : "ALUMNI_BUSINESS_UPDATED",
    actionLabel,
    category: "COMMERCIAL_FINANCE",
    target: `Business: ${updated.name} (${updated.id})`,
    targetType: "Alumni Business",
    status: "SUCCESS",
    severity: newStatus === "REJECTED" ? "WARNING" : "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Admin changed status of "${updated.name}" from ${prevStatus} to ${newStatus}. Rejection reason: ${updated.rejectionReason || "None"}.`,
    beforeState: { status: prevStatus },
    afterState: { status: newStatus, rejectionReason: updated.rejectionReason },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const roleName =
    (await db.adminRoleDefinition.findUnique({
      where: { id: admin.roleId },
      select: { name: true },
    }))?.name ?? "Admin";

  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");

  await db.alumniBusiness.delete({ where: { id } });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
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
    details: `Admin removed business "${business.name}" permanently.`,
  });

  return ok({ success: true, id });
}
