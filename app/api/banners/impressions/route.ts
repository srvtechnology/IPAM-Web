import { type NextRequest } from "next/server";
import { recordBannerImpressions } from "@/lib/commercial-banners";
import { ok } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawIds = Array.isArray(body?.ids)
    ? body.ids
    : Array.isArray(body?.bannerIds)
    ? body.bannerIds
    : [];
  const ids: string[] = rawIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0);

  if (ids.length > 0) {
    await recordBannerImpressions(ids);
  }

  return ok({ success: true, count: ids.length, recorded: ids.length });
}
