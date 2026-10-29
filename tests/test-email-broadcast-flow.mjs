// Comprehensive Verification Test Suite for Email Broadcast (Gmail SMTP) Integration
// Tests:
// 1. SMTP configuration loading (growpos.official@gmail.com, port 465 SSL)
// 2. Transporter connection verification via verifySmtpConnection()
// 3. Branded HTML email template generation
// 4. Single email dispatch via sendEmail()
// 5. Batch broadcast email dispatch via sendBroadcastEmails()
// 6. Schema validation for Email broadcast channel

import {
  getSmtpConfig,
  isEmailConfigured,
  verifySmtpConnection,
  generateBroadcastEmailHtml,
  sendEmail,
  sendBroadcastEmails,
} from "../lib/email.ts";
import { sendBroadcastSchema } from "../lib/validation/broadcast.ts";

async function runEmailTestSuite() {
  console.log("\n========================================================");
  console.log("📧 IPAM Alumni Platform — Email Broadcast Test Suite");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: Validate SMTP Configuration
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Validating SMTP Configuration...");
  if (!isEmailConfigured()) {
    throw new Error("FAIL: Email is not reported as configured.");
  }
  const config = getSmtpConfig();
  if (config.host !== "smtp.gmail.com") {
    throw new Error(`FAIL: Unexpected SMTP host: ${config.host}`);
  }
  if (config.port !== 465) {
    throw new Error(`FAIL: Unexpected SMTP port: ${config.port}`);
  }
  if (!config.secure) {
    throw new Error("FAIL: Expected secure SSL/TLS connection (port 465).");
  }
  if (config.user !== "growpos.official@gmail.com") {
    throw new Error(`FAIL: Unexpected SMTP user: ${config.user}`);
  }
  if (!config.pass || config.pass.length < 10) {
    throw new Error("FAIL: App password not set or too short.");
  }
  console.log("✔ SMTP Configuration validated:");
  console.log(`   Host:     ${config.host}:${config.port} (SSL: ${config.secure})`);
  console.log(`   User:     ${config.user}`);
  console.log(`   Sender:   ${config.fromName} <${config.fromEmail}>\n`);

  // -------------------------------------------------------------------------
  // Test 2: Live SMTP Connection Verification
  // -------------------------------------------------------------------------
  console.log("▶ [Test 2] Connecting to smtp.gmail.com:465 and verifying credentials...");
  const connResult = await verifySmtpConnection();
  if (!connResult.success) {
    throw new Error(`FAIL: SMTP connection verification failed: ${connResult.error}`);
  }
  console.log("✔ Gmail SMTP handshake & authentication accepted (235 OK)!\n");

  // -------------------------------------------------------------------------
  // Test 3: Branded HTML Template Generation
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Generating official responsive HTML broadcast email...");
  const sampleHtml = generateBroadcastEmailHtml({
    title: "Official IPAM Alumni Gala & Awards Night 2026",
    message: "Distinguished Alumni, you are cordially invited to celebrate excellence at the Freetown Convention Centre.\n\nPlease confirm your attendance via the portal.",
    type: "INVITATION",
    priority: "URGENT",
    recipientName: "Dr. Amara Kamara",
    actionUrl: "https://ipam.billnbite.cloud/events/gala-2026",
    eventDate: new Date("2026-11-20T18:00:00Z"),
    eventVenue: "Freetown International Conference Center",
    rsvpDeadline: new Date("2026-11-10T23:59:00Z"),
  });

  if (!sampleHtml.includes("INSTITUTE OF PUBLIC ADMINISTRATION AND MANAGEMENT")) {
    throw new Error("FAIL: HTML template missing university header banner.");
  }
  if (!sampleHtml.includes("Dr. Amara Kamara")) {
    throw new Error("FAIL: HTML template missing personalized recipient name.");
  }
  if (!sampleHtml.includes("Freetown International Conference Center")) {
    throw new Error("FAIL: HTML template missing event venue block.");
  }
  if (!sampleHtml.includes("https://ipam.billnbite.cloud/events/gala-2026")) {
    throw new Error("FAIL: HTML template missing actionUrl call-to-action button.");
  }
  console.log("✔ Responsive HTML email template rendered with full styling & event schedule.\n");

  // -------------------------------------------------------------------------
  // Test 4: Live Single Email Send
  // -------------------------------------------------------------------------
  console.log(`▶ [Test 4] Dispatching live test email to ${config.user}...`);
  const sendResult = await sendEmail({
    to: config.user,
    subject: "[IPAM Alumni] Live Broadcast Integration Test",
    html: sampleHtml,
  });

  if (!sendResult.success) {
    throw new Error(`FAIL: Failed to send test email: ${sendResult.error}`);
  }
  if (!sendResult.messageId) {
    throw new Error("FAIL: No messageId returned from SMTP server.");
  }
  console.log("✔ Email dispatched successfully via Gmail SMTP!");
  console.log(`   Message-ID: ${sendResult.messageId}\n`);

  // -------------------------------------------------------------------------
  // Test 5: Batch Broadcast Simulation
  // -------------------------------------------------------------------------
  console.log("▶ [Test 5] Testing sendBroadcastEmails batch dispatcher...");
  const batchResult = await sendBroadcastEmails({
    recipients: [
      { email: config.user, name: "Admin Test Recipient" },
    ],
    title: "Batch Broadcast Test",
    message: "Verifying multi-recipient broadcast batch delivery.",
    type: "NOTIFICATION",
    priority: "NORMAL",
  });

  if (batchResult.sentCount < 1) {
    throw new Error(`FAIL: Expected at least 1 sent email, got ${batchResult.sentCount}`);
  }
  console.log(`✔ Batch dispatcher delivered ${batchResult.sentCount} email(s) cleanly.`);
  console.log(`   Batch Message ID: ${batchResult.messageIds[0]}\n`);

  // -------------------------------------------------------------------------
  // Test 6: Broadcast Validation Schema
  // -------------------------------------------------------------------------
  console.log("▶ [Test 6] Testing sendBroadcastSchema with EMAIL channel...");
  const validPayload = sendBroadcastSchema.safeParse({
    type: "INVITATION",
    title: "Campus Reconnection Mixer",
    message: "Join fellow alumni for networking.",
    audienceLabel: "All Registered Alumni",
    recipientsCount: 45,
    channels: ["EMAIL", "PUSH"],
    priority: "URGENT",
    eventVenue: "IPAM Tower Hill Campus",
  });
  if (!validPayload.success) {
    throw new Error("FAIL: Valid email broadcast payload failed schema validation.");
  }
  console.log("✔ sendBroadcastSchema successfully validated omnichannel EMAIL + PUSH channels.\n");

  console.log("========================================================");
  console.log("🎉 ALL EMAIL BROADCAST TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

runEmailTestSuite().catch((err) => {
  console.error("\n❌ EMAIL TEST SUITE FAILED:", err);
  process.exit(1);
});
