import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { applyToJobSchema } from "@/lib/validation/jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to view your application");
  const { id: jobId } = await params;

  const application = await db.jobOpeningApplication.findUnique({
    where: { jobId_alumniUserId: { jobId, alumniUserId: session.sub } },
  });
  return ok({ application });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to apply");
  const { id: jobId } = await params;

  const job = await db.jobOpening.findUnique({ where: { id: jobId } });
  if (!job) return fail(404, "Job not found");

  const existing = await db.jobOpeningApplication.findUnique({
    where: { jobId_alumniUserId: { jobId, alumniUserId: session.sub } },
  });
  if (existing) return ok({ application: existing }, 200);

  const body = await req.json().catch(() => ({}));
  const parsed = applyToJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const applicationRef = `IPAM-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const application = await db.jobOpeningApplication.create({
    data: {
      jobId,
      alumniUserId: session.sub,
      linkedinUrl: parsed.data.linkedinUrl || null,
      coverNote: parsed.data.coverNote || null,
      applicationRef,
    },
  });

  return ok({ application }, 201);
}
