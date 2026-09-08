import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { createBusinessSchema } from "@/lib/validation/businesses";
import { ok, fail } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim();

  const businesses = await db.alumniBusiness.findMany({
    where: {
      ...(featured === "true" ? { featured: true } : {}),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { industry: { contains: q } },
              { tagline: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(businesses);
}

export async function POST(req: NextRequest) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to submit a business");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createBusinessSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const business = await db.alumniBusiness.create({ data: parsed.data });
  return ok(business, 201);
}
