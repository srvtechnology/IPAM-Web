import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { normalizeActivityPhotos } from "@/lib/validation/activities";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.toUpperCase();
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const featuredParam = searchParams.get("featured")?.toLowerCase();
  const limitParam = searchParams.get("limit");

  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : NaN;
  const take = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : undefined;

  const activities = await db.alumniActivity.findMany({
    where: {
      ...(status === "CURRENT" || status === "PREVIOUS" ? { status } : {}),
      ...(featuredParam === "true" ? { featured: true } : {}),
      ...(category ? { category: { contains: category } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { location: { contains: q } },
              { category: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    ...(take ? { take } : {}),
  });

  return ok(
    activities.map((a) => {
      const photos = normalizeActivityPhotos(a.photos);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        displayDate: a.displayDate,
        location: a.location,
        category: a.category,
        photos,
        coverPhoto: photos[0] ?? null,
        photosCount: photos.length,
        featured: a.featured,
        sortOrder: a.sortOrder,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      };
    })
  );
}
