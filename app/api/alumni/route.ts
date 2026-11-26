import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const classYear = searchParams.get("classYear");
  const industry = searchParams.get("industry");
  const isMentor = searchParams.get("isMentor");

  const [members, bookmarks] = await Promise.all([
    db.alumniMember.findMany({
      where: {
        ...(session ? { userId: { not: session.sub } } : {}),
        ...(classYear ? { classYear: Number(classYear) } : {}),
        ...(industry && industry !== "All" ? { industry } : {}),
        ...(isMentor === "true" ? { isMentor: true } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { company: { contains: q } },
                { currentRole: { contains: q } },
                { skills: { some: { skill: { contains: q } } } },
              ],
            }
          : {}),
      },
      include: {
        skills: true,
        user: {
          select: {
            email: true,
            studentId: true,
            membershipTier: true,
            isVerifiedAlumni: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    session
      ? db.alumniBookmark.findMany({
          where: { ownerId: session.sub },
          select: { targetId: true },
        })
      : Promise.resolve([]),
  ]);

  const connectedSet = new Set(bookmarks.map((b) => b.targetId));

  return ok(
    members.map((m) => ({
      id: m.id,
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
      studentId: m.user.studentId,
      membershipTier: m.user.membershipTier,
      isVerifiedAlumni: m.user.isVerifiedAlumni,
      isConnected: connectedSet.has(m.userId),
      linkedin: m.linkedin,
      skills: m.skills.map((s) => s.skill),
    }))
  );
}
