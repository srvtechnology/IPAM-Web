import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import EventsView from "@/components/public/EventsView";

export default async function EventsPage() {
  const session = await getAlumniSession();
  const [events, registrations] = await Promise.all([
    db.alumniEvent.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: "asc" },
    }),
    session
      ? db.eventRegistration.findMany({ where: { userId: session.sub }, select: { eventId: true } })
      : Promise.resolve([]),
  ]);
  const registeredIds = new Set(registrations.map((r) => r.eventId));

  return (
    <EventsView
      events={events.map((e) => ({
        id: e.id,
        title: e.title,
        displayDate: e.displayDate,
        time: e.time,
        location: e.location,
        isVirtual: e.isVirtual,
        category: e.category,
        ticketPrice: e.ticketPrice.toString(),
        currency: e.currency,
        capacity: e.capacity,
        registeredCount: e._count.registrations,
        isRegistered: registeredIds.has(e.id),
      }))}
    />
  );
}
