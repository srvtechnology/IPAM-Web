import { type NextRequest } from "next/server";
import { getBannersForPage } from "@/lib/commercial-banners";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  let pageLink = url.searchParams.get("page")?.trim() || "/";

  if (pageLink.toLowerCase() === "home") {
    pageLink = "/";
  }

  const banners = await getBannersForPage(pageLink);
  return ok(banners);
}
