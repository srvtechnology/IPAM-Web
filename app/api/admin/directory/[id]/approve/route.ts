import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { ok, fail } from "@/lib/api-response";
import { notifyDegreeVerificationApproved } from "@/lib/notifications";

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
      data: { status: "APPROVED", authStatus: "BIOMETRIC_SYNCED", rejectionReason: null },
    }),
    ...(target.alumniUserId
      ? [
          db.alumniUser.update({
            where: { id: target.alumniUserId },
            data: { status: "APPROVED", isVerifiedAlumni: true, rejectionReason: null },
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
    action: "ALUMNI_DEGREE_APPROVED",
    actionLabel: "Official Registrar Degree Sign-off",
    category: "ALUMNI_VERIFICATION",
    target: `Alumni: ${target.name} (${target.regNo})`,
    targetType: "Alumni Record",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `Official degree verification applied for ${target.degree} (class of ${target.gradYear}). Biometric identity synchronized to IPAM SIS central node.`,
    beforeState: { status: target.status, authStatus: target.authStatus },
    afterState: { status: "APPROVED", authStatus: "BIOMETRIC_SYNCED" },
  });

  // Dispatch push and in-app notification to approved alumni
  if (target.alumniUserId) {
    notifyDegreeVerificationApproved(target.alumniUserId, target.name).catch((err) =>
      console.error("[Directory] Failed to send degree approval notification:", err)
    );
  }

  return ok(updated);
}
