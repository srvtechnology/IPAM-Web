import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createEventProposalSchema } from "@/lib/validation/event-proposals";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required to view your event proposals");

  const proposals = await db.eventProposal.findMany({
    where: { organizerEmail: session.email },
    orderBy: { createdAt: "desc" },
  });
  return ok(proposals);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createEventProposalSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const proposal = await db.eventProposal.create({ data: parsed.data });
  return ok(proposal, 201);
}
