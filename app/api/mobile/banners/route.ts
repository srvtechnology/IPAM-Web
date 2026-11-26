import { type NextRequest } from "next/server";
import { getBannersForPage } from "@/lib/commercial-banners";
import { getHeroSlides } from "@/lib/hero-slides";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Dedicated mobile banners endpoint returning:
 * - heroSlides: Top carousel slides on the Home screen
 * - bottomBanners: Commercial/sponsor banners rendered at the bottom of the web Home screen (or requested page)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let page = searchParams.get("page")?.trim() || "/";
  if (page.toLowerCase() === "home") {
    page = "/";
  }

  const [heroSlides, bottomBanners] = await Promise.all([
    getHeroSlides(),
    getBannersForPage(page),
  ]);

  return ok({
    page,
    heroSlides,
    bottomBanners,
  });
}
