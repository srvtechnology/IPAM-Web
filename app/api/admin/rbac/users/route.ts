import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createAdminUserSchema } from "@/lib/validation/rbac";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canRead");
  if (gate instanceof NextResponse) return gate;

  const users = await db.adminUser.findMany({
    include: { role: true },
    orderBy: { assignedDate: "desc" },
  });
  // never leak passwordHash
  const safe = users.map(({ passwordHash: _passwordHash, ...rest }) => rest);
  return ok(safe);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "RBAC_GOVERNANCE", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createAdminUserSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const existing = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  if (existing) return fail(409, "An admin user with this email already exists");

  const role = await db.adminRoleDefinition.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) return fail(400, "Selected role does not exist");

  const passwordHash = await hashPassword(parsed.data.password);
  const created = await db.adminUser.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      phone: parsed.data.phone,
      department: parsed.data.department,
      title: parsed.data.title,
      roleId: parsed.data.roleId,
      // Created with a real password via this form (no separate invite/activate
      // flow exists), so the account is immediately usable.
      status: "ACTIVE",
      assignedBy: admin.id,
    },
    include: { role: true },
  });

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "RBAC_ADMIN_USER_CREATED",
    actionLabel: "Admin User Provisioned",
    category: "SECURITY_RBAC",
    target: `Admin: ${created.name} (${created.email})`,
    targetType: "Admin User",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `Provisioned admin user "${created.name}" with role "${role.name}", status ACTIVE.`,
    afterState: { email: created.email, roleId: role.id, roleName: role.name },
  });

  const { passwordHash: _unused, ...safe } = created;
  return ok(safe, 201);
}
