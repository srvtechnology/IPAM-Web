import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { getAlumniSession } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: { postedByAlumni: true },
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
