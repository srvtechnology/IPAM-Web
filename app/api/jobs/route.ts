import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createJobSchema } from "@/lib/validation/jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const workplaceType = searchParams.get("workplaceType");
  const q = searchParams.get("q")?.trim();

  const jobs = await db.jobOpening.findMany({
    where: {
      ...(category ? { category: category as never } : {}),
      ...(type ? { type: type as never } : {}),
      ...(workplaceType ? { workplaceType: workplaceType as never } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { company: { contains: q } },
              { location: { contains: q } },
            ],
          }
        : {}),
    },
    include: { postedByAlumni: { select: { name: true, classYear: true, avatar: true, currentRole: true, id: true } } },
    orderBy: { postedDate: "desc" },
  });

  return ok(jobs);
}

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to post a job");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const profile = await db.alumniMember.findUnique({ where: { userId: session.sub } });
  if (!profile) return fail(404, "Alumni profile not found");

  const job = await db.jobOpening.create({
    data: {
      ...parsed.data,
      postedByAlumniId: profile.id,
    },
    include: { postedByAlumni: true },
  });

  return ok(job, 201);
}
