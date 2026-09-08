import { db } from "@/lib/db";
import { checkPagePermission } from "@/lib/auth/permissions";
import AccessDenied from "@/components/admin/AccessDenied";
import RbacManagementView from "@/components/admin/rbac/RbacManagementView";

export default async function RbacPage() {
  const gate = await checkPagePermission("RBAC_GOVERNANCE", "canRead");
  if (!gate.allowed) return <AccessDenied module="RBAC & Access Control" />;

  const [roles, users] = await Promise.all([
    db.adminRoleDefinition.findMany({
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: { priorityLevel: "asc" },
    }),
    db.adminUser.findMany({
      include: { role: true },
      orderBy: { assignedDate: "desc" },
    }),
  ]);

  return (
    <RbacManagementView
      roles={roles.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        isSystemDefault: r.isSystemDefault,
        priorityLevel: r.priorityLevel,
        permissions: r.permissions.map((p) => ({
          module: p.module,
          canRead: p.canRead,
          canWrite: p.canWrite,
          canApprove: p.canApprove,
          canExport: p.canExport,
          canDelete: p.canDelete,
        })),
        _count: r._count,
      }))}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        department: u.department,
        title: u.title,
        status: u.status,
        roleId: u.roleId,
        role: { id: u.role.id, name: u.role.name },
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        assignedDate: u.assignedDate.toISOString(),
      }))}
    />
  );
}
