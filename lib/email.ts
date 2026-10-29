import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BroadcastEmailRecipient {
  email: string;
  name?: string;
}

export interface SendBroadcastEmailOptions {
  recipients: Array<string | BroadcastEmailRecipient>;
  title: string;
  message: string;
  type?: "MESSAGE" | "INVITATION" | "NOTIFICATION";
  priority?: "NORMAL" | "URGENT" | "CRITICAL";
  audienceLabel?: string;
  actionUrl?: string | null;
  eventDate?: Date | string | null;
  eventVenue?: string | null;
  rsvpDeadline?: Date | string | null;
}

export interface BroadcastEmailSummary {
  sentCount: number;
  failedCount: number;
  errors: Array<{ email: string; error: string }>;
  messageIds: string[];
}

let cachedTransporter: Transporter | null = null;

export function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== "false";
  const user = process.env.SMTP_USER || "growpos.official@gmail.com";
  const rawPass = process.env.SMTP_PASS || "";
  const pass = rawPass.replace(/\s+/g, "");
  const fromName = process.env.SMTP_FROM_NAME || "IPAM Alumni Association";
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  return { host, port, secure, user, pass, fromName, fromEmail };
}

export function isEmailConfigured(): boolean {
  const config = getSmtpConfig();
  return Boolean(config.host && config.user && config.pass);
}

export function getSmtpTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  const config = getSmtpConfig();

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for 587
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks on internal relays
    },
  });

  return cachedTransporter;
}

/**
 * Verifies that the SMTP server credentials are valid and connection can be opened.
 */
export async function verifySmtpConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getSmtpTransporter();
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends a single email via SMTP.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getSmtpConfig();
  if (!isEmailConfigured()) {
    return { success: false, error: "SMTP credentials not configured" };
  }

  const transporter = getSmtpTransporter();
  const toList = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  try {
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toList,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]+>/g, ""),
      replyTo: options.replyTo || config.fromEmail,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    console.error("[SMTP] Error sending email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Formats a clean date string for emails.
 */
function formatEmailDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return String(date);
  }
}

/**
 * Generates an official, mobile-responsive, university-branded HTML email template.
 */
export function generateBroadcastEmailHtml(options: {
  title: string;
  message: string;
  type?: "MESSAGE" | "INVITATION" | "NOTIFICATION";
  priority?: "NORMAL" | "URGENT" | "CRITICAL";
  recipientName?: string;
  actionUrl?: string | null;
  eventDate?: Date | string | null;
  eventVenue?: string | null;
  rsvpDeadline?: Date | string | null;
}): string {
  const {
    title,
    message,
    type = "NOTIFICATION",
    priority = "NORMAL",
    recipientName = "Distinguished Alumnus",
    actionUrl,
    eventDate,
    eventVenue,
    rsvpDeadline,
  } = options;

  const isUrgent = priority === "URGENT" || priority === "CRITICAL";
  const badgeColor =
    priority === "CRITICAL"
      ? "#EF4444"
      : priority === "URGENT"
      ? "#F59E0B"
      : type === "INVITATION"
      ? "#6366F1"
      : "#10B981";

  const badgeText =
    priority === "CRITICAL"
      ? "CRITICAL ALERT"
      : priority === "URGENT"
      ? "URGENT NOTICE"
      : type === "INVITATION"
      ? "OFFICIAL INVITATION"
      : type === "MESSAGE"
      ? "PRESIDENTIAL DISPATCH"
      : "ADMINISTRATIVE ANNOUNCEMENT";

  const formattedEventDate = formatEmailDate(eventDate);
  const formattedRsvp = formatEmailDate(rsvpDeadline);
  const portalUrl = actionUrl || "https://ipam.billnbite.cloud/profile?tab=notifications";

  // Convert plain text newlines to paragraphs
  const messageParagraphs = message
    .split("\n\n")
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #CBD5E1; font-size: 15px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #020617; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #0F172A; border: 1px solid #334155; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%, #022C22 100%); padding: 24px 32px; border-bottom: 2px solid #10B981;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #34D399; margin-bottom: 4px;">
                      INSTITUTE OF PUBLIC ADMINISTRATION AND MANAGEMENT
                    </div>
                    <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      IPAM Alumni Unified Platform
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #34D399; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase;">
                      Official
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Priority / Type Pill Banner -->
          <tr>
            <td style="padding: 24px 32px 8px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: ${badgeColor}20; border: 1px solid ${badgeColor}; border-radius: 6px; padding: 4px 12px;">
                    <span style="color: ${badgeColor}; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 8px 32px 16px 32px;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #FFFFFF; line-height: 1.3; letter-spacing: -0.5px;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Salutation & Body Content -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; color: #94A3B8; font-size: 14px; font-weight: 500;">
                Dear ${recipientName},
              </p>
              
              <div style="border-left: 3px solid #10B981; padding-left: 16px; margin: 16px 0;">
                ${messageParagraphs}
              </div>

              <!-- Event Details Box if applicable -->
              ${
                formattedEventDate || eventVenue || formattedRsvp
                  ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; margin: 20px 0; padding: 16px;">
                <tr>
                  <td>
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #F59E0B; margin-bottom: 8px;">
                      Event Schedule & Venue Details
                    </div>
                    ${
                      formattedEventDate
                        ? `<div style="font-size: 13px; color: #F8FAFC; margin-bottom: 6px;"><strong>Date & Time:</strong> ${formattedEventDate}</div>`
                        : ""
                    }
                    ${
                      eventVenue
                        ? `<div style="font-size: 13px; color: #F8FAFC; margin-bottom: 6px;"><strong>Venue:</strong> ${eventVenue}</div>`
                        : ""
                    }
                    ${
                      formattedRsvp
                        ? `<div style="font-size: 13px; color: #FCA5A5;"><strong>RSVP Deadline:</strong> ${formattedRsvp}</div>`
                        : ""
                    }
                  </td>
                </tr>
              </table>
              `
                  : ""
              }

              <!-- Call to Action Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center" style="background-color: #10B981; border-radius: 8px;">
                    <a href="${portalUrl}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #020617; text-decoration: none; border-radius: 8px;">
                      View Details on Alumni Portal &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Security & Verification Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: 0; border-top: 1px solid #334155; margin: 0;">
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #090D1A;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="color: #64748B; font-size: 12px; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">
                      You are receiving this official university communication as a verified member of the Institute of Public Administration and Management (IPAM USL) Alumni Network.
                    </p>
                    <p style="margin: 0 0 8px 0;">
                      <strong>Institute of Public Administration and Management</strong><br>
                      University of Sierra Leone, A.J. Momoh Street, Tower Hill, Freetown, Sierra Leone.
                    </p>
                    <p style="margin: 0;">
                      Support & Helpdesk: <a href="mailto:support@ipam.edu" style="color: #10B981; text-decoration: none;">support@ipam.edu</a> | <a href="https://ipam.billnbite.cloud" style="color: #10B981; text-decoration: none;">ipam.billnbite.cloud</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatches broadcast emails in parallel chunks with rate-limiting.
 */
export async function sendBroadcastEmails(
  options: SendBroadcastEmailOptions
): Promise<BroadcastEmailSummary> {
  const { recipients, title } = options;

  if (!isEmailConfigured()) {
    console.warn("[Email] SMTP not configured; skipping broadcast email delivery.");
    return {
      sentCount: 0,
      failedCount: recipients.length,
      errors: [{ email: "all", error: "SMTP credentials not configured" }],
      messageIds: [],
    };
  }

  // Deduplicate and normalize recipients
  const normalizedRecipients: BroadcastEmailRecipient[] = [];
  const seenEmails = new Set<string>();

  for (const r of recipients) {
    const email = (typeof r === "string" ? r : r.email).trim().toLowerCase();
    const name = typeof r === "string" ? undefined : r.name;
    if (email && email.includes("@") && !seenEmails.has(email)) {
      seenEmails.add(email);
      normalizedRecipients.push({ email, name });
    }
  }

  const summary: BroadcastEmailSummary = {
    sentCount: 0,
    failedCount: 0,
    errors: [],
    messageIds: [],
  };

  if (normalizedRecipients.length === 0) {
    return summary;
  }

  // Send in concurrent chunks of 5 to comply with Gmail SMTP concurrency limits
  const CHUNK_SIZE = 5;
  for (let i = 0; i < normalizedRecipients.length; i += CHUNK_SIZE) {
    const chunk = normalizedRecipients.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (recip) => {
      const html = generateBroadcastEmailHtml({
        ...options,
        recipientName: recip.name || "Distinguished Alumnus",
      });

      const res = await sendEmail({
        to: recip.email,
        subject: `[IPAM Alumni] ${title}`,
        html,
      });

      if (res.success && res.messageId) {
        summary.sentCount++;
        summary.messageIds.push(res.messageId);
      } else {
        summary.failedCount++;
        summary.errors.push({ email: recip.email, error: res.error || "Unknown error" });
      }
    });

    await Promise.all(chunkPromises);

    // Minor delay between chunks to avoid rate limiting
    if (i + CHUNK_SIZE < normalizedRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return summary;
}

let dbInstance: any = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  try {
    const mod = await import("@/lib/db");
    dbInstance = mod.db;
  } catch {
    try {
      const mod = await import("./db");
      dbInstance = mod.db;
    } catch {
      return null;
    }
  }
  return dbInstance;
}

/**
 * Resolves alumni email and name recipients for a given audience group or audience label.
 */
export async function resolveAudienceRecipients(options: {
  audienceGroupId?: string;
  audienceLabel?: string;
}): Promise<Array<{ email: string; name: string; userId?: string }>> {
  const { audienceGroupId, audienceLabel } = options;
  const db = await getDb();
  if (!db) return [];

  let group: any = null;
  if (audienceGroupId) {
    group = await db.targetAudienceGroup.findUnique({ where: { id: audienceGroupId } }).catch(() => null);
  }
  if (!group && audienceLabel) {
    group = await db.targetAudienceGroup.findFirst({ where: { name: audienceLabel } }).catch(() => null);
  }

  const recipientsMap = new Map<string, { email: string; name: string; userId?: string }>();

  if (group && group.criteria) {
    const criteria = typeof group.criteria === "object" ? (group.criteria as any) : {};
    const userIds = Array.isArray(criteria.userIds) ? criteria.userIds : [];

    if (userIds.length > 0 && !criteria.selectAll) {
      // Find matching alumni records by IDs
      const records = await db.alumniRecord.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true, alumniUserId: true },
      });
      for (const r of records) {
        if (r.email && r.email.includes("@")) {
          recipientsMap.set(r.email.toLowerCase(), {
            email: r.email,
            name: r.name,
            userId: r.alumniUserId || undefined,
          });
        }
      }
      if (recipientsMap.size > 0) {
        return Array.from(recipientsMap.values());
      }
    }
  }

  // If selectAll or no specific group, fetch all registered alumni records + alumni users
  const [records, users] = await Promise.all([
    db.alumniRecord.findMany({
      where: { email: { not: "" } },
      select: { id: true, name: true, email: true, alumniUserId: true },
      take: 1000,
    }).catch(() => []),
    db.alumniUser.findMany({
      where: { status: "APPROVED" },
      select: { id: true, email: true, profile: { select: { name: true } } },
      take: 1000,
    }).catch(() => []),
  ]);

  for (const r of records) {
    if (r.email && r.email.includes("@")) {
      recipientsMap.set(r.email.toLowerCase(), {
        email: r.email,
        name: r.name,
        userId: r.alumniUserId || undefined,
      });
    }
  }

  for (const u of users) {
    if (u.email && u.email.includes("@") && !recipientsMap.has(u.email.toLowerCase())) {
      recipientsMap.set(u.email.toLowerCase(), {
        email: u.email,
        name: u.profile?.name || "Alumnus",
        userId: u.id,
      });
    }
  }

  return Array.from(recipientsMap.values());
}
