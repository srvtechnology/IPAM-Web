export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  messagingServiceSid: string;
}

export interface SendSmsOptions {
  to: string;
  body: string;
}

export interface SendSmsResult {
  success: boolean;
  sid?: string;
  status?: string;
  error?: string;
  to?: string;
}

export interface SmsRecipient {
  phone: string;
  name?: string;
  userId?: string;
}

export interface SendBroadcastSmsOptions {
  recipients: Array<string | SmsRecipient>;
  title: string;
  message: string;
  actionUrl?: string | null;
}

export interface BroadcastSmsSummary {
  sentCount: number;
  failedCount: number;
  sids: string[];
  errors: Array<{ phone: string; error: string }>;
}

/**
 * Returns normalized Twilio configuration from environment variables.
 * Supports both standard and alias variable names.
 */
export function getTwilioConfig(): TwilioConfig {
  const accountSid =
    process.env.TWILIO_ACCOUNT_SID ||
    process.env.ACC_SID_TWILIO ||
    "";

  const authToken =
    process.env.TWILIO_AUTH_TOKEN ||
    process.env.AUTH_TOKEN_TWILIO ||
    "";

  const messagingServiceSid =
    process.env.TWILIO_MESSAGING_SERVICE_SID ||
    process.env.MSG_SERVICESID ||
    "";

  return { accountSid, authToken, messagingServiceSid };
}

/**
 * Checks if Twilio is configured with valid Account SID and Auth Token.
 */
export function isTwilioConfigured(): boolean {
  const config = getTwilioConfig();
  return Boolean(config.accountSid && config.authToken && config.messagingServiceSid);
}

/**
 * Verifies Twilio credentials by contacting the official Twilio Accounts API.
 */
export async function verifyTwilioCredentials(): Promise<{
  success: boolean;
  accountStatus?: string;
  friendlyName?: string;
  error?: string;
}> {
  const config = getTwilioConfig();
  if (!isTwilioConfigured()) {
    return { success: false, error: "Twilio credentials are not configured" };
  }

  const authHeader = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}.json`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Basic ${authHeader}`,
      },
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.status) {
      return {
        success: true,
        accountStatus: json.status,
        friendlyName: json.friendly_name,
      };
    }

    return {
      success: false,
      error: json.message || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Normalizes a phone number into E.164 format or clean international digits.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.trim().replace(/[^\d+]/g, "");
  if (!cleaned) return "";

  // If number does not start with +, assume international Sierra Leone (+232) or format with +
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("00")) {
      return `+${cleaned.substring(2)}`;
    }
    if (cleaned.length === 8 || cleaned.length === 9) {
      // Sierra Leone national format
      return `+232${cleaned.replace(/^0+/, "")}`;
    }
    return `+${cleaned}`;
  }
  return cleaned;
}

/**
 * Sends a single SMS message via Twilio Messaging Service.
 */
export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  const config = getTwilioConfig();
  if (!isTwilioConfigured()) {
    return { success: false, error: "Twilio credentials are not configured" };
  }

  const to = normalizePhoneNumber(options.to);
  if (!to || to.length < 8) {
    return { success: false, error: `Invalid recipient phone number: ${options.to}` };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const authHeader = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

  const formData = new URLSearchParams();
  formData.append("To", to);
  formData.append("MessagingServiceSid", config.messagingServiceSid);
  formData.append("Body", options.body);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.sid) {
      return {
        success: true,
        sid: json.sid,
        status: json.status,
        to,
      };
    }

    return {
      success: false,
      error: json.message || `Twilio error HTTP ${res.status}`,
      to,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      to,
    };
  }
}

/**
 * Formats concise, compliant SMS text fitting mobile screen limits.
 */
export function formatSmsText(options: {
  title: string;
  message: string;
  actionUrl?: string | null;
}): string {
  const { title, message, actionUrl } = options;
  let text = `[IPAM Alumni] ${title.trim()}\n${message.trim()}`;
  if (actionUrl) {
    const url = actionUrl.startsWith("http") ? actionUrl : `https://ipam.billnbite.cloud${actionUrl}`;
    text += `\nPortal: ${url}`;
  }
  return text;
}

/**
 * Dispatches broadcast SMS messages to a list of phone numbers with concurrency throttling.
 */
export async function sendBroadcastSms(
  options: SendBroadcastSmsOptions
): Promise<BroadcastSmsSummary> {
  const { recipients, title, message, actionUrl } = options;
  const config = getTwilioConfig();

  if (!isTwilioConfigured()) {
    return {
      sentCount: 0,
      failedCount: recipients.length,
      sids: [],
      errors: [{ phone: "all", error: "Twilio credentials not configured" }],
    };
  }

  // Deduplicate and normalize recipient numbers
  const seenNumbers = new Set<string>();
  const normalizedRecipients: SmsRecipient[] = [];

  for (const r of recipients) {
    const raw = typeof r === "string" ? r : r.phone;
    const name = typeof r === "string" ? undefined : r.name;
    const userId = typeof r === "string" ? undefined : r.userId;
    const norm = normalizePhoneNumber(raw);
    if (norm && norm.length >= 8 && !seenNumbers.has(norm)) {
      seenNumbers.add(norm);
      normalizedRecipients.push({ phone: norm, name, userId });
    }
  }

  const summary: BroadcastSmsSummary = {
    sentCount: 0,
    failedCount: 0,
    sids: [],
    errors: [],
  };

  if (normalizedRecipients.length === 0) {
    return summary;
  }

  const smsBody = formatSmsText({ title, message, actionUrl });

  // Process in concurrent chunks of 5
  const CHUNK_SIZE = 5;
  for (let i = 0; i < normalizedRecipients.length; i += CHUNK_SIZE) {
    const chunk = normalizedRecipients.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (recip) => {
      const result = await sendSms({
        to: recip.phone,
        body: smsBody,
      });

      if (result.success && result.sid) {
        summary.sentCount++;
        summary.sids.push(result.sid);
      } else {
        summary.failedCount++;
        summary.errors.push({ phone: recip.phone, error: result.error || "Failed" });
      }
    });

    await Promise.all(chunkPromises);

    if (i + CHUNK_SIZE < normalizedRecipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return summary;
}

/**
 * Resolves alumni phone recipients for a given audience group or audience label.
 */
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

export async function resolveAudiencePhoneRecipients(options: {
  audienceGroupId?: string;
  audienceLabel?: string;
}): Promise<SmsRecipient[]> {
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

  const recipientsMap = new Map<string, SmsRecipient>();

  if (group && group.criteria) {
    const criteria = typeof group.criteria === "object" ? (group.criteria as any) : {};
    const userIds = Array.isArray(criteria.userIds) ? criteria.userIds : [];

    if (userIds.length > 0 && !criteria.selectAll) {
      const records = await db.alumniRecord.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, phone: true, alumniUserId: true },
      });
      for (const r of records) {
        if (r.phone) {
          const norm = normalizePhoneNumber(r.phone);
          if (norm) {
            recipientsMap.set(norm, { phone: norm, name: r.name, userId: r.alumniUserId || undefined });
          }
        }
      }
      if (recipientsMap.size > 0) {
        return Array.from(recipientsMap.values());
      }
    }
  }

  // Fetch all registered records with a phone number
  const records = await db.alumniRecord.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true, alumniUserId: true },
    take: 1000,
  }).catch(() => []);

  for (const r of records) {
    if (r.phone) {
      const norm = normalizePhoneNumber(r.phone);
      if (norm && !recipientsMap.has(norm)) {
        recipientsMap.set(norm, { phone: norm, name: r.name, userId: r.alumniUserId || undefined });
      }
    }
  }

  return Array.from(recipientsMap.values());
}
