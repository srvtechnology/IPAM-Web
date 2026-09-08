import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName = (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ?? "Admin";

  const { id } = await params;
  const existing = await db.sponsorBanner.findUnique({ where: { id } });
  if (!existing) return fail(404, "Banner not found");

  const banner = await db.sponsorBanner.update({
    where: { id },
    data: { active: !existing.active },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "SPONSOR_BANNER_TOGGLED",
    actionLabel: banner.active ? "Banner Activated" : "Banner Paused",
    category: "COMMERCIAL_FINANCE",
    target: `Banner: ${banner.name} (${banner.code})`,
    targetType: "Sponsor Banner",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Banner "${banner.name}" ${banner.active ? "activated" : "paused"}.`,
    beforeState: { active: existing.active },
    afterState: { active: banner.active },
  });

  return ok(banner);
}
