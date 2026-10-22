import { db } from "@/lib/db";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const leaders = await db.leadershipMember.findMany({
    include: {
      initiatives: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  return ok(
    leaders.map((leader) => ({
      id: leader.id,
      name: leader.name,
      role: leader.role,
      classYear: leader.classYear,
      image: leader.image,
      bio: leader.bio,
      quote: leader.quote,
      email: leader.email,
      initiatives: leader.initiatives.map((i) => i.title),
    }))
  );
}
