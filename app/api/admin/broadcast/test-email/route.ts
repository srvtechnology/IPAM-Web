import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth/permissions";
import { ok, fail } from "@/lib/api-response";
import { sendEmail, getSmtpConfig, isEmailConfigured, generateBroadcastEmailHtml } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Diagnostic and verification endpoint to test the SMTP email configuration.
 */
export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "BROADCAST", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  if (!isEmailConfigured()) {
    return fail(503, "SMTP email credentials are not configured on this server");
  }

  const config = getSmtpConfig();
  const body = await req.json().catch(() => ({}));
  const targetEmail = body.to || admin.email || config.user;

  const html = generateBroadcastEmailHtml({
    title: "IPAM Alumni Broadcast SMTP Verification",
    message: `This is a live verification email sent from the IPAM Alumni Omnichannel Broadcast Center.\n\nSMTP Host: ${config.host}:${config.port}\nSender: ${config.fromName} (${config.fromEmail})\nRecipient: ${targetEmail}\nTriggered by Admin: ${admin.email}\nStatus: Operational and ready for live broadcasts.`,
    type: "NOTIFICATION",
    priority: "URGENT",
    recipientName: admin.name || "Administrator",
    actionUrl: "https://ipam.billnbite.cloud/admin/broadcast",
  });

  const result = await sendEmail({
    to: targetEmail,
    subject: "[IPAM Alumni] SMTP Broadcast Test",
    html,
  });

  if (!result.success) {
    return fail(500, `Failed to send email: ${result.error}`);
  }

  return ok({
    sent: true,
    messageId: result.messageId,
    recipient: targetEmail,
    smtp: {
      host: config.host,
      port: config.port,
      user: config.user,
      fromName: config.fromName,
    },
  });
}

