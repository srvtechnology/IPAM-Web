import { NextResponse, type NextRequest } from "next/server";
import { getBannersForPage } from "@/lib/commercial-banners";
import { ok } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pageLink = url.searchParams.get("page") || "/";

  const banners = await getBannersForPage(pageLink);
  return ok(banners);
}
