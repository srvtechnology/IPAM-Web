import { db } from "@/lib/db";
import EventsView from "@/components/public/EventsView";

export default async function EventsPage() {
  const events = await db.alumniEvent.findMany({
    include: { _count: { select: { registrations: true } } },
    orderBy: { date: "asc" },
  });

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
        capacity: e.capacity,
        registeredCount: e._count.registrations,
      }))}
    />
  );
}
