import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import EventDetailView from "@/components/public/EventDetailView";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.alumniEvent.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) notFound();

  const session = await getAlumniSession();
  let registered = false;
  if (session) {
    const reg = await db.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.sub } },
    });
    registered = !!reg;
  }

  return (
    <EventDetailView
      event={{
        id: event.id,
        title: event.title,
        displayDate: event.displayDate,
        time: event.time,
        location: event.location,
        venueDetails: event.venueDetails,
        isVirtual: event.isVirtual,
        virtualLink: event.virtualLink,
        category: event.category,
        description: event.description,
        agenda: event.agenda as EventDetailAgenda[] | null,
        speakers: event.speakers as EventDetailSpeaker[] | null,
        ticketPrice: event.ticketPrice.toString(),
        currency: event.currency,
        capacity: event.capacity,
        registeredCount: event._count.registrations,
        registered,
      }}
    />
  );
}

type EventDetailAgenda = { time: string; activity: string; speaker?: string };
type EventDetailSpeaker = { name: string; title: string; bio?: string };
