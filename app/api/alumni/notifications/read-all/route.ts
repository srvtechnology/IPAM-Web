import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Not authenticated");

  const result = await db.alumniNotification.updateMany({
    where: {
      userId: session.sub,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return ok({
    markedReadCount: result.count,
  });
}

