import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import VirtualPassView from "@/components/public/VirtualPassView";

export default async function VirtualPassPage() {
  const session = await getAlumniSession();
  if (!session) redirect("/login");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (!user || !user.profile) redirect("/login");

  return (
    <VirtualPassView
      pass={{
        id: user.id,
        name: user.profile.name,
        avatar: user.profile.avatar,
        studentId: user.studentId,
        classYear: user.profile.classYear,
        degree: user.profile.degree,
        isVerifiedAlumni: user.isVerifiedAlumni,
        membershipTier: user.membershipTier,
      }}
    />
  );
}
