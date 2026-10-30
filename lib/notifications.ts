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
import {
  sendEmail,
  sendAlumniRegistrationEmails,
  sendJobApplicationEmails,
  sendJobStatusEmail,
  sendBusinessSubmissionEmails,
  sendBusinessApprovalEmail,
  sendDonationEmails,
  generateEventRsvpConfirmationEmailHtml,
  generateEventAttendeeUpdateEmailHtml,
  generateDegreeVerificationEmailHtml,
  generatePhysicalCardOrderEmailHtml,
} from "@/lib/email";

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
  const result = await notifyAlumniUser({
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

  // Also dispatch official verification approval email
  try {
    const user = await db.alumniUser.findUnique({
      where: { id: alumniUserId },
      select: { email: true, profile: { select: { degree: true } } },
    });
    if (user?.email) {
      const html = generateDegreeVerificationEmailHtml({
        name: name || "Alumnus",
        approved: true,
        degree: user.profile?.degree,
      });
      sendEmail({
        to: user.email,
        subject: "[IPAM Registrar] Official Degree Verification Approved & Pass Issued",
        html,
      }).catch((err) => console.error("[Notifications] Degree approval email error:", err));
    }
  } catch (err) {
    console.error("[Notifications] Failed fetching user email for degree approval:", err);
  }

  return result;
}

/**
 * Triggered when Registrar rejects an alumni registration.
 */
export async function notifyDegreeVerificationRejected(alumniUserId: string, name?: string, reason?: string) {
  const result = await notifyAlumniUser({
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

  try {
    const user = await db.alumniUser.findUnique({
      where: { id: alumniUserId },
      select: { email: true },
    });
    if (user?.email) {
      const html = generateDegreeVerificationEmailHtml({
        name: name || "Alumnus",
        approved: false,
        reason,
      });
      sendEmail({
        to: user.email,
        subject: "[IPAM Registrar] Degree Verification Review — Additional Information Required",
        html,
      }).catch((err) => console.error("[Notifications] Degree rejection email error:", err));
    }
  } catch (err) {
    console.error("[Notifications] Failed fetching user email for degree rejection:", err);
  }

  return result;
}

/**
 * Triggered when a new alumnus registers on the platform.
 */
export async function notifyAlumniRegistrationReceived(params: {
  name: string;
  email: string;
  studentId: string;
  degree?: string | null;
  gradYear?: number | null;
}) {
  return sendAlumniRegistrationEmails(params);
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
 * Triggered when Physical ID Card order is created.
 */
export async function notifyPhysicalCardOrderSubmitted(params: {
  alumniEmail: string;
  recipientName: string;
  orderNumber: string;
  cardTier: string;
  amount: number | string;
  currency: string;
  deliveryAddress: string;
  paymentMethod: string;
  paymentStatus: string;
}) {
  const html = generatePhysicalCardOrderEmailHtml(params);
  return sendEmail({
    to: params.alumniEmail,
    subject: `[IPAM Smart ID] Card Order Confirmed #${params.orderNumber}`,
    html,
  });
}

/**
 * Triggered when a candidate submits an application for a job opening.
 * Notifies BOTH Employee (Applicant) and Employer via Push/In-App and Email.
 */
export async function notifyJobApplicationSubmitted(params: {
  applicantUserId: string;
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
  employerAlumniUserId?: string | null;
  employerEmail?: string | null;
  employerName?: string | null;
}) {
  // 1. In-App + FCM Push Notification to Applicant (Employee)
  await notifyAlumniUser({
    userId: params.applicantUserId,
    title: `💼 Application Submitted: ${params.jobTitle}`,
    message: `Your application for ${params.jobTitle} at ${params.company} has been received. Reference: ${params.applicationRef}.`,
    type: "JOB",
    priority: "NORMAL",
    actionUrl: "/jobs/my-applications",
    data: {
      screen: "job_applications",
      jobTitle: params.jobTitle,
      company: params.company,
      applicationRef: params.applicationRef,
    },
  }).catch((err) => console.error("[Notifications] Applicant push error:", err));

  // 2. In-App + FCM Push Notification to Employer (if employer is an alumni member)
  if (params.employerAlumniUserId) {
    await notifyAlumniUser({
      userId: params.employerAlumniUserId,
      title: `📥 New Applicant: ${params.jobTitle}`,
      message: `${params.candidateName} (${params.degree || "IPAM Alumnus"}) applied for ${params.jobTitle}. Match: ${params.matchScore ?? 85}%.`,
      type: "JOB",
      priority: "URGENT",
      actionUrl: "/jobs/manage",
      data: {
        screen: "manage_job_applicants",
        jobTitle: params.jobTitle,
        applicationRef: params.applicationRef,
      },
    }).catch((err) => console.error("[Notifications] Employer push error:", err));
  }

  // 3. Dispatch branded confirmation emails to both Employee and Employer
  await sendJobApplicationEmails(params).catch((err) =>
    console.error("[Notifications] Job application email error:", err)
  );
}

/**
 * Triggered when a candidate's job application status is updated by recruiter or admin.
 * Notifies Employee (Applicant) via Push/In-App and Email.
 */
export async function notifyJobApplicationStatusChanged(params: {
  alumniUserId: string;
  candidateEmail?: string | null;
  candidateName?: string | null;
  jobTitle: string;
  company: string;
  status: string;
  remarks?: string | null;
  interviewDate?: Date | string | null;
  offerSalary?: string | null;
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
    case "SELECTED":
      title = `🎉 Job Offer / Selected: ${jobTitle}`;
      message = `Congratulations! You have been selected for ${jobTitle} at ${company}!`;
      priority = "URGENT";
      break;
    case "REJECTED":
      title = `Application Status: ${jobTitle}`;
      message = `Thank you for applying to ${jobTitle} at ${company}. The team has moved forward with another candidate.`;
      break;
  }

  // 1. Push + In-App notification
  const pushPromise = notifyAlumniUser({
    userId: alumniUserId,
    title,
    message,
    type: "JOB",
    priority,
    actionUrl: "/jobs/my-applications",
    data: {
      screen: "job_applications",
      jobTitle,
      company,
      applicationStatus: status,
    },
  }).catch((err) => console.error("[Notifications] Job status push error:", err));

  // 2. Email notification to candidate
  const emailPromise = (async () => {
    let email = params.candidateEmail;
    let name = params.candidateName;

    if (!email) {
      const user = await db.alumniUser.findUnique({
        where: { id: alumniUserId },
        select: { email: true, profile: { select: { name: true } } },
      }).catch(() => null);
      email = user?.email;
      name = name || user?.profile?.name || "Candidate";
    }

    if (email) {
      await sendJobStatusEmail({
        candidateEmail: email,
        candidateName: name || "Candidate",
        jobTitle,
        company,
        status,
        remarks,
        interviewDate: params.interviewDate,
        offerSalary: params.offerSalary,
      }).catch((err) => console.error("[Notifications] Job status email error:", err));
    }
  })();

  await Promise.all([pushPromise, emailPromise]);
}

/**
 * Triggered when an alumnus registers / RSVPs for an event.
 */
export async function notifyEventRegistrationConfirmed(params: {
  userId: string;
  attendeeEmail?: string | null;
  attendeeName?: string | null;
  eventTitle: string;
  eventDate: Date | string;
  bookingReference: string;
  location?: string | null;
  ticketCount?: number;
  totalAmount?: number | string;
  currency?: string;
  paymentStatus?: string;
}) {
  const { userId, eventTitle, eventDate, bookingReference, location } = params;
  const formattedDate = new Date(eventDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // 1. Push & In-App Notification
  const pushPromise = notifyAlumniUser({
    userId,
    title: `🎟️ RSVP Confirmed: ${eventTitle}`,
    message: `You're confirmed for ${eventTitle} on ${formattedDate}.${location ? ` Venue: ${location}.` : ""} Booking ref: ${bookingReference}.`,
    type: "EVENT",
    priority: "NORMAL",
    actionUrl: "/events/my-registrations",
    data: {
      screen: "event_detail",
      bookingReference,
    },
  }).catch((err) => console.error("[Notifications] Event RSVP push error:", err));

  // 2. Confirmation Email
  const emailPromise = (async () => {
    let email = params.attendeeEmail;
    let name = params.attendeeName;

    if (!email && userId) {
      const user = await db.alumniUser.findUnique({
        where: { id: userId },
        select: { email: true, profile: { select: { name: true } } },
      }).catch(() => null);
      email = user?.email;
      name = name || user?.profile?.name;
    }

    if (email) {
      const html = generateEventRsvpConfirmationEmailHtml({
        attendeeName: name || "Alumnus",
        eventTitle,
        eventDate,
        bookingReference,
        location,
        ticketCount: params.ticketCount,
        totalAmount: params.totalAmount,
        currency: params.currency,
        paymentStatus: params.paymentStatus,
      });
      await sendEmail({
        to: email,
        subject: `[IPAM Events] RSVP Confirmed: ${eventTitle} (Ref: ${bookingReference})`,
        html,
      }).catch((err) => console.error("[Notifications] Event RSVP email error:", err));
    }
  })();

  await Promise.all([pushPromise, emailPromise]);
}

/**
 * Event notification dispatched ONLY to registered alumni of that specific event.
 * Dispatches Push / In-App only to alumni with confirmed registrations, and Email to all attendees.
 */
export async function notifyEventAttendees(params: {
  eventId: string;
  subject: string;
  message: string;
  actionUrl?: string | null;
}) {
  const event = await db.alumniEvent.findUnique({
    where: { id: params.eventId },
    include: {
      registrations: {
        where: { bookingStatus: { not: "CANCELLED" } },
        include: {
          user: { select: { id: true, email: true, profile: { select: { name: true } } } },
        },
      },
    },
  });

  if (!event || event.registrations.length === 0) {
    return { notifiedCount: 0, recipientEmails: [] };
  }

  // 1. Push + In-App notification ONLY to registered alumni users
  const registeredUserIds = Array.from(
    new Set(event.registrations.map((r) => r.userId).filter(Boolean) as string[])
  );

  const pushPromises = registeredUserIds.map((userId) =>
    notifyAlumniUser({
      userId,
      title: `🎟️ ${event.title}: ${params.subject}`,
      message: params.message,
      type: "EVENT",
      priority: "URGENT",
      actionUrl: params.actionUrl || `/events`,
      data: {
        screen: "event_detail",
        eventId: event.id,
      },
    }).catch((err) => console.error("[Notifications] Attendee push error:", err))
  );

  // 2. Email notification to registered attendee emails
  const seenEmails = new Set<string>();
  const emailPromises: Promise<any>[] = [];

  for (const reg of event.registrations) {
    const email = (reg.attendeeEmail || reg.user?.email || "").trim().toLowerCase();
    const name = reg.attendeeName || reg.user?.profile?.name || "Distinguished Alumnus";
    if (email && email.includes("@") && !seenEmails.has(email)) {
      seenEmails.add(email);
      const html = generateEventAttendeeUpdateEmailHtml({
        recipientName: name,
        eventTitle: event.title,
        eventDate: event.date,
        location: event.location,
        subject: params.subject,
        message: params.message,
        actionUrl: params.actionUrl,
      });

      emailPromises.push(
        sendEmail({
          to: email,
          subject: `[IPAM Events] ${event.title}: ${params.subject}`,
          html,
        }).catch((err) => console.error("[Notifications] Attendee email error:", err))
      );
    }
  }

  await Promise.all([...pushPromises, ...emailPromises]);

  return {
    notifiedCount: registeredUserIds.length,
    emailRecipientsCount: seenEmails.size,
  };
}

/**
 * Triggered when a new business listing is submitted by an alumnus.
 */
export async function notifyBusinessListingSubmitted(params: {
  businessName: string;
  industry: string;
  founders?: string | null;
  ownerEmail: string;
  ownerName: string;
  contactPhone?: string | null;
  website?: string | null;
  location?: string | null;
  description?: string | null;
}) {
  return sendBusinessSubmissionEmails(params);
}

/**
 * Triggered when admin approves a business listing.
 */
export async function notifyBusinessListingApproved(params: {
  ownerUserId?: string | null;
  ownerEmail: string;
  ownerName: string;
  businessName: string;
  industry: string;
}) {
  // 1. Push + In-app notification to business owner
  if (params.ownerUserId) {
    await notifyAlumniUser({
      userId: params.ownerUserId,
      title: `🏢 Business Approved: ${params.businessName}`,
      message: `Congratulations! Your business listing for ${params.businessName} has been approved and published in the IPAM Directory.`,
      type: "NOTIFICATION",
      priority: "NORMAL",
      actionUrl: "/businesses",
      data: {
        screen: "business_directory",
        businessName: params.businessName,
      },
    }).catch((err) => console.error("[Notifications] Business approval push error:", err));
  }

  // 2. Email notification to business owner
  await sendBusinessApprovalEmail(params).catch((err) =>
    console.error("[Notifications] Business approval email error:", err)
  );
}

/**
 * Triggered when a donation is received.
 * Dispatches ALL donor details to Admin, and official tax receipt to Donor.
 */
export async function notifyDonationReceived(params: {
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
  userId?: string | null;
}) {
  // Push / In-App notification to logged-in donor
  if (params.userId) {
    notifyAlumniUser({
      userId: params.userId,
      title: "💝 Thank You for Your Gift to IPAM!",
      message: `Your contribution of ${params.currency} ${Number(params.amount).toFixed(2)} to ${params.fund} has been received. Ref: ${params.paymentRef}.`,
      type: "NOTIFICATION",
      priority: "NORMAL",
      actionUrl: "/donations?mine=true",
      data: {
        screen: "giving_history",
        paymentRef: params.paymentRef,
      },
    }).catch((err) => console.error("[Notifications] Donation push error:", err));
  }

  // Send admin full details email & donor receipt email
  return sendDonationEmails(params);
}


