import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { getAlumniSession } from "@/lib/auth/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.alumniEvent.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return fail(404, "Event not found");

  const session = await getAlumniSession();
  let registered = false;
  if (session) {
    const reg = await db.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.sub } },
    });
    registered = !!reg;
  }

  return ok({
    ...event,
    registeredCount: event._count.registrations,
    _count: undefined,
    registered,
  });
}
