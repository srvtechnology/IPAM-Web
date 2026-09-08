import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateAdminUserSchema } from "@/lib/validation/rbac";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const user = await db.adminUser.findUnique({ where: { id }, include: { role: true } });
  if (!user) return fail(404, "Admin user not found");
  const { passwordHash: _passwordHash, ...safe } = user;
  return ok(safe);
}

// No DELETE: an AdminUser can be referenced by AuditLogEntry.actorAdminId
// (onDelete: SetNull), so a hard delete is *technically* safe, but
// permanently destroying an account's identity/history is riskier than
// necessary when a reversible SUSPENDED status achieves the same access
// revocation. Use PATCH { status: "SUSPENDED" } instead.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateAdminUserSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.adminUser.findUnique({ where: { id }, include: { role: true } });
  if (!existing) return fail(404, "Admin user not found");

  if (parsed.data.roleId) {
    const role = await db.adminRoleDefinition.findUnique({ where: { id: parsed.data.roleId } });
    if (!role) return fail(400, "Selected role does not exist");
  }

  const { roleId, customPermissionOverrides, ...rest } = parsed.data;
  const updated = await db.adminUser.update({
    where: { id },
    data: {
      ...rest,
      ...(roleId ? { role: { connect: { id: roleId } } } : {}),
      ...(customPermissionOverrides !== undefined
        ? { customPermissionOverrides: customPermissionOverrides === null ? Prisma.JsonNull : customPermissionOverrides }
        : {}),
    },
    include: { role: true },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);

  const roleChanged = parsed.data.roleId && parsed.data.roleId !== existing.roleId;
  const statusChanged = parsed.data.status && parsed.data.status !== existing.status;

  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: roleChanged ? "RBAC_ROLE_REASSIGNED" : statusChanged ? "RBAC_USER_STATUS_CHANGED" : "RBAC_USER_UPDATED",
    actionLabel: roleChanged
      ? "Admin Role Reassigned"
      : statusChanged
      ? "Admin Account Status Changed"
      : "Admin User Updated",
    category: "SECURITY_RBAC",
    target: `Admin: ${existing.name} (${existing.email})`,
    targetType: "Admin User",
    status: "SUCCESS",
    severity: roleChanged || statusChanged ? "WARNING" : "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated admin user "${existing.name}".`,
    beforeState: { roleId: existing.roleId, roleName: existing.role.name, status: existing.status },
    afterState: { roleId: updated.roleId, roleName: updated.role.name, status: updated.status },
  });

  const { passwordHash: _unused, ...safe } = updated;
  return ok(safe);
}
