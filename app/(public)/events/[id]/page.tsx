import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import EventDetailView from "@/components/public/EventDetailView";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await db.alumniEvent.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) notFound();

  const session = await getAlumniSession();
  let registered = false;
  let registrationRef: string | null = null;
  let registrationTicketCount = 1;
  let registrationPaymentStatus: string | null = null;

  if (session) {
    const reg = await db.eventRegistration.findFirst({
      where: { eventId: id, userId: session.sub, bookingStatus: { not: "CANCELLED" } },
    });
    if (reg) {
      registrationRef = reg.bookingReference;
      registrationTicketCount = reg.ticketCount;
      registrationPaymentStatus = reg.paymentStatus;
      // Confirmed only if paid (for paid events) or free (for free events)
      registered = reg.paymentStatus === "PAID" || reg.paymentStatus === "FREE";
    }
  }

  const relatedEventsRaw = await db.alumniEvent.findMany({
    where: { id: { not: id } },
    orderBy: { date: "asc" },
    take: 3,
  });

  return (
    <EventDetailView
      relatedEvents={relatedEventsRaw.map((e) => ({
        id: e.id,
        title: e.title,
        displayDate: e.displayDate,
        description: e.description,
        location: e.location,
        ticketPrice: e.ticketPrice.toString(),
        currency: e.currency,
      }))}
      event={{
        id: event.id,
        title: event.title,
        date: event.date.toISOString(),
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
        dressCode: event.dressCode,
        highlights: event.highlights as string[] | null,
        faqs: event.faqs as EventDetailFaq[] | null,
        ticketPrice: event.ticketPrice.toString(),
        currency: event.currency,
        capacity: event.capacity,
        registeredCount: event._count.registrations,
        registered,
        registrationRef,
        registrationTicketCount,
        registrationPaymentStatus,
        bannerImage: event.bannerImage || null,
        bannerImages: (event.bannerImages as string[] | null) || null,
      }}
    />
  );
}

type EventDetailAgenda = { time: string; activity: string; speaker?: string };
type EventDetailSpeaker = { name: string; title: string; bio?: string; image?: string };
type EventDetailFaq = { question: string; answer: string };
