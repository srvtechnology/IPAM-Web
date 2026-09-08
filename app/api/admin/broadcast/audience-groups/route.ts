import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createAudienceGroupSchema } from "@/lib/validation/broadcast";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canRead");
  if (gate instanceof NextResponse) return gate;

  const groups = await db.targetAudienceGroup.findMany({ orderBy: { createdAt: "desc" } });
  return ok(groups);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createAudienceGroupSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const group = await db.targetAudienceGroup.create({ data: parsed.data });
  return ok(group, 201);
}
