import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to register for an event");
  const { id: eventId } = await params;

  const event = await db.alumniEvent.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) return fail(404, "Event not found");

  const existing = await db.eventRegistration.findUnique({
    where: { eventId_userId: { eventId, userId: session.sub } },
  });
  if (existing) return ok({ registered: true, alreadyRegistered: true });

  if (event._count.registrations >= event.capacity) {
    return fail(409, "This event is at full capacity");
  }

  await db.eventRegistration.create({ data: { eventId, userId: session.sub } });
  return ok({ registered: true, alreadyRegistered: false }, 201);
}
