import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { applyToJobSchema } from "@/lib/validation/jobs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to view your application");
  const { id: jobId } = await params;

  const application = await db.jobOpeningApplication.findFirst({
    where: { jobId, alumniUserId: session.sub },
  });
  return ok({ application });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to apply");
  const { id: jobId } = await params;

  const job = await db.jobOpening.findUnique({ where: { id: jobId } });
  if (!job) return fail(404, "Job not found");

  const existing = await db.jobOpeningApplication.findFirst({
    where: { jobId, alumniUserId: session.sub },
  });
  if (existing) return ok({ application: existing }, 200);

  const [alumniUser, profile] = await Promise.all([
    db.alumniUser.findUnique({ where: { id: session.sub } }),
    db.alumniMember.findUnique({ where: { userId: session.sub } }),
  ]);

  if (!alumniUser) return fail(404, "Alumni user record not found");

  const body = await req.json().catch(() => ({}));
  const parsed = applyToJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const applicationRef = `IPAM-REF-${Math.floor(100000 + Math.random() * 900000)}`;
  const candidateName = parsed.data.candidateName || profile?.name || alumniUser.email.split("@")[0];
  const email = parsed.data.email || alumniUser.email;
  const degree = parsed.data.degree || profile?.degree || "IPAM Graduate";
  const faculty = parsed.data.faculty || profile?.major || "Administration & Management";
  const gradYear = parsed.data.gradYear || profile?.classYear || new Date().getFullYear();
  const phone = parsed.data.phone || "";
  const avatarUrl = profile?.avatar || null;
  const linkedinUrl = parsed.data.linkedinUrl || profile?.linkedin || null;
  const coverNote = parsed.data.coverNote || null;
  const experienceYears = parsed.data.experienceYears ?? 1;

  // Compute a realistic match score based on experience and requirements
  let matchScore = 80;
  if (job.experienceRequired && experienceYears >= 3) matchScore += 10;
  if (parsed.data.skills && parsed.data.skills.length > 0) matchScore += 5;
  matchScore = Math.min(98, Math.max(75, matchScore));

  const application = await db.jobOpeningApplication.create({
    data: {
      jobId,
      alumniUserId: session.sub,
      candidateName,
      email,
      phone,
      degree,
      faculty,
      gradYear,
      avatarUrl,
      experienceYears,
      skills: parsed.data.skills || [],
      matchScore,
      linkedinUrl,
      coverNote,
      applicationRef,
      status: "APPLIED",
    },
  });

  return ok({ application }, 201);
}
