import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import type { AdminUser, PermissionModule } from "@prisma/client";

export type Capability = "canRead" | "canWrite" | "canApprove" | "canExport" | "canDelete";

export type CapabilitySet = Record<Capability, boolean>;

const EMPTY_CAPABILITIES: CapabilitySet = {
  canRead: false,
  canWrite: false,
  canApprove: false,
  canExport: false,
  canDelete: false,
};

/**
 * Resolves the full effective permission matrix for an admin: role-level
 * RoleModulePermission rows, with any per-user customPermissionOverrides
 * merged on top per module/capability.
 */
export function getEffectivePermissions(
  admin: AdminUser & { role: { permissions: ({ module: PermissionModule } & CapabilitySet)[] } }
): Record<PermissionModule, CapabilitySet> {
  const result = {} as Record<PermissionModule, CapabilitySet>;
  const overrides = (admin.customPermissionOverrides ?? {}) as Partial<
    Record<PermissionModule, Partial<CapabilitySet>>
  >;

  for (const perm of admin.role.permissions) {
    const caps: CapabilitySet = {
      canRead: perm.canRead,
      canWrite: perm.canWrite,
      canApprove: perm.canApprove,
      canExport: perm.canExport,
      canDelete: perm.canDelete,
    };
    result[perm.module] = { ...EMPTY_CAPABILITIES, ...caps, ...(overrides[perm.module] ?? {}) };
  }

  return result;
}

/**
 * Loads the admin identified by the `x-admin-id` header (set by middleware
 * after verifying the admin JWT) and checks whether they hold `capability`
 * on `module`. Returns `{ admin }` on success, or a ready-to-return
 * NextResponse (401/403) on failure.
 */
export async function requirePermission(
  req: NextRequest,
  module: PermissionModule,
  capability: Capability
): Promise<{ admin: AdminUser & { role: { permissions: ({ module: PermissionModule } & CapabilitySet)[] } } } | NextResponse> {
  const adminId = req.headers.get("x-admin-id");
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await db.adminUser.findUnique({
    where: { id: adminId },
    include: { role: { include: { permissions: true } } },
  });

  if (!admin || admin.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const effective = getEffectivePermissions(admin);
  const moduleCaps = effective[module] ?? EMPTY_CAPABILITIES;

  if (!moduleCaps[capability]) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { admin };
}

/**
 * Server Component helper for gating a whole admin page (not just its
 * mutating API routes) behind a module capability — used for the most
 * sensitive screens (RBAC, Audit Trails) where even read access to the page
 * shell/data via a guessed URL should be blocked, not just hidden from nav.
 */
export async function checkPagePermission(
  module: PermissionModule,
  capability: Capability
): Promise<{ allowed: true } | { allowed: false }> {
  const session = await getAdminSession();
  if (!session) return { allowed: false };

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: { include: { permissions: true } } },
  });
  if (!admin || admin.status !== "ACTIVE") return { allowed: false };

  const effective = getEffectivePermissions(admin);
  const moduleCaps = effective[module] ?? EMPTY_CAPABILITIES;
  return moduleCaps[capability] ? { allowed: true } : { allowed: false };
}
