import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) return fail(404, "Business not found");
  return ok(business);
}
