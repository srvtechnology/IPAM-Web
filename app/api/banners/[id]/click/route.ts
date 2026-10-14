import { NextResponse, type NextRequest } from "next/server";
import { recordBannerClick } from "@/lib/commercial-banners";
import { ok, fail } from "@/lib/api-response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return fail(400, "Banner ID required");

  const success = await recordBannerClick(id);
  if (!success) return fail(404, "Banner not found");

  return ok({ success: true, id });
}
