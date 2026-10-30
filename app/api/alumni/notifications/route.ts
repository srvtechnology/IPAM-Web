import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Not authenticated");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });
  if (!user || user.status !== "APPROVED") {
    return fail(403, "Account is not active or approved");
  }

  // Fetch both personal notifications and broadcast records in parallel
  const [personalNotifs, records] = await Promise.all([
    db.alumniNotification.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
    }).catch(() => []),
    db.broadcastRecord.findMany({
      where: { status: "DELIVERED" },
      orderBy: { date: "desc" },
      take: 50,
    }).catch(() => []),
  ]);

  const mappedPersonal = personalNotifs.map((n) => ({
    id: n.id,
    type: (n.type === "INVITATION" || n.type === "MESSAGE" ? n.type : "NOTIFICATION") as
      | "MESSAGE"
      | "INVITATION"
      | "NOTIFICATION",
    categoryType: n.type,
    title: n.title,
    message: n.message,
    channels: ["PUSH", "IN_APP"],
    date: n.createdAt.toISOString(),
    priority: n.priority || "NORMAL",
    audienceLabel: "Direct Notification",
    actionUrl: n.actionUrl || null,
    eventDate: null,
    eventVenue: null,
    rsvpDeadline: null,
    isRead: n.isRead,
    isPersonal: true,
  }));

  const mappedBroadcasts = records.map((r) => ({
    id: r.id,
    type: r.type,
    categoryType: "BROADCAST",
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
    isRead: false,
    isPersonal: false,
  }));

  // Merge and sort newest first
  const unified = [...mappedPersonal, ...mappedBroadcasts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return ok({
    notifications: unified,
    total: unified.length,
    unreadPersonalCount: personalNotifs.filter((n) => !n.isRead).length,
    userEmail: user.email,
  });
}
