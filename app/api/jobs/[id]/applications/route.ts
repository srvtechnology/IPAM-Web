import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { applyToJobSchema } from "@/lib/validation/jobs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id: jobId },
    select: { id: true, title: true, company: true, postedByAlumniId: true, postedByAdminId: true },
  });
  if (!job) return fail(404, "Job opening not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  let isAuthorized = false;
  if (adminSession) {
    isAuthorized = true;
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({
      where: { userId: alumniSession.sub },
      select: { id: true },
    });
    if (profile && job.postedByAlumniId === profile.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to view candidate applications for this job");
  }

  const applications = await db.jobOpeningApplication.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    include: {
      alumniUser: {
        select: {
          id: true,
          email: true,
          studentId: true,
          profile: {
            select: { name: true, degree: true, major: true, classYear: true, avatar: true },
          },
        },
      },
    },
  });

  return ok(applications);
}

// Manual registration of candidate (e.g. walk-in applicant)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const job = await db.jobOpening.findUnique({ where: { id: jobId } });
  if (!job) return fail(404, "Job opening not found");

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  let isAuthorized = false;
  if (adminSession) {
    isAuthorized = true;
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({
      where: { userId: alumniSession.sub },
      select: { id: true },
    });
    if (profile && job.postedByAlumniId === profile.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to add candidates for this job");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = applyToJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const applicationRef = `IPAM-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const application = await db.jobOpeningApplication.create({
    data: {
      jobId,
      candidateName: parsed.data.candidateName || "Direct Candidate",
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      degree: parsed.data.degree || "IPAM Candidate",
      faculty: parsed.data.faculty || null,
      gradYear: parsed.data.gradYear || null,
      experienceYears: parsed.data.experienceYears ?? 0,
      skills: parsed.data.skills || [],
      matchScore: 85,
      status: "APPLIED",
      linkedinUrl: parsed.data.linkedinUrl || null,
      coverNote: parsed.data.coverNote || null,
      applicationRef,
    },
  });

  return ok(application, 201);
}
