import { redirect } from "next/navigation";
import { getAlumniSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import ProfileManagementView from "@/components/public/ProfileManagementView";

export const metadata = {
  title: "Profile Management | IPAM Alumni Association",
  description: "Manage your official alumni profile, base64 photo avatar, and career credentials.",
};

export default async function ProfilePage() {
  const session = await getAlumniSession();
  if (!session) {
    redirect("/login?next=/profile");
  }

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: {
      profile: {
        include: {
          skills: true,
        },
      },
    },
  });

  if (!user || user.status !== "APPROVED") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <ProfileManagementView
          initialProfile={user.profile}
          userEmail={user.email}
          studentId={user.studentId}
          membershipTier={user.membershipTier}
        />
      </div>
    </div>
  );
}
