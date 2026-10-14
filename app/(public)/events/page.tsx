import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { getBannersForPage } from "@/lib/commercial-banners";
import EventsView from "@/components/public/EventsView";
import PageCommercialBannersSection from "@/components/public/PageCommercialBannersSection";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const session = await getAlumniSession();
  const [events, registrations, commercialBanners] = await Promise.all([
    db.alumniEvent.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { date: "asc" },
    }),
    session
      ? db.eventRegistration.findMany({ where: { userId: session.sub }, select: { eventId: true } })
      : Promise.resolve([]),
    getBannersForPage("/events"),
  ]);
  const registeredIds = new Set(registrations.map((r) => r.eventId));

  return (
    <div>
      <EventsView
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.date.toISOString(),
          displayDate: e.displayDate,
          time: e.time,
          location: e.location,
          venueDetails: e.venueDetails,
          isVirtual: e.isVirtual,
          category: e.category,
          description: e.description,
          dressCode: e.dressCode,
          highlights: e.highlights as string[] | null,
          ticketPrice: e.ticketPrice.toString(),
          currency: e.currency,
          capacity: e.capacity,
          registeredCount: e._count.registrations,
          isRegistered: registeredIds.has(e.id),
          bannerImage: e.bannerImage || null,
          bannerImages: (e.bannerImages as string[] | null) || null,
          featured: Boolean(e.featured),
        }))}
      />
      <PageCommercialBannersSection pageLink="/events" initialBanners={commercialBanners} />
    </div>
  );
}
