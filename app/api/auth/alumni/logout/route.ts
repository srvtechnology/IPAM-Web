import type { NextRequest } from "next/server";
import { clearAlumniSessionCookie, getAlumniSession } from "@/lib/auth/session";
import { unregisterUserDeviceToken } from "@/lib/notifications";
import { ok } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req).catch(() => null);
  const body = await req.json().catch(() => null);
  const incomingToken = body?.deviceToken || body?.token || body?.fcmToken;

  if (incomingToken && typeof incomingToken === "string") {
    await unregisterUserDeviceToken({
      userId: session?.sub,
      token: incomingToken,
    }).catch(() => null);
  }

  await clearAlumniSessionCookie();
  return ok({ loggedOut: true, deviceUnregistered: Boolean(incomingToken) });
}
