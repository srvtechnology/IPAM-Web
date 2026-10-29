import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Not authenticated");

  const { id } = await params;

  const existing = await db.alumniNotification.findFirst({
    where: { id, userId: session.sub },
  });

  if (!existing) {
    return fail(404, "Notification not found");
  }

  const updated = await db.alumniNotification.update({
    where: { id },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return ok({
    id: updated.id,
    isRead: updated.isRead,
    readAt: updated.readAt,
  });
}

