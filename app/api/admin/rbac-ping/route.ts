import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";
import { NextResponse } from "next/server";

// Temporary RBAC-gate smoke-test route (Milestone 2 verification). Exercises
// requirePermission() end-to-end. Safe to keep as a lightweight "am I wired
// up correctly" probe, or remove once real admin API routes exist.
export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "SYSTEM_SETTINGS", "canRead");
  if (gate instanceof NextResponse) return gate;
  return ok({ pong: true, adminId: gate.admin.id });
}
