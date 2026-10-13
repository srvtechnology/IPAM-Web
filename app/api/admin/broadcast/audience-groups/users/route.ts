import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canRead");
  if (gate instanceof NextResponse) return gate;

  const users = await db.alumniRecord.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      regNo: true,
      faculty: true,
      gradYear: true,
      avatarUrl: true,
      initials: true,
      digitalPassIssued: true,
      phone: true,
    },
  });

  return ok(users);
}
