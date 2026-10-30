import { db } from "@/lib/db";
import {
  sendPushToDevice,
  sendMulticastPush,
  sendPushToTopic,
  isFirebaseConfigured,
  subscribeTokensToTopic,
  unsubscribeTokensFromTopic,
  type FcmSendResult,
  type FcmMulticastResult,
} from "@/lib/firebase";

export interface SendAlumniNotificationOptions {
  userId: string;
  title: string;
  message: string;
  type?: "NOTIFICATION" | "VERIFICATION" | "ID_CARD" | "JOB" | "EVENT" | "ALERT";
  priority?: "NORMAL" | "URGENT" | "CRITICAL";
  actionUrl?: string;
  data?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface BroadcastPushOptions {
  broadcastId?: string;
  title: string;
  message: string;
  type?: "MESSAGE" | "INVITATION" | "NOTIFICATION";
  priority?: "NORMAL" | "URGENT" | "CRITICAL";
  audienceLabel: string;
  channels: string[];
  actionUrl?: string | null;
  targetUserIds?: string[];
  eventDate?: Date | string | null;
  eventVenue?: string | null;
  rsvpDeadline?: Date | string | null;
}

/**
 * Creates an in-app notification for an alumni user and delivers an FCM push notification
 * to all active devices registered to that user.
 */
export async function notifyAlumniUser(options: SendAlumniNotificationOptions) {
  const {
    userId,
    title,
    message,
    type = "NOTIFICATION",
    priority = "NORMAL",
    actionUrl,
    data = {},
    metadata,
  } = options;

  let inAppNotification: any = null;
  let pushResult: FcmSendResult | FcmMulticastResult | null = null;

  try {
    // 1. Create in-app notification record in database
    inAppNotification = await db.alumniNotification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority,
        actionUrl: actionUrl || null,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  } catch (err) {
    console.error("[Notifications] Failed to create in-app notification in DB:", err);
  }

  // 2. Fetch all active device tokens registered for this alumni user
  try {
    const deviceRecords = await db.alumniDeviceToken.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        token: true,
      },
    });

    if (deviceRecords.length > 0 && isFirebaseConfigured()) {
      const tokens = deviceRecords.map((d) => d.token);

      const fcmDataPayload: Record<string, string> = {
        notificationId: inAppNotification?.id || "",
        type,
        priority,
        userId,
        ...(actionUrl ? { actionUrl } : {}),
        ...data,
      };

      if (tokens.length === 1) {
        const singleResult = await sendPushToDevice({
          token: tokens[0],
          title,
          body: message,
          priority: priority === "CRITICAL" ? "CRITICAL" : priority === "URGENT" ? "HIGH" : "NORMAL",
          actionUrl: actionUrl || undefined,
          data: fcmDataPayload,
        });

        pushResult = singleResult;

        if (singleResult.success && singleResult.messageId && inAppNotification?.id) {
          await db.alumniNotification.update({
            where: { id: inAppNotification.id },
            data: { fcmMessageId: singleResult.messageId },
          }).catch(() => null);
        }

        // Deactivate invalid / unregistered tokens automatically
        if (singleResult.invalidToken) {
          await db.alumniDeviceToken.update({
            where: { token: tokens[0] },
            data: { isActive: false },
          }).catch(() => null);
        }
      } else {
        const multiResult = await sendMulticastPush(tokens, {
          title,
          body: message,
          priority: priority === "CRITICAL" ? "CRITICAL" : priority === "URGENT" ? "HIGH" : "NORMAL",
          actionUrl: actionUrl || undefined,
          data: fcmDataPayload,
        });

        pushResult = multiResult;

        // Clean up any unregistered tokens reported by FCM
        const invalidTokens = multiResult.results
          .filter((r) => r.invalidToken)
          .map((r) => r.token);

        if (invalidTokens.length > 0) {
          await db.alumniDeviceToken.updateMany({
            where: { token: { in: invalidTokens } },
            data: { isActive: false },
          }).catch(() => null);
        }

        const firstSuccess = multiResult.results.find((r) => r.success && r.messageId);
        if (firstSuccess && inAppNotification?.id) {
          await db.alumniNotification.update({
            where: { id: inAppNotification.id },
            data: { fcmMessageId: firstSuccess.messageId },
          }).catch(() => null);
        }
      }
    }
  } catch (err) {
    console.error("[Notifications] Error delivering FCM push to alumni user:", err);
  }

  return {
    notification: inAppNotification,
    pushResult,
  };
}

/**
 * Handles dispatching a broadcast to FCM push subscribers when channels include "PUSH"
 * or when the broadcast has CRITICAL priority.
 */
export async function notifyBroadcast(options: BroadcastPushOptions) {
  const {
    title,
    message,
    type = "NOTIFICATION",
    priority = "NORMAL",
    channels = [],
    actionUrl,
    targetUserIds,
  } = options;

  const shouldSendPush = channels.includes("PUSH") || priority === "CRITICAL";
  if (!shouldSendPush) {
    return { pushed: false, reason: "PUSH channel not selected" };
  }

  if (!isFirebaseConfigured()) {
    console.warn("[Notifications] FCM not configured; skipping push broadcast.");
    return { pushed: false, reason: "Firebase credentials not configured" };
  }

  const fcmDataPayload: Record<string, string> = {
    type: "BROADCAST",
    broadcastType: type,
    priority,
    ...(options.broadcastId ? { broadcastId: options.broadcastId } : {}),
    ...(actionUrl ? { actionUrl } : {}),
    ...(options.eventDate ? { eventDate: new Date(options.eventDate).toISOString() } : {}),
    ...(options.eventVenue ? { eventVenue: options.eventVenue } : {}),
    ...(options.rsvpDeadline ? { rsvpDeadline: new Date(options.rsvpDeadline).toISOString() } : {}),
  };

  try {
    let tokens: string[] = [];

    if (targetUserIds && targetUserIds.length > 0) {
      const deviceRecords = await db.alumniDeviceToken.findMany({
        where: {
          userId: { in: targetUserIds },
          isActive: true,
        },
        select: { token: true },
      });
      tokens = deviceRecords.map((d) => d.token);
    } else {
      const deviceRecords = await db.alumniDeviceToken.findMany({
        where: { isActive: true },
        select: { token: true },
        take: 2000,
      });
      tokens = deviceRecords.map((d) => d.token);
    }

    // 1. Send to tokens if available
    let multicastResult: FcmMulticastResult | null = null;
    if (tokens.length > 0) {
      multicastResult = await sendMulticastPush(tokens, {
        title,
        body: message,
        priority: priority === "CRITICAL" ? "CRITICAL" : priority === "URGENT" ? "HIGH" : "NORMAL",
        actionUrl: actionUrl || undefined,
        data: fcmDataPayload,
      });

      // Cleanup stale tokens
      const invalidTokens = multicastResult.results.filter((r) => r.invalidToken).map((r) => r.token);
      if (invalidTokens.length > 0) {
        await db.alumniDeviceToken.updateMany({
          where: { token: { in: invalidTokens } },
          data: { isActive: false },
        }).catch(() => null);
      }
    }

    // 2. Also dispatch to FCM topic "all_alumni" so devices in background receive it
    const topicResult = await sendPushToTopic({
      topic: "all_alumni",
      title,
      body: message,
      priority: priority === "CRITICAL" ? "CRITICAL" : priority === "URGENT" ? "HIGH" : "NORMAL",
      actionUrl: actionUrl || undefined,
      data: fcmDataPayload,
    });

    return {
      pushed: true,
      recipientTokensCount: tokens.length,
      multicastResult,
      topicResult,
    };
  } catch (err) {
    console.error("[Notifications] Broadcast push delivery error:", err);
    return {
      pushed: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------------------------
// Device Push Token Lifecycle (Login integration & Token Sync)
// --------------------------------------------------------------------------

export interface RegisterDeviceTokenOptions {
  userId: string;
  token: string;
  platform?: "android" | "ios" | "web" | string;
  deviceName?: string | null;
  appVersion?: string | null;
  subscribeToAll?: boolean;
}

export interface RegisterDeviceTokenResult {
  success: boolean;
  registered?: boolean;
  device?: {
    id: string;
    platform: string;
    deviceName: string | null;
    appVersion: string | null;
    isActive: boolean;
    lastUsedAt: Date;
  };
  topicSubscribed?: boolean;
  fcmConfigured?: boolean;
  error?: string;
}

/**
 * Registers or updates an FCM device token for a user, activating it and subscribing to topics.
 * Used during login handshake and background token refresh.
 */
export async function registerUserDeviceToken(
  options: RegisterDeviceTokenOptions
): Promise<RegisterDeviceTokenResult> {
  const {
    userId,
    token,
    platform = "android",
    deviceName,
    appVersion,
    subscribeToAll = true,
  } = options;

  if (!token || typeof token !== "string" || token.trim().length < 10) {
    return { success: false, error: "Invalid device token" };
  }

  const cleanToken = token.trim();
  const validPlatform =
    platform === "ios" || platform === "web" || platform === "android" ? platform : "android";

  try {
    const deviceRecord = await db.alumniDeviceToken.upsert({
      where: { token: cleanToken },
      update: {
        userId,
        platform: validPlatform,
        deviceName: deviceName || null,
        appVersion: appVersion || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        token: cleanToken,
        platform: validPlatform,
        deviceName: deviceName || null,
        appVersion: appVersion || null,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    let topicSubscribed = false;
    if (subscribeToAll && isFirebaseConfigured()) {
      try {
        const subResult = await subscribeTokensToTopic([cleanToken], "all_alumni");
        topicSubscribed = subResult.success;
      } catch (err) {
        console.warn("[FCM] Topic subscription error during token registration:", err);
      }
    }

    return {
      success: true,
      registered: true,
      device: {
        id: deviceRecord.id,
        platform: deviceRecord.platform,
        deviceName: deviceRecord.deviceName,
        appVersion: deviceRecord.appVersion,
        isActive: deviceRecord.isActive,
        lastUsedAt: deviceRecord.lastUsedAt,
      },
      topicSubscribed,
      fcmConfigured: isFirebaseConfigured(),
    };
  } catch (err) {
    console.error("[Notifications] Failed to register user device token:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Deactivates an FCM device token for a user, unsubscribing from topics.
 * Used during logout and push permission revoke.
 */
export async function unregisterUserDeviceToken(options: {
  userId?: string;
  token: string;
}): Promise<{ success: boolean; unregistered?: boolean; error?: string }> {
  const { userId, token } = options;
  if (!token || typeof token !== "string" || token.trim().length < 10) {
    return { success: false, error: "Invalid device token" };
  }

  const cleanToken = token.trim();

  try {
    const whereClause: any = { token: cleanToken };
    if (userId) {
      whereClause.userId = userId;
    }

    const existing = await db.alumniDeviceToken.findFirst({ where: whereClause });
    if (existing) {
      await db.alumniDeviceToken.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
    }

    if (isFirebaseConfigured()) {
      await unsubscribeTokensFromTopic([cleanToken], "all_alumni").catch(() => null);
    }

    return { success: true, unregistered: true };
  } catch (err) {
    console.error("[Notifications] Failed to unregister device token:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// --------------------------------------------------------------------------
// Domain-Specific Notification Triggers ("where needed")
// --------------------------------------------------------------------------

/**
 * Triggered when Registrar signs off / approves an alumni registration or degree.
 */
export async function notifyDegreeVerificationApproved(alumniUserId: string, name?: string) {
  return notifyAlumniUser({
    userId: alumniUserId,
    title: "🎓 Degree Verification Approved!",
    message: `Congratulations ${name ? name : "Alumnus"}! Your official IPAM degree credentials and digital pass have been signed off by the Registrar.`,
    type: "VERIFICATION",
    priority: "URGENT",
    actionUrl: "/pass",
    data: {
      screen: "virtual_pass",
      action: "view_pass",
    },
  });
}

/**
 * Triggered when Registrar rejects an alumni registration.
 */
export async function notifyDegreeVerificationRejected(alumniUserId: string, name?: string, reason?: string) {
  return notifyAlumniUser({
    userId: alumniUserId,
    title: "⚠️ Degree Verification Update Required",
    message: reason
      ? `Your registration review was not approved: "${reason}". Please update your profile or contact the registrar.`
      : "Your degree verification review was not approved. Please check your profile or contact registrar support.",
    type: "VERIFICATION",
    priority: "URGENT",
    actionUrl: "/profile",
    data: {
      screen: "profile_management",
      action: "review_details",
    },
  });
}

/**
 * Triggered when Physical ID Card order status transitions.
 */
export async function notifyIdCardStatusChanged(params: {
  alumniUserId: string;
  orderNumber: string;
  newStatus: string;
  trackingCode?: string | null;
}) {
  const { alumniUserId, orderNumber, newStatus, trackingCode } = params;

  let title = "💳 Physical ID Card Update";
  let message = `Your physical smart card order #${orderNumber} status changed to ${newStatus}.`;
  let priority: "NORMAL" | "URGENT" = "NORMAL";

  switch (newStatus) {
    case "IN_PRINT_PRESS":
      title = "🖨️ ID Card in Production";
      message = `Your RFID smart card (#${orderNumber}) is now being produced in the high-security print press.`;
      break;
    case "QUALITY_CHECK":
      title = "🔍 ID Card Quality Assurance";
      message = `Card #${orderNumber} has passed optical verification and chip programming.`;
      break;
    case "READY_COURIER":
      title = "📦 ID Card Packaged";
      message = `Card #${orderNumber} has been packaged and is awaiting courier collection.`;
      break;
    case "DISPATCHED":
      title = "🚀 ID Card Dispatched";
      message = trackingCode
        ? `Card #${orderNumber} has been dispatched! Courier tracking code: ${trackingCode}.`
        : `Card #${orderNumber} has been dispatched via courier!`;
      priority = "URGENT";
      break;
    case "DELIVERED":
    case "COLLECTED":
      title = "✅ ID Card Delivered";
      message = `Card #${orderNumber} has been marked as successfully delivered. Thank you!`;
      break;
  }

  return notifyAlumniUser({
    userId: alumniUserId,
    title,
    message,
    type: "ID_CARD",
    priority,
    actionUrl: "/pass",
    data: {
      screen: "physical_card_tracking",
      orderNumber,
      orderStatus: newStatus,
      ...(trackingCode ? { trackingCode } : {}),
    },
  });
}

/**
 * Triggered when a candidate's job application status is updated by recruiter or admin.
 */
export async function notifyJobApplicationStatusChanged(params: {
  alumniUserId: string;
  jobTitle: string;
  company: string;
  status: string;
  remarks?: string | null;
}) {
  const { alumniUserId, jobTitle, company, status, remarks } = params;

  let title = `💼 Job Application Update: ${jobTitle}`;
  let message = `Your application for ${jobTitle} at ${company} was updated to ${status}.`;
  let priority: "NORMAL" | "URGENT" = "NORMAL";

  switch (status) {
    case "SHORTLISTED":
      title = `⭐ Shortlisted: ${jobTitle}`;
      message = `Great news! You have been shortlisted for ${jobTitle} at ${company}.`;
      priority = "URGENT";
      break;
    case "INTERVIEW_SCHEDULED":
      title = `📅 Interview Scheduled: ${jobTitle}`;
      message = `An interview has been scheduled for your application at ${company}.${remarks ? ` Note: ${remarks}` : ""}`;
      priority = "URGENT";
      break;
    case "OFFERED":
    case "ACCEPTED":
      title = `🎉 Job Offer / Selected: ${jobTitle}`;
      message = `Congratulations! You have been selected for ${jobTitle} at ${company}!`;
      priority = "URGENT";
      break;
    case "REJECTED":
      title = `Application Status: ${jobTitle}`;
      message = `Thank you for applying to ${jobTitle} at ${company}. The team has moved forward with another candidate.`;
      break;
  }

  return notifyAlumniUser({
    userId: alumniUserId,
    title,
    message,
    type: "JOB",
    priority,
    actionUrl: "/jobs",
    data: {
      screen: "job_applications",
      jobTitle,
      company,
      applicationStatus: status,
    },
  });
}

/**
 * Triggered when an alumni registers for an event.
 */
export async function notifyEventRegistrationConfirmed(params: {
  userId: string;
  eventTitle: string;
  eventDate: Date | string;
  bookingReference: string;
  location?: string | null;
}) {
  const { userId, eventTitle, eventDate, bookingReference, location } = params;
  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return notifyAlumniUser({
    userId,
    title: `🎟️ RSVP Confirmed: ${eventTitle}`,
    message: `You're confirmed for ${eventTitle} on ${formattedDate}.${location ? ` Venue: ${location}.` : ""} Booking ref: ${bookingReference}.`,
    type: "EVENT",
    priority: "NORMAL",
    actionUrl: "/events",
    data: {
      screen: "event_detail",
      bookingReference,
    },
  });
}

