import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = await db.alumniMember.findUnique({
    where: { id },
    include: { skills: true, user: { select: { email: true } } },
  });
  if (!m) return fail(404, "Alumni profile not found");

  return ok({
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
  });
}
