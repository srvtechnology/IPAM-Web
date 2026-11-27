import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok } from "@/lib/api-response";
import { normalizeActivityPhotos } from "@/lib/validation/activities";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status")?.toUpperCase();
  const q = searchParams.get("q")?.trim();

  const activities = await db.alumniActivity.findMany({
    where: {
      ...(status === "CURRENT" || status === "PREVIOUS" ? { status } : {}),
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
  });

  return ok(
    activities.map((a) => ({
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
    }))
  );
}
