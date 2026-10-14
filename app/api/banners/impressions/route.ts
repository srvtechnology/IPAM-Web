import { NextResponse, type NextRequest } from "next/server";
import { recordBannerImpressions } from "@/lib/commercial-banners";
import { ok } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

  if (ids.length > 0) {
    await recordBannerImpressions(ids);
  }

  return ok({ success: true, count: ids.length });
}
