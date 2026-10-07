import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import DirectoryView from "@/components/public/DirectoryView";

export default async function DirectoryPage() {
  const session = await getAlumniSession();

  const members = await db.alumniMember.findMany({
    where: session?.sub ? { userId: { not: session.sub } } : undefined,
    include: { skills: true, user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });

  const alumni = members.map((m) => ({
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
    linkedin: m.linkedin,
    skills: m.skills.map((s) => s.skill),
  }));

  return <DirectoryView alumni={alumni} currentUserId={session?.sub || null} />;
}
