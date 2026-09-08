import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const classYear = searchParams.get("classYear");
  const industry = searchParams.get("industry");
  const isMentor = searchParams.get("isMentor");

  const members = await db.alumniMember.findMany({
    where: {
      ...(classYear ? { classYear: Number(classYear) } : {}),
      ...(industry ? { industry } : {}),
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
    include: { skills: true, user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });

  return ok(
    members.map((m) => ({
      id: m.id,
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
      skills: m.skills.map((s) => s.skill),
    }))
  );
}
