import { getHeroSlides } from "@/lib/hero-slides";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const slides = await getHeroSlides();
  return ok(slides);
}
