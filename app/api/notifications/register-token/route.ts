import { type NextRequest } from "next/server";
import { getAlumniSession } from "@/lib/auth/session";
import { registerDeviceTokenSchema } from "@/lib/validation/notifications";
import { registerUserDeviceToken } from "@/lib/notifications";
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

  const result = await registerUserDeviceToken({
    userId: session.sub,
    ...parsed.data,
  });

  if (!result.success) {
    return fail(500, result.error || "Failed to register device token");
  }

  return ok(result, 201);
}

