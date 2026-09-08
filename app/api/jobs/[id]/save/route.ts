import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to save a job");
  const { id: jobId } = await params;

  const job = await db.jobOpening.findUnique({ where: { id: jobId } });
  if (!job) return fail(404, "Job not found");

  const existing = await db.savedJob.findUnique({
    where: { userId_jobId: { userId: session.sub, jobId } },
  });

  if (existing) {
    await db.savedJob.delete({ where: { id: existing.id } });
    return ok({ saved: false });
  }

  await db.savedJob.create({ data: { userId: session.sub, jobId } });
  return ok({ saved: true });
}
