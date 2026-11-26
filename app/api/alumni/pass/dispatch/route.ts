import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { sendEmail, renderUniversityEmailTemplate } from "@/lib/email";

export const dynamic = "force-dynamic";

const dispatchPassSchema = z.object({
  recipientEmail: z.string().email("Please enter a valid recipient email address"),
  recipientName: z.string().optional(),
  verifyUrl: z.string().url().optional(),
});

/**
 * POST /api/alumni/pass/dispatch
 * Sends the authenticated alumni's official verifiable Digital Pass link & credentials
 * via institutional SMTP email to a recipient (employer, recruiter, or partner).
 */
export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "You must be signed in to dispatch your digital pass");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = dispatchPassSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    return fail(404, "Alumni profile not found");
  }
  if (user.status !== "APPROVED") {
    return fail(403, "Only approved alumni passes can be dispatched");
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "https://ipam.billnbite.cloud";
  const verifyUrl = parsed.data.verifyUrl || `${origin}/pass?card=${encodeURIComponent(user.studentId)}`;
  const recipientDisplay = parsed.data.recipientName?.trim() || "Recipient";

  const html = renderUniversityEmailTemplate({
    title: `Official Alumni Credential: ${user.profile.name}`,
    badgeText: "VERIFIED CREDENTIAL DISPATCH",
    badgeColor: "#10B981",
    recipientName: recipientDisplay,
    contentHtml: `
      <p style="margin: 0 0 16px; color: #E2E8F0; line-height: 1.6;">
        <strong style="color: #FFFFFF;">${user.profile.name}</strong> has shared their official verified
        <strong style="color: #34D399;">IPAM Alumni Digital Credential</strong> with you for verification.
      </p>
      <table style="width:100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; background: #020617; border: 1px solid #334155; border-radius: 8px; overflow: hidden;">
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; color: #94A3B8; width: 40%;">Full Name</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; font-weight: 700; color: #F8FAFC;">${user.profile.name}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; color: #94A3B8;">Verified Alumni ID</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; font-family: monospace; font-weight: 700; color: #34D399;">${user.studentId}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; color: #94A3B8;">Academic Program</td>
          <td style="padding: 10px 14px; border-bottom: 1px solid #1E293B; font-weight: 600; color: #F8FAFC;">${user.profile.degree} (${user.profile.major}) &bull; Class of ${user.profile.classYear}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; color: #94A3B8;">Membership Standing</td>
          <td style="padding: 10px 14px; font-weight: 700; color: #34D399;">Approved &amp; Registrar Verified (${user.membershipTier})</td>
        </tr>
      </table>
      <p style="margin: 12px 0 0; color: #94A3B8; font-size: 13px;">
        Click below to inspect the live digital pass and verify registrar authenticity.
      </p>
    `,
    actionButton: {
      text: "Verify Official Alumni Pass",
      url: verifyUrl,
    },
    footerNote: `Dispatched on behalf of ${user.profile.name} (${user.email})`,
  });

  const emailResult = await sendEmail({
    to: parsed.data.recipientEmail,
    subject: `Verified IPAM Alumni Credential — ${user.profile.name} (${user.studentId})`,
    replyTo: user.email,
    html,
    text: `${user.profile.name} shared their official IPAM Alumni Pass (ID: ${user.studentId}, ${user.profile.degree} Class of ${user.profile.classYear}). Verify at: ${verifyUrl}`,
  });

  if (!emailResult.success) {
    return fail(502, emailResult.error || "Failed to send verification email");
  }

  return ok({
    sent: true,
    recipientEmail: parsed.data.recipientEmail,
    verifyUrl,
    messageId: emailResult.messageId,
  });
}
