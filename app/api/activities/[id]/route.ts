import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { normalizeActivityPhotos } from "@/lib/validation/activities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const activity = await db.alumniActivity.findUnique({
    where: { id },
  });

  if (!activity) {
    return fail(404, "Activity not found");
  }

  const photos = normalizeActivityPhotos(activity.photos);

  return ok({
    id: activity.id,
    title: activity.title,
    description: activity.description,
    status: activity.status,
    displayDate: activity.displayDate,
    location: activity.location,
    category: activity.category,
    photos,
    coverPhoto: photos[0] ?? null,
    photosCount: photos.length,
    featured: activity.featured,
    sortOrder: activity.sortOrder,
    createdAt: activity.createdAt.toISOString(),
    updatedAt: activity.updatedAt.toISOString(),
  });
}
