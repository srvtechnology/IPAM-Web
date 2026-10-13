import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/auth/session";
import { createLeadershipSchema } from "@/lib/validation/leadership";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const leaders = await db.leadershipMember.findMany({
    include: { initiatives: true },
    orderBy: { id: "asc" },
  });

  return ok(leaders);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return fail(401, "Unauthorized");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = createLeadershipSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { name, role, classYear, image, bio, quote, email, initiatives } = parsed.data;

  const leader = await db.leadershipMember.create({
    data: {
      name,
      role,
      classYear,
      image: image || null,
      bio,
      quote,
      email,
      initiatives: {
        create: (initiatives || []).filter(Boolean).map((title) => ({ title })),
      },
    },
    include: { initiatives: true },
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
      action: "LEADERSHIP_MEMBER_CREATED",
      actionLabel: "Global Leader Created",
      category: "SYSTEM_CORE",
      target: `Leader: ${leader.name} (${leader.role})`,
      targetType: "LeadershipMember",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Created new global leadership member "${leader.name}", role "${leader.role}", class of ${leader.classYear}.`,
      afterState: { id: leader.id, name: leader.name, role: leader.role },
    });
  } catch (err) {
    console.error("Non-fatal: Failed to write audit log:", err);
  }

  return ok(leader, 201);
}
