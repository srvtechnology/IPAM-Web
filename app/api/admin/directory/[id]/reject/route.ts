import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { rejectAlumniRecordSchema } from "@/lib/validation/directory";
import { ok, fail } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "DIRECTORY", "canApprove");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = rejectAlumniRecordSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { rejectionReason } = parsed.data;

  const target = await db.alumniRecord.findUnique({ where: { id }, include: { alumniUser: true } });
  if (!target) return fail(404, "Alumni record not found");

  const [updated] = await db.$transaction([
    db.alumniRecord.update({
      where: { id },
      data: { status: "REJECTED", rejectionReason },
    }),
    ...(target.alumniUserId
      ? [
          db.alumniUser.update({
            where: { id: target.alumniUserId },
            data: { status: "REJECTED", isVerifiedAlumni: false, rejectionReason },
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
    action: "ALUMNI_REGISTRATION_REJECTED",
    actionLabel: "Registrar Application Rejection",
    category: "ALUMNI_VERIFICATION",
    target: `Alumni: ${target.name} (${target.regNo})`,
    targetType: "Alumni Record",
    status: "SUCCESS",
    severity: "WARNING",
    ipAddress,
    location,
    deviceInfo,
    details: `Alumni registration rejected by registrar. Stated reason: ${rejectionReason}`,
    beforeState: { status: target.status, rejectionReason: target.rejectionReason },
    afterState: { status: "REJECTED", rejectionReason },
  });

  return ok(updated);
}
