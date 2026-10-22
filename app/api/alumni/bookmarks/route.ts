import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const bookmarks = await db.alumniBookmark.findMany({
    where: { ownerId: session.sub },
  });

  const targetUserIds = bookmarks.map((b) => b.targetId);
  if (targetUserIds.length === 0) {
    return ok([]);
  }

  const members = await db.alumniMember.findMany({
    where: { userId: { in: targetUserIds } },
    include: {
      skills: true,
      user: {
        select: {
          id: true,
          email: true,
          studentId: true,
          membershipTier: true,
          isVerifiedAlumni: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return ok(
    members.map((m) => ({
      alumniId: m.id,
      userId: m.userId,
      name: m.name,
      avatar: m.avatar,
      classYear: m.classYear,
      degree: m.degree,
      major: m.major,
      currentRole: m.currentRole,
      company: m.company,
      location: m.location,
      country: m.country,
      industry: m.industry,
      isMentor: m.isMentor,
      bio: m.bio,
      email: m.user.email,
      linkedin: m.linkedin,
      membershipTier: m.user.membershipTier,
      isVerifiedAlumni: m.user.isVerifiedAlumni,
      skills: m.skills.map((s: { skill: string }) => s.skill),
    }))
  );
}
