import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, getAlumniSession } from "@/lib/auth/session";
import { testPushNotificationSchema } from "@/lib/validation/notifications";
import { sendPushToDevice, sendPushToTopic, isFirebaseConfigured, getFirebaseCredentials } from "@/lib/firebase";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Diagnostic & testing endpoint to dispatch a test FCM push notification.
 * Authorized for both Admins and Alumni testing their push devices.
 */
export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  const alumni = await getAlumniSession(req);

  if (!admin && !alumni) {
    return fail(401, "Authentication required to send test push notification");
  }

  const creds = getFirebaseCredentials();
  if (!creds || !isFirebaseConfigured()) {
    return fail(503, "Firebase Cloud Messaging credentials not configured on server");
  }

  const body = await req.json().catch(() => ({}));
  const parsed = testPushNotificationSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { token, topic, title, message, priority, actionUrl } = parsed.data;

  // 1. If explicit token provided, send directly to that token
  if (token) {
    const res = await sendPushToDevice({
      token,
      title,
      body: message,
      priority,
      actionUrl,
      data: {
        test: "true",
        triggeredBy: admin ? `Admin:${admin.email}` : `Alumni:${alumni?.email}`,
      },
    });

    return ok({
      type: "DEVICE_TOKEN",
      target: token.substring(0, 15) + "...",
      projectId: creds.project_id,
      clientEmail: creds.client_email,
      result: res,
    });
  }

  // 2. If explicit topic provided, send to topic
  if (topic) {
    const res = await sendPushToTopic({
      topic,
      title,
      body: message,
      priority,
      actionUrl,
      data: {
        test: "true",
        triggeredBy: admin ? `Admin:${admin.email}` : `Alumni:${alumni?.email}`,
      },
    });

    return ok({
      type: "TOPIC",
      topic,
      projectId: creds.project_id,
      clientEmail: creds.client_email,
      result: res,
    });
  }

  // 3. Otherwise, if user has registered devices, send to the user's active devices
  if (alumni) {
    const devices = await db.alumniDeviceToken.findMany({
      where: { userId: alumni.sub, isActive: true },
      take: 5,
    });

    if (devices.length === 0) {
      return fail(400, "No active registered devices found for this account. Pass an explicit 'token' or 'topic'.");
    }

    const results = await Promise.all(
      devices.map((d) =>
        sendPushToDevice({
          token: d.token,
          title,
          body: message,
          priority,
          actionUrl,
          data: { test: "true" },
        })
      )
    );

    return ok({
      type: "USER_DEVICES",
      deviceCount: devices.length,
      projectId: creds.project_id,
      results,
    });
  }

  return fail(400, "Specify 'token' or 'topic' in the request payload.");
}

