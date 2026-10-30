import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setAlumniSessionCookie } from "@/lib/auth/session";
import { alumniLoginSchema } from "@/lib/validation/auth";
import { registerUserDeviceToken } from "@/lib/notifications";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = alumniLoginSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { email, password, rememberMe } = parsed.data;
  const user = await db.alumniUser.findUnique({
    where: { email },
    include: { profile: true, alumniRecord: true },
  });
  if (!user) return fail(401, "Invalid email or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail(401, "Invalid email or password");

  // Check approval status: user must be APPROVED to log in
  const isRejected = user.status === "REJECTED" || user.alumniRecord?.status === "REJECTED";
  const isPending = user.status === "PENDING" || user.alumniRecord?.status === "PENDING";

  if (isRejected) {
    const rejectionReason =
      user.rejectionReason ||
      user.alumniRecord?.rejectionReason ||
      "Application did not meet university registration criteria.";
    return fail(403, "Your registration was rejected by the administration.", {
      status: "REJECTED",
      rejectionReason,
      email: user.email,
      studentId: user.studentId,
      canResubmit: true,
    });
  }

  if (isPending) {
    return fail(
      403,
      "Your registration is currently pending administrator approval. Please wait for the registrar to verify your credentials.",
      {
        status: "PENDING",
        email: user.email,
      }
    );
  }

  const token = await setAlumniSessionCookie({ sub: user.id, email: user.email }, { persistent: rememberMe });

  // Mobile Push Notifications: Seamlessly register FCM device token if provided in login payload
  const incomingDeviceToken =
    parsed.data.device?.token || parsed.data.deviceToken || parsed.data.fcmToken;

  let deviceRegistration: any = null;
  if (incomingDeviceToken) {
    const platform = parsed.data.device?.platform || parsed.data.platform || "android";
    const deviceName = parsed.data.device?.deviceName || parsed.data.deviceName;
    const appVersion = parsed.data.device?.appVersion || parsed.data.appVersion;
    const subscribeToAll = parsed.data.device?.subscribeToAll ?? parsed.data.subscribeToAll ?? true;

    deviceRegistration = await registerUserDeviceToken({
      userId: user.id,
      token: incomingDeviceToken,
      platform,
      deviceName,
      appVersion,
      subscribeToAll,
    });
  }

  const savedJobsCount = await db.savedJob.count({ where: { userId: user.id } });
  const { passwordHash: _omit, ...safeUser } = user;
  return ok({
    ...safeUser,
    token,
    savedJobsCount,
    ...(deviceRegistration && deviceRegistration.success
      ? {
          device: deviceRegistration.device,
          deviceRegistered: true,
          topicSubscribed: deviceRegistration.topicSubscribed,
        }
      : {}),
  });
}
