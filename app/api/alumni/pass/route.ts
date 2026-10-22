import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: {
      profile: true,
      alumniRecord: true,
    },
  });

  if (!user || !user.profile) {
    return fail(404, "Alumni profile not found");
  }

  if (user.status !== "APPROVED") {
    return fail(403, "Alumni account is pending verification or approval");
  }

  const qrPayload = JSON.stringify({
    schema: "IPAM_PASS_V1",
    id: user.id,
    studentId: user.studentId,
    name: user.profile.name,
    degree: user.profile.degree,
    tier: user.membershipTier,
    verified: user.isVerifiedAlumni,
    timestamp: new Date().toISOString(),
  });

  return ok({
    id: user.id,
    studentId: user.studentId,
    name: user.profile.name,
    avatar: user.profile.avatar,
    degree: user.profile.degree,
    major: user.profile.major,
    classYear: user.profile.classYear,
    membershipTier: user.membershipTier,
    isVerifiedAlumni: user.isVerifiedAlumni,
    status: user.status,
    qrPayload,
    membershipValidUntil: user.membershipValidUntil,
    issuedAt: user.createdAt,
    institution: "Institute of Public Administration and Management",
  });
}
