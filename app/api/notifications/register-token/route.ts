import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { registerDeviceTokenSchema } from "@/lib/validation/notifications";
import { subscribeTokensToTopic, isFirebaseConfigured } from "@/lib/firebase";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Registers or updates an FCM device push token for the authenticated alumni.
 */
export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) {
    return fail(401, "Authentication required to register device token");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = registerDeviceTokenSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { token, platform, deviceName, appVersion, subscribeToAll } = parsed.data;

  // Upsert token for this user
  const deviceRecord = await db.alumniDeviceToken.upsert({
    where: { token },
    update: {
      userId: session.sub,
      platform,
      deviceName: deviceName || null,
      appVersion: appVersion || null,
      isActive: true,
      lastUsedAt: new Date(),
    },
    create: {
      userId: session.sub,
      token,
      platform,
      deviceName: deviceName || null,
      appVersion: appVersion || null,
      isActive: true,
      lastUsedAt: new Date(),
    },
  });

  // Automatically subscribe device to default FCM broadcast topic "all_alumni"
  let topicSubscribed = false;
  if (subscribeToAll && isFirebaseConfigured()) {
    try {
      const subResult = await subscribeTokensToTopic([token], "all_alumni");
      topicSubscribed = subResult.success;
    } catch (err) {
      console.warn("[FCM] Topic subscription error:", err);
    }
  }

  return ok({
    registered: true,
    device: {
      id: deviceRecord.id,
      platform: deviceRecord.platform,
      deviceName: deviceRecord.deviceName,
      isActive: deviceRecord.isActive,
      lastUsedAt: deviceRecord.lastUsedAt,
    },
    topicSubscribed,
    fcmConfigured: isFirebaseConfigured(),
  }, 201);
}

