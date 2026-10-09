import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createJobApplicationSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const applications = await db.jobOpeningApplication.findMany({
    where: { jobId: id },
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
  });
  return ok(applications);
}

// Recruiters/registrars can manually register a candidate against a listing
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const job = await db.jobOpening.findUnique({ where: { id } });
  if (!job) return fail(404, "Job listing not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createJobApplicationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const applicationRef = `IPAM-REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const application = await db.jobOpeningApplication.create({
    data: {
      jobId: id,
      candidateName: parsed.data.candidateName,
      degree: parsed.data.degree,
      faculty: parsed.data.faculty,
      gradYear: parsed.data.gradYear,
      email: parsed.data.email,
      phone: parsed.data.phone,
      gpa: parsed.data.gpa || null,
      coverNote: parsed.data.coverNote || null,
      experienceYears: parsed.data.experienceYears ?? 0,
      skills: parsed.data.skills || [],
      status: "APPLIED",
      matchScore: 85,
      applicationRef,
    },
  });

  return ok(application, 201);
}
