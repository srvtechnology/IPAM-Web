import { db } from "@/lib/db";
import HomeHeroSection from "@/components/public/HomeHeroSection";
import HomeMetricsSection from "@/components/public/HomeMetricsSection";
import HomeLeadershipSection from "@/components/public/HomeLeadershipSection";
import HomeAboutSection from "@/components/public/HomeAboutSection";
import HomeFeaturesSection from "@/components/public/HomeFeaturesSection";
import HomeJobsSection from "@/components/public/HomeJobsSection";
import HomeEventsSection from "@/components/public/HomeEventsSection";
import HomeBusinessesSection from "@/components/public/HomeBusinessesSection";

export default async function HomePage() {
  const [jobs, events, leaders, businesses] = await Promise.all([
    db.jobOpening.findMany({ orderBy: { postedDate: "desc" }, take: 3 }),
    db.alumniEvent.findMany({ orderBy: { date: "asc" }, take: 3 }),
    db.leadershipMember.findMany({ take: 4 }),
    db.alumniBusiness.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div>
      <HomeHeroSection />

      <HomeMetricsSection />

      <HomeLeadershipSection leaders={leaders} />

      <HomeAboutSection />

      <HomeFeaturesSection />

      <HomeJobsSection
        jobs={jobs.map((j) => ({ id: j.id, title: j.title, company: j.company, location: j.location, type: j.type }))}
      />

      <HomeEventsSection
        events={events.map((e) => ({
          id: e.id,
          title: e.title,
          displayDate: e.displayDate,
          description: e.description,
          location: e.location,
          ticketPrice: e.ticketPrice.toString(),
          currency: e.currency,
        }))}
      />

      <HomeBusinessesSection
        businesses={businesses.map((b) => ({
          id: b.id,
          name: b.name,
          founders: b.founders,
          classYear: b.classYear,
          category: b.category,
          industry: b.industry,
          description: b.description,
          location: b.location,
          image: b.image,
          featured: b.featured,
        }))}
      />
    </div>
  );
}
