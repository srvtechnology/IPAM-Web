import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return fail(401, "Not authenticated");

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: { include: { permissions: true } } },
  });
  if (!admin || admin.status !== "ACTIVE") return fail(401, "Not authenticated");

  const { passwordHash: _omit, ...safeAdmin } = admin;
  return ok({ admin: safeAdmin, permissions: getEffectivePermissions(admin) });
}
