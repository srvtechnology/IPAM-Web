import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateAdminJobSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const job = await db.adminJobListing.findUnique({
    where: { id },
    include: { employer: true, applications: { orderBy: { appliedDate: "desc" } } },
  });
  if (!job) return fail(404, "Job listing not found");
  return ok(job);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateAdminJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const job = await db.adminJobListing.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!job) return fail(404, "Job listing not found");
  return ok(job);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.adminJobListing.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
