import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createJobApplicationSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const applications = await db.jobApplication.findMany({
    where: { jobId: id },
    orderBy: { appliedDate: "desc" },
  });
  return ok(applications);
}

// Recruiters/registrars can manually register a candidate against a listing
// (e.g. a walk-in applicant) in addition to any that arrive via other intake.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const job = await db.adminJobListing.findUnique({ where: { id } });
  if (!job) return fail(404, "Job listing not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createJobApplicationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { skills, ...rest } = parsed.data;
  const application = await db.jobApplication.create({
    data: { ...rest, skills, jobId: id },
  });
  await db.adminJobListing.update({ where: { id }, data: { applicantsCount: { increment: 1 } } });

  return ok(application, 201);
}
