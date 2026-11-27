import { db } from "@/lib/db";
import { getBannersForPage } from "@/lib/commercial-banners";
import { normalizeActivityPhotos, type AlumniActivityItem } from "@/lib/validation/activities";
import ActivitiesView from "@/components/public/ActivitiesView";
import PageCommercialBannersSection from "@/components/public/PageCommercialBannersSection";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Activities & Photo Gallery | IPAM Alumni Association",
  description:
    "Explore current and previous IPAM alumni events, initiatives, and multi-photo visual chronicles.",
};

export default async function ActivitiesPage() {
  const [rows, commercialBanners] = await Promise.all([
    db.alumniActivity.findMany({
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    getBannersForPage("/"),
  ]);

  const activities: AlumniActivityItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    displayDate: row.displayDate,
    location: row.location,
    category: row.category,
    photos: normalizeActivityPhotos(row.photos),
    featured: row.featured,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));

  return (
    <div>
      <ActivitiesView initialActivities={activities} />
      <PageCommercialBannersSection pageLink="/activities" initialBanners={commercialBanners} />
    </div>
  );
}
