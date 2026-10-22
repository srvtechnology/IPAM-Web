import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const saved = await db.savedJob.findMany({
    where: { userId: session.sub },
    include: {
      job: {
        include: {
          _count: {
            select: { applications: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    saved.map((item) => ({
      savedAt: item.createdAt.toISOString(),
      savedJobId: item.id,
      isSaved: true,
      job: {
        id: item.job.id,
        title: item.job.title,
        company: item.job.company,
        location: item.job.location,
        country: item.job.country,
        state: item.job.state,
        city: item.job.city,
        salary: item.job.salary,
        type: item.job.type,
        workplaceType: item.job.workplaceType,
        category: item.job.category,
        description: item.job.description,
        experienceRequired: item.job.experienceRequired,
        experienceLevel: item.job.experienceLevel,
        hiringType: item.job.hiringType,
        positionsOpen: item.job.positionsOpen,
        deadline: item.job.deadline ? item.job.deadline.toISOString() : null,
        status: item.job.status,
        postedDate: item.job.postedDate.toISOString(),
        postedByType: item.job.postedByType,
        postedByName: item.job.postedByName,
        applicantsCount: item.job._count.applications,
      },
    }))
  );
}
