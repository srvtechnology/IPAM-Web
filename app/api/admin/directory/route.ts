import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createAlumniRecordSchema } from "@/lib/validation/directory";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "DIRECTORY", "canRead");
  if (gate instanceof NextResponse) return gate;

  const records = await db.alumniRecord.findMany({ orderBy: { dateRegistered: "desc" } });
  return ok(records);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "DIRECTORY", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createAlumniRecordSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const initials = parsed.data.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const record = await db.alumniRecord.create({
    data: { ...parsed.data, initials },
  });

  return ok(record, 201);
}
