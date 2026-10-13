import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { updateLeadershipSchema } from "@/lib/validation/leadership";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const leader = await db.leadershipMember.findUnique({
    where: { id },
    include: { initiatives: true },
  });
  if (!leader) return fail(404, "Leader not found");

  return ok(leader);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateLeadershipSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const existing = await db.leadershipMember.findUnique({
    where: { id },
    include: { initiatives: true },
  });
  if (!existing) return fail(404, "Leader not found");

  const { initiatives, ...leaderData } = parsed.data;

  const updated = await db.$transaction(async (tx) => {
    if (initiatives !== undefined) {
      await tx.leadershipInitiative.deleteMany({ where: { leaderId: id } });
      if (initiatives.length > 0) {
        await tx.leadershipInitiative.createMany({
          data: initiatives.filter(Boolean).map((title) => ({ leaderId: id, title })),
        });
      }
    }

    return tx.leadershipMember.update({
      where: { id },
      data: {
        ...(leaderData.name !== undefined ? { name: leaderData.name } : {}),
        ...(leaderData.role !== undefined ? { role: leaderData.role } : {}),
        ...(leaderData.classYear !== undefined ? { classYear: leaderData.classYear } : {}),
        ...(leaderData.image !== undefined ? { image: leaderData.image || null } : {}),
        ...(leaderData.bio !== undefined ? { bio: leaderData.bio } : {}),
        ...(leaderData.quote !== undefined ? { quote: leaderData.quote } : {}),
        ...(leaderData.email !== undefined ? { email: leaderData.email } : {}),
      },
      include: { initiatives: true },
    });
  });

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  try {
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: admin?.name ?? "Admin",
      actorEmail: admin?.email ?? "admin@ipam.edu",
      actorRole: admin?.role.name ?? "Administrator",
      action: "LEADERSHIP_MEMBER_UPDATED",
      actionLabel: "Global Leader Updated",
      category: "SYSTEM_CORE",
      target: `Leader: ${updated.name} (${updated.role})`,
      targetType: "LeadershipMember",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Updated global leader profile for "${updated.name}".`,
      beforeState: { name: existing.name, role: existing.role },
      afterState: { name: updated.name, role: updated.role },
    });
  } catch (err) {
    console.error("Non-fatal: Failed to write audit log:", err);
  }

  return ok(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const { id } = await params;
  const existing = await db.leadershipMember.findUnique({ where: { id } });
  if (!existing) return fail(404, "Leader not found");

  await db.leadershipMember.delete({ where: { id } });

  const admin = await db.adminUser.findUnique({
    where: { id: session.sub },
    include: { role: true },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  try {
    await writeAuditLog({
      actorAdminId: session.sub,
      actorName: admin?.name ?? "Admin",
      actorEmail: admin?.email ?? "admin@ipam.edu",
      actorRole: admin?.role.name ?? "Administrator",
      action: "LEADERSHIP_MEMBER_DELETED",
      actionLabel: "Global Leader Deleted",
      category: "SYSTEM_CORE",
      target: `Leader: ${existing.name} (${existing.role})`,
      targetType: "LeadershipMember",
      status: "SUCCESS",
      severity: "WARNING",
      ipAddress,
      location,
      deviceInfo,
      details: `Removed global leadership member "${existing.name}".`,
      beforeState: { id: existing.id, name: existing.name, role: existing.role },
    });
  } catch (err) {
    console.error("Non-fatal: Failed to write audit log:", err);
  }

  return ok({ deleted: true });
}
