import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import {
  getTwilioConfig,
  isTwilioConfigured,
  verifyTwilioCredentials,
  sendSms,
  normalizePhoneNumber,
} from "@/lib/sms";

export const dynamic = "force-dynamic";

/**
 * Diagnostic and verification endpoint to test the Twilio SMS service.
 * Supports credential verification and optional live test SMS dispatch.
 */
export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  if (!isTwilioConfigured()) {
    return fail(503, "Twilio SMS credentials are not configured on this server");
  }

  const config = getTwilioConfig();
  const body = await req.json().catch(() => ({}));
  const to = typeof body?.to === "string" ? body.to.trim() : "";

  // If no recipient number provided, run a live credential and service health check
  if (!to) {
    const credCheck = await verifyTwilioCredentials();
    if (!credCheck.success) {
      return fail(502, `Twilio verification failed: ${credCheck.error}`);
    }

    return ok({
      verified: true,
      accountSid: config.accountSid,
      messagingServiceSid: config.messagingServiceSid,
      accountStatus: credCheck.accountStatus,
      friendlyName: credCheck.friendlyName,
      message:
        "Twilio account and Messaging Service are verified and operational. Provide a 'to' phone number in E.164 format to send a test message.",
    });
  }

  const normalizedTo = normalizePhoneNumber(to);
  if (!normalizedTo || normalizedTo.length < 8) {
    return fail(400, `Invalid phone number format: "${to}". Please use E.164 format (e.g., +23276123456 or +14155552671).`);
  }

  const testBody =
    body.message ||
    `[IPAM Alumni] Live SMS Broadcast test dispatched by Admin (${admin.email}). System operational.`;

  const result = await sendSms({
    to: normalizedTo,
    body: testBody,
  });

  if (!result.success) {
    return fail(500, `Failed to dispatch SMS via Twilio: ${result.error}`, {
      recipient: normalizedTo,
      accountSid: config.accountSid,
      messagingServiceSid: config.messagingServiceSid,
    });
  }

  return ok({
    sent: true,
    sid: result.sid,
    status: result.status,
    recipient: result.to,
    messagingServiceSid: config.messagingServiceSid,
  });
}

