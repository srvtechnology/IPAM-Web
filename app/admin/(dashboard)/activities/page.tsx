import { db } from "@/lib/db";
import { normalizeActivityPhotos, type AlumniActivityItem } from "@/lib/validation/activities";
import ActivitiesManagementView from "@/components/admin/activities/ActivitiesManagementView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminActivitiesPage() {
  const rows = await db.alumniActivity.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const initialActivities: AlumniActivityItem[] = rows.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    status: a.status,
    displayDate: a.displayDate,
    location: a.location,
    category: a.category,
    photos: normalizeActivityPhotos(a.photos),
    featured: a.featured,
    sortOrder: a.sortOrder,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return <ActivitiesManagementView initialActivities={initialActivities} />;
}
