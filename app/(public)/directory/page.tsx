import { db } from "@/lib/db";
import DirectoryView from "@/components/public/DirectoryView";

export default async function DirectoryPage() {
  const members = await db.alumniMember.findMany({
    include: { skills: true, user: { select: { email: true } } },
    orderBy: { name: "asc" },
  });

  const alumni = members.map((m) => ({
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
  }));

  return <DirectoryView alumni={alumni} />;
}
