import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateTemplateSchema } from "@/lib/validation/broadcast";
import { ok, fail } from "@/lib/api-response";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "BROADCAST", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.broadcastMessageTemplate.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = updateTemplateSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const template = await db.broadcastMessageTemplate.update({ where: { id }, data: parsed.data as any }).catch(() => null);
  if (!template) return fail(404, "Template not found");
  return ok(template);
}
