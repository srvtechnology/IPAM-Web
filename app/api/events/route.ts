import { db } from "@/lib/db";
import { ok } from "@/lib/api-response";

export async function GET() {
  const events = await db.alumniEvent.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: "asc" },
  });
  return ok(
    events.map((e) => ({ ...e, registeredCount: e._count.registrations, _count: undefined }))
  );
}
