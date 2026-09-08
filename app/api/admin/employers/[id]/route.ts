import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateEmployerSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const employer = await db.employerDetail.findUnique({ where: { id }, include: { jobs: true } });
  if (!employer) return fail(404, "Employer not found");
  return ok(employer);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateEmployerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const employer = await db.employerDetail.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!employer) return fail(404, "Employer not found");
  return ok(employer);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.employerDetail.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
