import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id?: string;
  private_key: string;
  client_email: string;
  client_id?: string;
  auth_uri?: string;
  token_uri: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export interface FcmNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
}

export interface FcmSendOptions {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  priority?: "NORMAL" | "HIGH" | "URGENT" | "CRITICAL";
  clickAction?: string;
  actionUrl?: string;
}

export interface FcmSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidToken?: boolean;
}

export interface FcmMulticastResult {
  successCount: number;
  failureCount: number;
  results: Array<{
    token: string;
    success: boolean;
    messageId?: string;
    error?: string;
    invalidToken?: boolean;
  }>;
}

// In-memory token cache
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
let cachedCredentials: ServiceAccountCredentials | null = null;

/**
 * Loads the Firebase Service Account credentials from disk or environment.
 */
export function getFirebaseCredentials(): ServiceAccountCredentials | null {
  if (cachedCredentials) return cachedCredentials;

  // 1. Raw JSON in environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      if (raw.startsWith("{")) {
        cachedCredentials = JSON.parse(raw) as ServiceAccountCredentials;
        return cachedCredentials;
      }
      if (fs.existsSync(raw)) {
        cachedCredentials = JSON.parse(fs.readFileSync(raw, "utf8")) as ServiceAccountCredentials;
        return cachedCredentials;
      }
    } catch (err) {
      console.warn("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  // 2. Custom path from env
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const customPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    if (fs.existsSync(customPath)) {
      try {
        cachedCredentials = JSON.parse(fs.readFileSync(customPath, "utf8")) as ServiceAccountCredentials;
        return cachedCredentials;
      } catch (err) {
        console.warn("[Firebase] Failed to parse credentials at FIREBASE_SERVICE_ACCOUNT_PATH:", err);
      }
    }
  }

  // 3. Default root serviceAccountKey.json
  const defaultPath = path.resolve(process.cwd(), "serviceAccountKey.json");
  if (fs.existsSync(defaultPath)) {
    try {
      cachedCredentials = JSON.parse(fs.readFileSync(defaultPath, "utf8")) as ServiceAccountCredentials;
      return cachedCredentials;
    } catch (err) {
      console.warn("[Firebase] Failed to parse default serviceAccountKey.json:", err);
    }
  }

  return null;
}

/**
 * Checks whether Firebase credentials are configured and valid.
 */
export function isFirebaseConfigured(): boolean {
  const creds = getFirebaseCredentials();
  return Boolean(creds?.project_id && creds?.client_email && creds?.private_key);
}

/**
 * Generates an RS256 signed JWT assertion and requests a fresh Google OAuth2 access token
 * with the `https://www.googleapis.com/auth/firebase.messaging` scope.
 */
export async function getFirebaseAccessToken(): Promise<string | null> {
  const creds = getFirebaseCredentials();
  if (!creds) {
    console.warn("[Firebase] Cannot get access token: credentials not found");
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  // Reuse token if still valid for at least 5 minutes
  if (cachedAccessToken && tokenExpiresAt > now + 300) {
    return cachedAccessToken;
  }

  const tokenUri = creds.token_uri || "https://oauth2.googleapis.com/token";

  const payload = {
    iss: creds.client_email,
    sub: creds.client_email,
    aud: tokenUri,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    iat: now,
    exp: now + 3600, // 1 hour lifetime
  };

  const header = { alg: "RS256", typ: "JWT" };
  const toBase64Url = (obj: object) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const unsignedToken = `${toBase64Url(header)}.${toBase64Url(payload)}`;

  try {
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(unsignedToken);
    const signature = sign.sign(creds.private_key, "base64url");
    const assertion = `${unsignedToken}.${signature}`;

    const res = await fetch(tokenUri, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[Firebase] OAuth token exchange failed:", res.status, errText);
      return null;
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    cachedAccessToken = data.access_token;
    tokenExpiresAt = now + (data.expires_in || 3600);
    return cachedAccessToken;
  } catch (err) {
    console.error("[Firebase] Error creating signed JWT or requesting OAuth token:", err);
    return null;
  }
}

/**
 * Builds the official FCM HTTP v1 payload matching both Android & iOS standards.
 */
function buildFcmMessageBody(options: FcmSendOptions): Record<string, unknown> {
  const isHighPriority = options.priority === "URGENT" || options.priority === "CRITICAL" || options.priority === "HIGH";

  const notificationObj: Record<string, string> = {
    title: options.title,
    body: options.body,
  };
  if (options.imageUrl) {
    notificationObj.image = options.imageUrl;
  }

  // String data dictionary for Flutter and native clients
  const dataPayload: Record<string, string> = {
    click_action: options.clickAction || "FLUTTER_NOTIFICATION_CLICK",
    title: options.title,
    body: options.body,
    priority: options.priority || "NORMAL",
    timestamp: new Date().toISOString(),
    ...(options.actionUrl ? { actionUrl: options.actionUrl } : {}),
    ...(options.data || {}),
  };

  const message: Record<string, unknown> = {
    notification: notificationObj,
    data: dataPayload,
    android: {
      priority: isHighPriority ? "HIGH" : "NORMAL",
      notification: {
        channel_id: "ipam_alumni_notifications",
        sound: "default",
        icon: "ic_notification",
        color: "#10B981", // IPAM Emerald brand accent
        click_action: options.clickAction || "FLUTTER_NOTIFICATION_CLICK",
        ...(options.imageUrl ? { image: options.imageUrl } : {}),
      },
    },
    apns: {
      headers: {
        "apns-priority": isHighPriority ? "10" : "5",
      },
      payload: {
        aps: {
          alert: {
            title: options.title,
            body: options.body,
          },
          sound: "default",
          badge: 1,
        },
      },
    },
    webpush: {
      headers: {
        Urgency: isHighPriority ? "high" : "normal",
      },
      notification: {
        title: options.title,
        body: options.body,
        icon: "/images/crest.png",
        badge: "/images/crest.png",
        ...(options.imageUrl ? { image: options.imageUrl } : {}),
        data: dataPayload,
      },
      fcm_options: {
        link: options.actionUrl || "/",
      },
    },
  };

  if (options.token) {
    message.token = options.token;
  } else if (options.topic) {
    // Sanitize topic name: only alphanumeric and [-_.~%]
    const sanitizedTopic = options.topic.replace(/[^a-zA-Z0-9-_.~%]/g, "_");
    message.topic = sanitizedTopic;
  }

  return { message };
}

/**
 * Sends a push notification to a single device token.
 */
export async function sendPushToDevice(options: Omit<FcmSendOptions, "topic"> & { token: string }): Promise<FcmSendResult> {
  const creds = getFirebaseCredentials();
  if (!creds) {
    return { success: false, error: "Firebase credentials not configured" };
  }

  const accessToken = await getFirebaseAccessToken();
  if (!accessToken) {
    return { success: false, error: "Failed to obtain Firebase OAuth2 access token" };
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${creds.project_id}/messages:send`;
  const body = buildFcmMessageBody(options);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const resJson = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        messageId: resJson.name || undefined,
      };
    }

    const errorCode = resJson?.error?.details?.[0]?.errorCode || resJson?.error?.status || "";
    const isInvalid =
      errorCode === "UNREGISTERED" ||
      errorCode === "INVALID_ARGUMENT" ||
      res.status === 404 ||
      JSON.stringify(resJson).includes("NOT_FOUND") ||
      JSON.stringify(resJson).includes("UNREGISTERED");

    return {
      success: false,
      error: resJson?.error?.message || `HTTP ${res.status}`,
      invalidToken: isInvalid,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends a push notification to an FCM topic (e.g. "all_alumni", "events", etc.).
 */
export async function sendPushToTopic(options: Omit<FcmSendOptions, "token"> & { topic: string }): Promise<FcmSendResult> {
  const creds = getFirebaseCredentials();
  if (!creds) {
    return { success: false, error: "Firebase credentials not configured" };
  }

  const accessToken = await getFirebaseAccessToken();
  if (!accessToken) {
    return { success: false, error: "Failed to obtain Firebase OAuth2 access token" };
  }

  const endpoint = `https://fcm.googleapis.com/v1/projects/${creds.project_id}/messages:send`;
  const body = buildFcmMessageBody(options);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const resJson = await res.json().catch(() => ({}));

    if (res.ok) {
      return {
        success: true,
        messageId: resJson.name || undefined,
      };
    }

    return {
      success: false,
      error: resJson?.error?.message || `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Sends push notifications to multiple device tokens (multicast batch).
 */
export async function sendMulticastPush(
  tokens: string[],
  options: Omit<FcmSendOptions, "token" | "topic">
): Promise<FcmMulticastResult> {
  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0, results: [] };
  }

  // Deduplicate tokens
  const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
  const results: FcmMulticastResult["results"] = [];
  let successCount = 0;
  let failureCount = 0;

  // Process in concurrent chunks of 25 to respect FCM rate limits and concurrency
  const CHUNK_SIZE = 25;
  for (let i = 0; i < uniqueTokens.length; i += CHUNK_SIZE) {
    const chunk = uniqueTokens.slice(i, i + CHUNK_SIZE);
    const chunkPromises = chunk.map(async (tok) => {
      const outcome = await sendPushToDevice({ ...options, token: tok });
      return {
        token: tok,
        success: outcome.success,
        messageId: outcome.messageId,
        error: outcome.error,
        invalidToken: outcome.invalidToken,
      };
    });

    const chunkResults = await Promise.all(chunkPromises);
    for (const r of chunkResults) {
      results.push(r);
      if (r.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }
  }

  return { successCount, failureCount, results };
}

/**
 * Subscribes an array of device registration tokens to a given topic.
 */
export async function subscribeTokensToTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string; results?: unknown }> {
  if (!tokens || tokens.length === 0) return { success: true };

  const creds = getFirebaseCredentials();
  if (!creds) return { success: false, error: "Firebase credentials not configured" };

  const accessToken = await getFirebaseAccessToken();
  if (!accessToken) return { success: false, error: "Failed to obtain Firebase access token" };

  const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, "_");
  const endpoint = "https://iid.googleapis.com/iid/v1:batchAdd";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        access_token_auth: "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: `/topics/${sanitizedTopic}`,
        registration_tokens: tokens,
      }),
    });

    const resJson = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, results: resJson };
    }
    return { success: false, error: resJson?.error || `HTTP ${res.status}`, results: resJson };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Unsubscribes an array of device registration tokens from a given topic.
 */
export async function unsubscribeTokensFromTopic(
  tokens: string[],
  topic: string
): Promise<{ success: boolean; error?: string; results?: unknown }> {
  if (!tokens || tokens.length === 0) return { success: true };

  const creds = getFirebaseCredentials();
  if (!creds) return { success: false, error: "Firebase credentials not configured" };

  const accessToken = await getFirebaseAccessToken();
  if (!accessToken) return { success: false, error: "Failed to obtain Firebase access token" };

  const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]/g, "_");
  const endpoint = "https://iid.googleapis.com/iid/v1:batchRemove";

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        access_token_auth: "true",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: `/topics/${sanitizedTopic}`,
        registration_tokens: tokens,
      }),
    });

    const resJson = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, results: resJson };
    }
    return { success: false, error: resJson?.error || `HTTP ${res.status}`, results: resJson };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

