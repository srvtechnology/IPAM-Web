import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateRoleSchema } from "@/lib/validation/rbac";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const role = await db.adminRoleDefinition.findUnique({
    where: { id },
    include: { permissions: true, _count: { select: { users: true } } },
  });
  if (!role) return fail(404, "Role not found");
  return ok(role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateRoleSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.adminRoleDefinition.findUnique({ where: { id }, include: { permissions: true } });
  if (!existing) return fail(404, "Role not found");

  const { permissions, ...scalarFields } = parsed.data;

  const updated = await db.$transaction(async (tx) => {
    const role = await tx.adminRoleDefinition.update({
      where: { id },
      data: scalarFields,
    });

    if (permissions) {
      for (const p of permissions) {
        await tx.roleModulePermission.upsert({
          where: { roleId_module: { roleId: id, module: p.module } },
          create: { roleId: id, ...p },
          update: { ...p },
        });
      }
    }

    return tx.adminRoleDefinition.findUniqueOrThrow({ where: { id }, include: { permissions: true } });
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "RBAC_ROLE_UPDATED",
    actionLabel: "Admin Role Permissions Updated",
    category: "SECURITY_RBAC",
    target: `Role: ${existing.name}`,
    targetType: "Admin Role",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location,
    deviceInfo,
    details: `Updated role "${existing.name}" — this changes what every admin holding this role can do.`,
    beforeState: { name: existing.name, permissions: existing.permissions },
    afterState: { name: updated.name, permissions: updated.permissions },
  });

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canDelete");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const existing = await db.adminRoleDefinition.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) return fail(404, "Role not found");
  if (existing.isSystemDefault) return fail(400, "System default roles cannot be deleted");
  if (existing._count.users > 0) {
    return fail(400, `Cannot delete a role with ${existing._count.users} assigned admin user(s)`);
  }

  await db.adminRoleDefinition.delete({ where: { id } });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "RBAC_ROLE_DELETED",
    actionLabel: "Admin Role Deleted",
    category: "SECURITY_RBAC",
    target: `Role: ${existing.name}`,
    targetType: "Admin Role",
    status: "SUCCESS",
    severity: "CRITICAL",
    ipAddress,
    location,
    deviceInfo,
    details: `Deleted unused role "${existing.name}".`,
    beforeState: { name: existing.name },
  });

  return ok({ deleted: true });
}
