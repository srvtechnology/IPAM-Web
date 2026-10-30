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

// --------------------------------------------------------------------------
// Official University Email Templates & Dispatches
// --------------------------------------------------------------------------

export const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL ||
  process.env.SMTP_USER ||
  "growpos.official@gmail.com";

export interface RenderTemplateOptions {
  title: string;
  badgeText: string;
  badgeColor?: string;
  recipientName?: string;
  contentHtml: string;
  actionButton?: { text: string; url: string };
  metaBoxHtml?: string;
  footerNote?: string;
}

/**
 * Universal university-branded dark-navy & emerald email wrapper.
 */
export function renderUniversityEmailTemplate(options: RenderTemplateOptions): string {
  const {
    title,
    badgeText,
    badgeColor = "#10B981",
    recipientName = "Distinguished Alumnus",
    contentHtml,
    actionButton,
    metaBoxHtml,
    footerNote,
  } = options;

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

          <!-- Content Body -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; color: #94A3B8; font-size: 14px; font-weight: 500;">
                Dear ${recipientName},
              </p>
              
              <div style="color: #CBD5E1; font-size: 15px; line-height: 1.6;">
                ${contentHtml}
              </div>

              <!-- Metadata Box -->
              ${metaBoxHtml || ""}

              <!-- Call to Action -->
              ${
                actionButton
                  ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center" style="background-color: #10B981; border-radius: 8px;">
                    <a href="${actionButton.url}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #020617; text-decoration: none; border-radius: 8px;">
                      ${actionButton.text} &rarr;
                    </a>
                  </td>
                </tr>
              </table>`
                  : ""
              }

            </td>
          </tr>

          <!-- Divider -->
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
                      ${footerNote || "You are receiving this official university communication from the Institute of Public Administration and Management (IPAM USL)."}
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

function renderDetailsTable(
  rows: Array<{ label: string; value: string | number | boolean | null | undefined }>
): string {
  const filtered = rows.filter(
    (r) => r.value !== null && r.value !== undefined && String(r.value).trim().length > 0
  );
  if (filtered.length === 0) return "";

  const rowsHtml = filtered
    .map(
      (r) => `<tr>
      <td style="padding: 8px 12px; font-size: 13px; color: #94A3B8; border-bottom: 1px solid #334155; width: 38%;">${r.label}</td>
      <td style="padding: 8px 12px; font-size: 13px; color: #F8FAFC; font-weight: 600; border-bottom: 1px solid #334155;">${String(r.value)}</td>
    </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #1E293B; border: 1px solid #334155; border-radius: 12px; margin: 20px 0; overflow: hidden;">
    ${rowsHtml}
  </table>`;
}

// --------------------------------------------------------------------------
// 1. All Type of Registration Emails
// --------------------------------------------------------------------------

/**
 * Welcome email sent to alumnus when registration is submitted (Pending Review).
 */
export function generateAlumniWelcomeEmailHtml(params: {
  name: string;
  email: string;
  studentId: string;
  degree?: string | null;
  gradYear?: number | null;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Full Name", value: params.name },
    { label: "Account Email", value: params.email },
    { label: "Student / Reg ID", value: params.studentId },
    { label: "Degree Program", value: params.degree || "IPAM Academic Program" },
    { label: "Graduation Cohort", value: params.gradYear },
    { label: "Status", value: "Pending Registrar Review & Verification" },
  ]);

  return renderUniversityEmailTemplate({
    title: "Welcome to IPAM Alumni Platform — Registration Received",
    badgeText: "REGISTRATION RECEIVED",
    badgeColor: "#10B981",
    recipientName: params.name,
    contentHtml: `<p>Thank you for registering on the official Institute of Public Administration and Management (IPAM USL) Alumni Network platform.</p>
    <p>Your credentials have been submitted for official verification against the university student records archive. Once signed off by the Registrar's office, your digital alumni pass and network privileges will be unlocked.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Visit Alumni Portal",
      url: "https://ipam.billnbite.cloud",
    },
  });
}

/**
 * Alert email sent to Admin when a new alumni registration is submitted.
 */
export function generateAdminRegistrationAlertHtml(params: {
  name: string;
  email: string;
  studentId: string;
  degree?: string | null;
  gradYear?: number | null;
  registeredAt?: Date | string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Applicant Name", value: params.name },
    { label: "Applicant Email", value: params.email },
    { label: "Student ID / Reg No", value: params.studentId },
    { label: "Degree", value: params.degree },
    { label: "Graduation Class", value: params.gradYear },
    {
      label: "Submission Time",
      value: new Date(params.registeredAt || Date.now()).toLocaleString("en-US"),
    },
  ]);

  return renderUniversityEmailTemplate({
    title: "New Alumni Registration Awaiting Review",
    badgeText: "REGISTRATION REVIEW",
    badgeColor: "#F59E0B",
    recipientName: "Registrar / Administrator",
    contentHtml: `<p>A new alumnus has registered on the IPAM platform and is awaiting administrative credential verification.</p>
    <p>Please review their academic credentials and registration details in the Directory administration panel.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Review in Admin Directory",
      url: "https://ipam.billnbite.cloud/admin/directory",
    },
  });
}

/**
 * Degree verification sign-off email to alumnus.
 */
export function generateDegreeVerificationEmailHtml(params: {
  name: string;
  approved: boolean;
  degree?: string | null;
  reason?: string | null;
}): string {
  return renderUniversityEmailTemplate({
    title: params.approved
      ? "Degree Verification Approved & Digital Pass Issued"
      : "Degree Verification Update Required",
    badgeText: params.approved ? "VERIFICATION APPROVED" : "UPDATE REQUIRED",
    badgeColor: params.approved ? "#10B981" : "#EF4444",
    recipientName: params.name,
    contentHtml: params.approved
      ? `<p>Congratulations! Your academic degree credentials have been officially verified by the IPAM Registrar's Office.</p>
         <p>Your digital alumni smart pass is now active and ready to be stored in your mobile digital wallet.</p>`
      : `<p>Your recent alumni degree submission requires attention before it can be verified.</p>
         <p><strong>Registrar Remarks:</strong> ${params.reason || "Please verify your matriculation details or contact the helpdesk."}</p>`,
    actionButton: {
      text: params.approved ? "Access Digital Pass" : "Update Profile Details",
      url: params.approved
        ? "https://ipam.billnbite.cloud/pass"
        : "https://ipam.billnbite.cloud/profile",
    },
  });
}

/**
 * Event RSVP / Registration confirmation email to attendee.
 */
export function generateEventRsvpConfirmationEmailHtml(params: {
  attendeeName: string;
  eventTitle: string;
  eventDate: Date | string;
  bookingReference: string;
  location?: string | null;
  ticketCount?: number;
  totalAmount?: number | string;
  currency?: string;
  paymentStatus?: string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Event", value: params.eventTitle },
    {
      label: "Date & Time",
      value: new Date(params.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    { label: "Venue", value: params.location || "IPAM Campus, Tower Hill" },
    { label: "Booking Reference", value: params.bookingReference },
    { label: "Tickets Reserved", value: params.ticketCount || 1 },
    {
      label: "Payment Status",
      value: `${params.paymentStatus || "FREE"} (${params.totalAmount ? `$${params.totalAmount}` : "Complimentary"})`,
    },
  ]);

  return renderUniversityEmailTemplate({
    title: `RSVP Confirmed: ${params.eventTitle}`,
    badgeText: "EVENT CONFIRMATION",
    badgeColor: "#10B981",
    recipientName: params.attendeeName,
    contentHtml: `<p>We are delighted to confirm your registration for <strong>${params.eventTitle}</strong>.</p>
    <p>Please present your booking reference or digital alumni pass at the entrance check-in desk.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "View My Registrations",
      url: "https://ipam.billnbite.cloud/events/my-registrations",
    },
  });
}

/**
 * Smart physical ID card order confirmation email.
 */
export function generatePhysicalCardOrderEmailHtml(params: {
  recipientName: string;
  orderNumber: string;
  cardTier: string;
  amount: number | string;
  currency: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Order Number", value: params.orderNumber },
    { label: "Card Tier", value: params.cardTier },
    { label: "Recipient", value: params.recipientName },
    { label: "Delivery Address", value: params.deliveryAddress },
    { label: "Total Paid", value: `${params.currency} ${params.amount}` },
    { label: "Payment Status", value: `${params.paymentStatus} via ${params.paymentMethod}` },
    { label: "Production Status", value: "Queued for Security Print Press" },
  ]);

  return renderUniversityEmailTemplate({
    title: `Smart ID Card Order Confirmed: #${params.orderNumber}`,
    badgeText: "SMART CARD ORDER",
    badgeColor: "#10B981",
    recipientName: params.recipientName,
    contentHtml: `<p>Thank you for ordering your official IPAM RFID Smart Alumni Card.</p>
    <p>Your order has entered our high-security card bureau for embossing, cryptographic chip encoding, and quality inspection.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Track Card Order",
      url: "https://ipam.billnbite.cloud/profile?tab=card-orders",
    },
  });
}

// --------------------------------------------------------------------------
// 2. Job Application & Status Emails (Employer + Employee)
// --------------------------------------------------------------------------

/**
 * Confirmation email to applicant (Employee).
 */
export function generateJobApplicationEmployeeEmailHtml(params: {
  candidateName: string;
  jobTitle: string;
  company: string;
  applicationRef: string;
  appliedDate?: Date | string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Job Title", value: params.jobTitle },
    { label: "Company", value: params.company },
    { label: "Application Ref", value: params.applicationRef },
    {
      label: "Submission Date",
      value: new Date(params.appliedDate || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    },
    { label: "Pipeline Status", value: "APPLIED (In Initial Review)" },
  ]);

  return renderUniversityEmailTemplate({
    title: `Application Submitted: ${params.jobTitle}`,
    badgeText: "APPLICATION CONFIRMED",
    badgeColor: "#10B981",
    recipientName: params.candidateName,
    contentHtml: `<p>Your application for <strong>${params.jobTitle}</strong> at <strong>${params.company}</strong> has been successfully received.</p>
    <p>The hiring team and recruiter have been notified. You will receive real-time updates as your profile progresses through the hiring pipeline.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "View My Applications",
      url: "https://ipam.billnbite.cloud/jobs/my-applications",
    },
  });
}

/**
 * Notification email to Employer / Recruiter for a new candidate.
 */
export function generateJobApplicationEmployerEmailHtml(params: {
  employerName?: string | null;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  degree?: string | null;
  gradYear?: number | null;
  experienceYears?: number | null;
  matchScore?: number | null;
  jobTitle: string;
  company: string;
  coverNote?: string | null;
  cvUrl?: string | null;
  applicationRef: string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Job Position", value: params.jobTitle },
    { label: "Applicant Name", value: params.candidateName },
    { label: "Applicant Email", value: params.candidateEmail },
    { label: "Applicant Phone", value: params.candidatePhone || "Provided on request" },
    { label: "Academic Degree", value: params.degree || "IPAM Graduate" },
    { label: "Graduation Cohort", value: params.gradYear },
    { label: "Experience", value: `${params.experienceYears ?? 1} year(s)` },
    { label: "Algorithmic Match Score", value: `${params.matchScore ?? 85}%` },
    { label: "Application Ref", value: params.applicationRef },
  ]);

  return renderUniversityEmailTemplate({
    title: `New Candidate Application for ${params.jobTitle}`,
    badgeText: "NEW APPLICANT",
    badgeColor: "#6366F1",
    recipientName: params.employerName || "Hiring Manager",
    contentHtml: `<p>A verified IPAM alumnus has applied for your job opening: <strong>${params.jobTitle}</strong> at <strong>${params.company}</strong>.</p>
    ${
      params.coverNote
        ? `<div style="background-color: #1E293B; border-left: 3px solid #6366F1; padding: 12px 16px; margin: 16px 0; font-style: italic; color: #E2E8F0;">
            "${params.coverNote}"
           </div>`
        : ""
    }
    <p>Please review their profile credentials and CV attachment to advance them in the recruitment pipeline.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Review Candidate Profile",
      url: "https://ipam.billnbite.cloud/jobs/manage",
    },
  });
}

/**
 * Status update email to applicant (Employee).
 */
export function generateJobStatusUpdateEmployeeEmailHtml(params: {
  candidateName: string;
  jobTitle: string;
  company: string;
  status: string;
  remarks?: string | null;
  interviewDate?: Date | string | null;
  offerSalary?: string | null;
}): string {
  let badgeColor = "#10B981";
  let statusHeadline = "Status Update";
  if (params.status === "SHORTLISTED") {
    badgeColor = "#3B82F6";
    statusHeadline = "You Have Been Shortlisted!";
  } else if (params.status === "INTERVIEW_SCHEDULED") {
    badgeColor = "#8B5CF6";
    statusHeadline = "Interview Scheduled";
  } else if (params.status === "SELECTED" || params.status === "OFFERED") {
    badgeColor = "#10B981";
    statusHeadline = "Congratulations! Job Offer / Selected";
  } else if (params.status === "REJECTED") {
    badgeColor = "#EF4444";
    statusHeadline = "Application Status Notification";
  }

  const metaHtml = renderDetailsTable([
    { label: "Job Title", value: params.jobTitle },
    { label: "Company", value: params.company },
    { label: "New Status", value: params.status },
    {
      label: "Interview Schedule",
      value: params.interviewDate
        ? new Date(params.interviewDate).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : undefined,
    },
    { label: "Offer Salary", value: params.offerSalary },
    { label: "Recruiter Remarks", value: params.remarks },
  ]);

  return renderUniversityEmailTemplate({
    title: `${statusHeadline}: ${params.jobTitle}`,
    badgeText: params.status.replace(/_/g, " "),
    badgeColor,
    recipientName: params.candidateName,
    contentHtml: `<p>There is an update on your job application for <strong>${params.jobTitle}</strong> at <strong>${params.company}</strong>.</p>
    <p>Current pipeline milestone: <strong style="color: ${badgeColor};">${params.status.replace(/_/g, " ")}</strong>.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "View Application Status",
      url: "https://ipam.billnbite.cloud/jobs/my-applications",
    },
  });
}

// --------------------------------------------------------------------------
// 3. Event Emails (to registered & subscribed users)
// --------------------------------------------------------------------------

/**
 * Event notification / update sent to registered & subscribed alumni.
 */
export function generateEventAttendeeUpdateEmailHtml(params: {
  recipientName: string;
  eventTitle: string;
  eventDate: Date | string;
  location?: string | null;
  subject: string;
  message: string;
  actionUrl?: string | null;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Event", value: params.eventTitle },
    {
      label: "Event Date",
      value: new Date(params.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    { label: "Location", value: params.location || "IPAM Campus, Tower Hill" },
  ]);

  return renderUniversityEmailTemplate({
    title: params.subject,
    badgeText: "EVENT UPDATE",
    badgeColor: "#6366F1",
    recipientName: params.recipientName,
    contentHtml: `<p>${params.message.replace(/\n/g, "<br/>")}</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Open Event Details",
      url: params.actionUrl || "https://ipam.billnbite.cloud/events",
    },
  });
}

// --------------------------------------------------------------------------
// 4. Business Listing & Approval Emails
// --------------------------------------------------------------------------

/**
 * Email sent to Admin when a new business listing is submitted.
 */
export function generateBusinessSubmissionAdminEmailHtml(params: {
  businessName: string;
  industry: string;
  founders?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  location?: string | null;
  description?: string | null;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Business Name", value: params.businessName },
    { label: "Industry / Category", value: params.industry },
    { label: "Founders", value: params.founders },
    { label: "Contact Email", value: params.contactEmail },
    { label: "Contact Phone", value: params.contactPhone },
    { label: "Website", value: params.website },
    { label: "Location", value: params.location },
  ]);

  return renderUniversityEmailTemplate({
    title: `New Business Listing Pending Approval: ${params.businessName}`,
    badgeText: "BUSINESS LISTING REVIEW",
    badgeColor: "#F59E0B",
    recipientName: "Directory Administrator",
    contentHtml: `<p>A new alumni business listing has been submitted for publication in the IPAM Alumni Commercial Directory.</p>
    ${params.description ? `<p style="font-style: italic; color: #94A3B8;">"${params.description}"</p>` : ""}`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "Review in Directory Admin",
      url: "https://ipam.billnbite.cloud/admin/directory",
    },
  });
}

/**
 * Confirmation email sent to business owner upon submission.
 */
export function generateBusinessSubmissionOwnerEmailHtml(params: {
  ownerName: string;
  businessName: string;
  industry: string;
}): string {
  return renderUniversityEmailTemplate({
    title: `Business Listing Submitted: ${params.businessName}`,
    badgeText: "SUBMISSION UNDER REVIEW",
    badgeColor: "#10B981",
    recipientName: params.ownerName,
    contentHtml: `<p>Thank you for listing your enterprise, <strong>${params.businessName}</strong> (${params.industry}), in the IPAM Alumni Business Directory.</p>
    <p>Our administrative team reviews all submissions to verify alumni affiliation. You will receive an email confirmation as soon as your listing is approved and visible to the global alumni network.</p>`,
    actionButton: {
      text: "View My Listings",
      url: "https://ipam.billnbite.cloud/businesses?mine=true",
    },
  });
}

/**
 * Approval notification email sent to business owner when Admin approves listing.
 */
export function generateBusinessApprovalEmailHtml(params: {
  ownerName: string;
  businessName: string;
  industry: string;
}): string {
  return renderUniversityEmailTemplate({
    title: `Congratulations! "${params.businessName}" is Approved`,
    badgeText: "LISTING APPROVED",
    badgeColor: "#10B981",
    recipientName: params.ownerName,
    contentHtml: `<p>Great news! Your business listing for <strong>${params.businessName}</strong> has been approved by the platform administration.</p>
    <p>It is now officially published in the IPAM Alumni Commercial Directory and accessible to thousands of verified alumni and institutional partners.</p>`,
    actionButton: {
      text: "View Live in Directory",
      url: "https://ipam.billnbite.cloud/businesses",
    },
  });
}

// --------------------------------------------------------------------------
// 5. Giving / Donations Emails (All Donor Details to Admin)
// --------------------------------------------------------------------------

/**
 * Notification email sent to Admin containing ALL details of the donor.
 */
export function generateDonationAdminEmailHtml(params: {
  donorName: string;
  donorEmail: string;
  donorPhone?: string | null;
  donorGradYear?: number | null;
  donorDegree?: string | null;
  amount: number | string;
  currency: string;
  fund: string;
  frequency?: string | null;
  anonymous?: boolean;
  paymentRef: string;
  message?: string | null;
  donatedAt?: Date | string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Donor Full Name", value: params.donorName },
    { label: "Donor Email", value: params.donorEmail },
    { label: "Donor Phone", value: params.donorPhone || "Not provided" },
    { label: "Graduation Cohort", value: params.donorGradYear ? `Class of ${params.donorGradYear}` : "Non-Alumnus / Friend of IPAM" },
    { label: "Degree Program", value: params.donorDegree || "General Supporter" },
    { label: "Donation Amount", value: `${params.currency} ${Number(params.amount).toFixed(2)}` },
    { label: "Designated Fund", value: params.fund },
    { label: "Giving Frequency", value: params.frequency || "ONE_TIME" },
    { label: "Public Anonymity", value: params.anonymous ? "Anonymous to Public" : "Publicly Acknowledged" },
    { label: "Transaction / Payment Ref", value: params.paymentRef },
    {
      label: "Donation Timestamp",
      value: new Date(params.donatedAt || Date.now()).toLocaleString("en-US"),
    },
  ]);

  return renderUniversityEmailTemplate({
    title: `New Giving Gift: ${params.currency} ${Number(params.amount).toFixed(2)} from ${params.donorName}`,
    badgeText: "DONATION RECEIVED",
    badgeColor: "#10B981",
    recipientName: "Advancement & Giving Office",
    contentHtml: `<p>A new philanthropic gift has been recorded on the IPAM Giving portal.</p>
    ${
      params.message
        ? `<div style="background-color: #1E293B; border-left: 3px solid #10B981; padding: 12px 16px; margin: 16px 0; color: #E2E8F0;">
            <strong>Donor Dedication / Message:</strong><br/>"${params.message}"
           </div>`
        : ""
    }
    <p>Complete donor record details are summarized below for institutional audit and advancement tracking:</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "View in Admin Giving",
      url: "https://ipam.billnbite.cloud/admin/donations",
    },
  });
}

/**
 * Official tax-deductible donation receipt sent to Donor.
 */
export function generateDonationReceiptEmailHtml(params: {
  donorName: string;
  amount: number | string;
  currency: string;
  fund: string;
  paymentRef: string;
  donatedAt?: Date | string;
}): string {
  const metaHtml = renderDetailsTable([
    { label: "Donor Name", value: params.donorName },
    { label: "Contribution Amount", value: `${params.currency} ${Number(params.amount).toFixed(2)}` },
    { label: "Beneficiary Fund", value: params.fund },
    { label: "Official Receipt Ref", value: params.paymentRef },
    {
      label: "Receipt Date",
      value: new Date(params.donatedAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    },
    { label: "Tax Exemption Status", value: "Official University Philanthropic Receipt" },
  ]);

  return renderUniversityEmailTemplate({
    title: `Thank You for Your Gift to IPAM: ${params.currency} ${Number(params.amount).toFixed(2)}`,
    badgeText: "OFFICIAL RECEIPT",
    badgeColor: "#10B981",
    recipientName: params.donorName,
    contentHtml: `<p>On behalf of the University of Sierra Leone and the Institute of Public Administration and Management, we express our heartfelt gratitude for your generous philanthropic contribution.</p>
    <p>Your support directly empowers student scholarships, world-class faculty research, and campus infrastructure development.</p>`,
    metaBoxHtml: metaHtml,
    actionButton: {
      text: "View Giving History",
      url: "https://ipam.billnbite.cloud/donations?mine=true",
    },
  });
}

// --------------------------------------------------------------------------
// High-Level Email Dispatch Helpers
// --------------------------------------------------------------------------

/**
 * Dispatches welcome email to alumnus and registration alert to admin.
 */
export async function sendAlumniRegistrationEmails(params: {
  name: string;
  email: string;
  studentId: string;
  degree?: string | null;
  gradYear?: number | null;
}) {
  const welcomeHtml = generateAlumniWelcomeEmailHtml(params);
  const adminHtml = generateAdminRegistrationAlertHtml(params);

  await Promise.all([
    sendEmail({
      to: params.email,
      subject: "[IPAM Alumni] Welcome — Registration Received",
      html: welcomeHtml,
    }).catch((err) => console.error("[Email] Failed to send alumnus welcome email:", err)),
    sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `[IPAM Admin] New Alumni Registration: ${params.name} (${params.studentId})`,
      html: adminHtml,
    }).catch((err) => console.error("[Email] Failed to send admin registration alert:", err)),
  ]);
}

/**
 * Dispatches job application emails to both Employee (applicant) and Employer.
 */
export async function sendJobApplicationEmails(params: {
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string | null;
  degree?: string | null;
  gradYear?: number | null;
  experienceYears?: number | null;
  matchScore?: number | null;
  jobTitle: string;
  company: string;
  coverNote?: string | null;
  cvUrl?: string | null;
  applicationRef: string;
  employerEmail?: string | null;
  employerName?: string | null;
}) {
  const employeeHtml = generateJobApplicationEmployeeEmailHtml({
    candidateName: params.candidateName,
    jobTitle: params.jobTitle,
    company: params.company,
    applicationRef: params.applicationRef,
  });

  const employerHtml = generateJobApplicationEmployerEmailHtml(params);
  const targetEmployerEmail = params.employerEmail || ADMIN_NOTIFICATION_EMAIL;

  await Promise.all([
    sendEmail({
      to: params.candidateEmail,
      subject: `[IPAM Careers] Application Submitted: ${params.jobTitle} at ${params.company}`,
      html: employeeHtml,
    }).catch((err) => console.error("[Email] Failed to send candidate application email:", err)),
    sendEmail({
      to: targetEmployerEmail,
      subject: `[IPAM Careers] New Application for ${params.jobTitle} from ${params.candidateName}`,
      html: employerHtml,
    }).catch((err) => console.error("[Email] Failed to send employer application alert:", err)),
  ]);
}

/**
 * Dispatches job status update email to applicant (Employee).
 */
export async function sendJobStatusEmail(params: {
  candidateEmail: string;
  candidateName: string;
  jobTitle: string;
  company: string;
  status: string;
  remarks?: string | null;
  interviewDate?: Date | string | null;
  offerSalary?: string | null;
}) {
  const html = generateJobStatusUpdateEmployeeEmailHtml(params);
  return sendEmail({
    to: params.candidateEmail,
    subject: `[IPAM Careers] Application Status: ${params.jobTitle} — ${params.status}`,
    html,
  });
}

/**
 * Dispatches business listing emails (alert to Admin, confirmation to Owner).
 */
export async function sendBusinessSubmissionEmails(params: {
  ownerName: string;
  ownerEmail: string;
  businessName: string;
  industry: string;
  founders?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  location?: string | null;
  description?: string | null;
}) {
  const adminHtml = generateBusinessSubmissionAdminEmailHtml({
    ...params,
    contactEmail: params.ownerEmail,
  });
  const ownerHtml = generateBusinessSubmissionOwnerEmailHtml(params);

  await Promise.all([
    sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `[IPAM Directory] New Business Listing Submitted: ${params.businessName}`,
      html: adminHtml,
    }).catch((err) => console.error("[Email] Failed to send admin business listing alert:", err)),
    sendEmail({
      to: params.ownerEmail,
      subject: `[IPAM Directory] Business Listing Received: ${params.businessName}`,
      html: ownerHtml,
    }).catch((err) => console.error("[Email] Failed to send owner business listing confirmation:", err)),
  ]);
}

/**
 * Dispatches approval email to business owner when approved by Admin.
 */
export async function sendBusinessApprovalEmail(params: {
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  industry: string;
}) {
  const html = generateBusinessApprovalEmailHtml(params);
  return sendEmail({
    to: params.ownerEmail,
    subject: `[IPAM Directory] Congratulations! "${params.businessName}" is Approved`,
    html,
  });
}

/**
 * Dispatches donation emails:
 * 1. Admin gets ALL details of the donor.
 * 2. Donor gets official gift receipt.
 */
export async function sendDonationEmails(params: {
  donorName: string;
  donorEmail: string;
  donorPhone?: string | null;
  donorGradYear?: number | null;
  donorDegree?: string | null;
  amount: number | string;
  currency: string;
  fund: string;
  frequency?: string | null;
  anonymous?: boolean;
  paymentRef: string;
  message?: string | null;
  donatedAt?: Date | string;
}) {
  const adminHtml = generateDonationAdminEmailHtml(params);
  const receiptHtml = generateDonationReceiptEmailHtml(params);

  await Promise.all([
    sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `[IPAM Giving] New Donation Received: ${params.currency} ${Number(params.amount).toFixed(2)} from ${params.donorName}`,
      html: adminHtml,
    }).catch((err) => console.error("[Email] Failed to send donation admin alert:", err)),
    sendEmail({
      to: params.donorEmail,
      subject: `[IPAM Giving] Official Gift Receipt & Thank You (Ref: ${params.paymentRef})`,
      html: receiptHtml,
    }).catch((err) => console.error("[Email] Failed to send donor receipt:", err)),
  ]);
}

