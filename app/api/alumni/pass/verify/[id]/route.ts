import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return fail(400, "Identifier or Student ID is required");

  // Search by AlumniUser.id or AlumniUser.studentId
  const user = await db.alumniUser.findFirst({
    where: {
      OR: [{ id }, { studentId: id }],
    },
    include: {
      profile: true,
      alumniRecord: true,
    },
  });

  if (!user) {
    return fail(404, "Alumni record not found", { valid: false });
  }

  const isApproved = user.status === "APPROVED";

  return ok({
    valid: isApproved,
    status: user.status,
    message: isApproved ? "Valid Verified Alumni Pass" : `Pass status: ${user.status}`,
    user: {
      id: user.id,
      studentId: user.studentId,
      name: user.profile?.name || user.alumniRecord?.name || "Alumni Member",
      avatar: user.profile?.avatar || null,
      degree: user.profile?.degree || user.alumniRecord?.degree || "Degree",
      major: user.profile?.major || user.alumniRecord?.faculty || "General",
      classYear: user.profile?.classYear || user.alumniRecord?.gradYear || null,
      membershipTier: user.membershipTier,
      isVerifiedAlumni: user.isVerifiedAlumni,
    },
    verifiedAt: new Date().toISOString(),
  });
}
