import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Lists the authenticated user's registered push notification devices.
 */
export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) {
    return fail(401, "Authentication required");
  }

  const devices = await db.alumniDeviceToken.findMany({
    where: {
      userId: session.sub,
      isActive: true,
    },
    select: {
      id: true,
      platform: true,
      deviceName: true,
      appVersion: true,
      createdAt: true,
      lastUsedAt: true,
    },
    orderBy: {
      lastUsedAt: "desc",
    },
  });

  return ok({
    devices,
    total: devices.length,
  });
}

