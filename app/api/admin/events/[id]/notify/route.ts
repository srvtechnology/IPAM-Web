import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import { notifyEventAttendees } from "@/lib/notifications";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { z } from "zod";

const notifyAttendeesSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  message: z.string().min(1, "Message content is required"),
  actionUrl: z.string().optional(),
});

/**
 * Dispatches an event announcement or reminder notification ONLY to registered alumni of this event.
 * Delivers Push and In-App notifications to registered alumni devices, and email to registered attendees.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission(req, "COMMERCIAL", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const { id: eventId } = await params;
  const event = await db.alumniEvent.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, date: true, location: true },
  });

  if (!event) return fail(404, "Event not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = notifyAttendeesSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const result = await notifyEventAttendees({
    eventId,
    subject: parsed.data.subject,
    message: parsed.data.message,
    actionUrl: parsed.data.actionUrl || `/events`,
  });

  const { ipAddress, location: loc, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: "Admin",
    action: "EVENT_ATTENDEES_NOTIFIED",
    actionLabel: "Event Notification Dispatched to Registered Alumni",
    category: "COMMERCIAL_FINANCE",
    target: `Event: ${event.title}`,
    targetType: "AlumniEvent",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location: loc,
    deviceInfo,
    details: `Dispatched "${parsed.data.subject}" to ${result.notifiedCount} registered alumni (Push/In-App) and ${result.emailRecipientsCount} attendee emails.`,
  });

  return ok({
    success: true,
    eventId,
    eventTitle: event.title,
    registeredAlumniNotified: result.notifiedCount,
    emailsDispatched: result.emailRecipientsCount,
  });
}
