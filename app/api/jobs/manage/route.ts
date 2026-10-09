import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function GET(_req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) {
    return fail(401, "You must be signed in as an alumni member to view your posted jobs");
  }

  const profile = await db.alumniMember.findUnique({
    where: { userId: session.sub },
    select: { id: true, name: true, currentRole: true, company: true },
  });

  if (!profile) {
    return fail(404, "Alumni profile not found");
  }

  const jobs = await db.jobOpening.findMany({
    where: { postedByAlumniId: profile.id },
    orderBy: { postedDate: "desc" },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          alumniUser: {
            select: {
              email: true,
              profile: {
                select: { name: true, degree: true, major: true, classYear: true, avatar: true },
              },
            },
          },
        },
      },
      _count: { select: { applications: true } },
    },
  });

  return ok({
    profile,
    jobs,
  });
}
