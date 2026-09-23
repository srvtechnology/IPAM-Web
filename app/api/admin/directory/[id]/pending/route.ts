import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "DIRECTORY", "canApprove");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const target = await db.alumniRecord.findUnique({ where: { id }, include: { alumniUser: true } });
  if (!target) return fail(404, "Alumni record not found");

  const [updated] = await db.$transaction([
    db.alumniRecord.update({
      where: { id },
      data: { status: "PENDING" },
    }),
    ...(target.alumniUserId
      ? [
          db.alumniUser.update({
            where: { id: target.alumniUserId },
            data: { status: "PENDING", isVerifiedAlumni: false },
          }),
        ]
      : []),
  ]);

  const admin2 = await db.adminUser.findUnique({ where: { id: admin.id }, include: { role: true } });
  const { ipAddress, location, deviceInfo } = requestMeta(req);

  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin2?.name ?? admin.name,
    actorEmail: admin2?.email ?? admin.email,
    actorRole: admin2?.role.name ?? "Admin",
    action: "ALUMNI_STATUS_PENDING",
    actionLabel: "Registrar Set Pending Status",
    category: "ALUMNI_VERIFICATION",
    target: `Alumni: ${target.name} (${target.regNo})`,
    targetType: "Alumni Record",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `Alumni record status reset to PENDING by registrar for document re-evaluation.`,
    beforeState: { status: target.status, rejectionReason: target.rejectionReason },
    afterState: { status: "PENDING" },
  });

  return ok(updated);
}
