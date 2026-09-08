import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createRoleSchema } from "@/lib/validation/rbac";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const roles = await db.adminRoleDefinition.findMany({
    include: { permissions: true, _count: { select: { users: true } } },
    orderBy: { priorityLevel: "asc" },
  });
  return ok(roles);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createRoleSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existingSlug = await db.adminRoleDefinition.findUnique({ where: { slug: parsed.data.slug } });
  if (existingSlug) return fail(409, "A role with this slug already exists");

  const role = await db.adminRoleDefinition.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      badgeColor: parsed.data.badgeColor ?? "PRIMARY",
      priorityLevel: parsed.data.priorityLevel,
      isSystemDefault: false,
      permissions: { create: parsed.data.permissions },
    },
    include: { permissions: true },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "RBAC_ROLE_CREATED",
    actionLabel: "Admin Role Created",
    category: "SECURITY_RBAC",
    target: `Role: ${role.name}`,
    targetType: "Admin Role",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `Created role "${role.name}" (${role.slug}) with ${role.permissions.length} module permission rows.`,
    afterState: { name: role.name, slug: role.slug, permissions: parsed.data.permissions },
  });

  return ok(role, 201);
}
