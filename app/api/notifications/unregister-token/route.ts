import { type NextRequest } from "next/server";
import { getAlumniSession } from "@/lib/auth/session";
import { unregisterDeviceTokenSchema } from "@/lib/validation/notifications";
import { unregisterUserDeviceToken } from "@/lib/notifications";
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

  const result = await unregisterUserDeviceToken({
    userId: session.sub,
    token: parsed.data.token,
  });

  return ok(result);
}

