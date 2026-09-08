import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateAlumniRecordSchema } from "@/lib/validation/directory";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "DIRECTORY", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const record = await db.alumniRecord.findUnique({ where: { id }, include: { idCardOrders: true } });
  if (!record) return fail(404, "Alumni record not found");
  return ok(record);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "DIRECTORY", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateAlumniRecordSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const record = await db.alumniRecord.update({ where: { id }, data: parsed.data }).catch(() => null);
  if (!record) return fail(404, "Alumni record not found");
  return ok(record);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "DIRECTORY", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.alumniRecord.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
