import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createEmployerSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const employers = await db.employerDetail.findMany({ orderBy: { name: "asc" } });
  return ok(employers);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createEmployerSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const employer = await db.employerDetail.create({ data: parsed.data });
  return ok(employer, 201);
}
