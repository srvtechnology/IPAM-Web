import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { unregisterDeviceTokenSchema } from "@/lib/validation/notifications";
import { unsubscribeTokensFromTopic, isFirebaseConfigured } from "@/lib/firebase";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Deactivates an FCM device token upon logout or notification permission revoke.
 */
export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) {
    return fail(401, "Authentication required");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = unregisterDeviceTokenSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { token } = parsed.data;

  // Deactivate in DB
  const existing = await db.alumniDeviceToken.findFirst({
    where: { token, userId: session.sub },
  });

  if (existing) {
    await db.alumniDeviceToken.update({
      where: { id: existing.id },
      data: { isActive: false },
    });
  }

  // Unsubscribe from topic
  if (isFirebaseConfigured()) {
    await unsubscribeTokensFromTopic([token], "all_alumni").catch(() => null);
  }

  return ok({
    unregistered: true,
  });
}

