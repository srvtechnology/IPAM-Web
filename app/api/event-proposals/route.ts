import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createEventProposalSchema } from "@/lib/validation/event-proposals";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createEventProposalSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const proposal = await db.eventProposal.create({ data: parsed.data });
  return ok(proposal, 201);
}
