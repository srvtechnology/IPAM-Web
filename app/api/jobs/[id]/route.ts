import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { updateJobSchema } from "@/lib/validation/jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: {
      postedByAlumni: {
        select: { id: true, name: true, classYear: true, currentRole: true, company: true, avatar: true },
      },
      postedByAdmin: {
        select: { id: true, name: true, title: true, department: true },
      },
      employer: true,
      _count: { select: { applications: true } },
    },
  });
  if (!job) return fail(404, "Job not found");

  const session = await getAlumniSession();
  let saved = false;
  if (session) {
    const savedRow = await db.savedJob.findUnique({
      where: { userId_jobId: { userId: session.sub, jobId: id } },
    });
    saved = !!savedRow;
  }

  return ok({ ...job, saved });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({ where: { id } });
  if (!job) return fail(404, "Job not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  let isAuthorized = false;
  if (adminSession) {
    isAuthorized = true;
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({ where: { userId: alumniSession.sub } });
    if (profile && job.postedByAlumniId === profile.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to modify this job");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const updated = await db.jobOpening.update({
    where: { id },
    data: parsed.data,
    include: {
      postedByAlumni: true,
      postedByAdmin: true,
    },
  });

  return ok(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({ where: { id } });
  if (!job) return fail(404, "Job not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  let isAuthorized = false;
  if (adminSession) {
    isAuthorized = true;
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({ where: { userId: alumniSession.sub } });
    if (profile && job.postedByAlumniId === profile.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to delete this job");
  }

  await db.jobOpening.delete({ where: { id } });
  return ok({ deleted: true });
}
