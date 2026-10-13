import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateAudienceGroupSchema } from "@/lib/validation/broadcast";
import { ok, fail } from "@/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "BROADCAST", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.targetAudienceGroup.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateAudienceGroupSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.criteria !== undefined) {
    updateData.criteria = parsed.data.criteria as any;
  }

  const group = await db.targetAudienceGroup.update({ where: { id }, data: updateData as any }).catch(() => null);
  if (!group) return fail(404, "Audience group not found");
  return ok(group);
}
