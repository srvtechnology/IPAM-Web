import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setAdminSessionCookie } from "@/lib/auth/session";
import { adminLoginSchema } from "@/lib/validation/auth";
import { ok, fail } from "@/lib/api-response";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const admin = await db.adminUser.findUnique({
    where: { email },
    include: { role: { include: { permissions: true } } },
  });
  if (!admin) return fail(401, "Invalid email or password");

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) return fail(401, "Invalid email or password");

  if (admin.status !== "ACTIVE") {
    return fail(403, `This admin account is ${admin.status.toLowerCase().replace("_", " ")}`);
  }

  const { ipAddress, deviceInfo } = requestMeta(req);

  await db.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
  });

  await setAdminSessionCookie({
    sub: admin.id,
    email: admin.email,
    roleId: admin.roleId,
    roleSlug: admin.role.slug,
  });

  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: admin.role.name,
    action: "admin.login",
    actionLabel: "Admin signed in",
    category: "SECURITY_RBAC",
    target: admin.email,
    targetType: "AdminUser",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location: "Unknown",
    deviceInfo,
    details: `${admin.name} signed in successfully.`,
  });

  const { passwordHash: _omit, ...safeAdmin } = admin;
  return ok({ admin: safeAdmin, permissions: getEffectivePermissions(admin) });
}
