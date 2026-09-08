import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createAdminJobSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const jobs = await db.adminJobListing.findMany({
    orderBy: { postedDate: "desc" },
    include: { employer: true, _count: { select: { applications: true } } },
  });
  return ok(jobs);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createAdminJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { requirements, skillsRequired, benefits, ...rest } = parsed.data;
  const job = await db.adminJobListing.create({
    data: { ...rest, requirements, skillsRequired, benefits },
  });
  return ok(job, 201);
}
