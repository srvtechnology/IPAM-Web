import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Not authenticated");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (!user || user.status !== "APPROVED") {
    return fail(403, "Account is not active or approved");
  }

  // Fetch all delivered broadcasts dispatched by the administration
  const records = await db.broadcastRecord.findMany({
    where: {
      status: "DELIVERED",
    },
    orderBy: {
      date: "desc",
    },
    take: 50,
  });

  const notifications = records.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    channels: Array.isArray(r.channels) ? r.channels : [],
    date: r.date.toISOString(),
    priority: r.priority || "NORMAL",
    audienceLabel: r.audienceLabel,
    actionUrl: r.actionUrl || null,
    eventDate: r.eventDate ? r.eventDate.toISOString() : null,
    eventVenue: r.eventVenue || null,
    rsvpDeadline: r.rsvpDeadline ? r.rsvpDeadline.toISOString() : null,
  }));

  return ok({
    notifications,
    total: notifications.length,
    userEmail: user.email,
  });
}
