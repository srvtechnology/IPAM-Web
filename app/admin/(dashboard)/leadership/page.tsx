import { db } from "@/lib/db";
import LeadershipManagementView from "@/components/admin/leadership/LeadershipManagementView";

export const dynamic = "force-dynamic";

export default async function AdminLeadershipPage() {
  const leaders = await db.leadershipMember.findMany({
    include: { initiatives: true },
    orderBy: { id: "asc" },
  });

  return (
    <LeadershipManagementView
      leaders={leaders.map((l) => ({
        id: l.id,
        name: l.name,
        role: l.role,
        classYear: l.classYear,
        image: l.image,
        bio: l.bio,
        quote: l.quote,
        email: l.email,
        initiatives: l.initiatives.map((i) => ({ id: i.id, title: i.title })),
      }))}
    />
  );
}
