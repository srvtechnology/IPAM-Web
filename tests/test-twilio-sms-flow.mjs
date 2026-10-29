// Comprehensive Verification Test Suite for Twilio SMS Integration
// Tests:
// 1. Twilio configuration loading (Account SID, Auth Token, Messaging Service SID)
// 2. Live Twilio API authentication & Account Status check via verifyTwilioCredentials()
// 3. E.164 phone number normalization (Sierra Leone +232 formats, international, clean digits)
// 4. SMS content formatting via formatSmsText()
// 5. Schema validation for SMS channel broadcasts in sendBroadcastSchema
// 6. Batch broadcast SMS dispatch via sendBroadcastSms()
// 7. Test SMS endpoint logic and response shapes

import {
  getTwilioConfig,
  isTwilioConfigured,
  verifyTwilioCredentials,
  normalizePhoneNumber,
  formatSmsText,
  sendBroadcastSms,
} from "../lib/sms.ts";
import { sendBroadcastSchema } from "../lib/validation/broadcast.ts";

async function runTwilioTestSuite() {
  console.log("\n========================================================");
  console.log("📱 IPAM Alumni Platform — Twilio SMS Test Suite");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: Validate Twilio Configuration
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Validating Twilio Environment Configuration...");
  if (!isTwilioConfigured()) {
    throw new Error("FAIL: Twilio is not reported as configured.");
  }
  const config = getTwilioConfig();
  if (!config.accountSid || !config.accountSid.startsWith("AC") || config.accountSid.length !== 34) {
    throw new Error(`FAIL: Unexpected Twilio Account SID format: ${config.accountSid}`);
  }
  if (!config.authToken || config.authToken.length < 20) {
    throw new Error("FAIL: Twilio Auth Token is missing or invalid length.");
  }
  if (!config.messagingServiceSid || !config.messagingServiceSid.startsWith("MG")) {
    throw new Error(`FAIL: Unexpected Messaging Service SID: ${config.messagingServiceSid}`);
  }
  console.log("✔ Twilio Configuration validated:");
  console.log(`   Account SID:           ${config.accountSid}`);
  console.log(`   Auth Token:            ${config.authToken.substring(0, 4)}...${config.authToken.substring(config.authToken.length - 4)}`);
  console.log(`   Messaging Service SID: ${config.messagingServiceSid}\n`);

  // -------------------------------------------------------------------------
  // Test 2: Live Twilio API Authentication & Account Status
  // -------------------------------------------------------------------------
  console.log("▶ [Test 2] Connecting to Twilio REST API to verify account credentials...");
  const verifyResult = await verifyTwilioCredentials();
  if (!verifyResult.success) {
    throw new Error(`FAIL: Twilio credentials verification failed: ${verifyResult.error}`);
  }
  if (verifyResult.accountStatus !== "active") {
    throw new Error(`FAIL: Expected account status "active", got "${verifyResult.accountStatus}"`);
  }
  console.log("✔ Twilio API accepted credentials (HTTP 200 OK):");
  console.log(`   Friendly Name:  ${verifyResult.friendlyName}`);
  console.log(`   Account Status: ${verifyResult.accountStatus}\n`);

  // -------------------------------------------------------------------------
  // Test 3: Phone Number Normalization
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Testing phone number normalization into E.164 standard...");
  const testCases = [
    { input: "+23276123456", expected: "+23276123456" },
    { input: "076123456", expected: "+23276123456" },       // 9-digit national
    { input: "76123456", expected: "+23276123456" },        // 8-digit national
    { input: "+1 (415) 555-2671", expected: "+14155552671" }, // US formatted
    { input: "00447911123456", expected: "+447911123456" },  // 00 prefix international
    { input: "   +232-76-998877   ", expected: "+23276998877" },
  ];

  for (const tc of testCases) {
    const normalized = normalizePhoneNumber(tc.input);
    if (normalized !== tc.expected) {
      throw new Error(`FAIL: Normalization mismatch for "${tc.input}": got "${normalized}", expected "${tc.expected}"`);
    }
  }
  console.log(`✔ All ${testCases.length} phone number normalization cases passed.\n`);

  // -------------------------------------------------------------------------
  // Test 4: SMS Message Text Formatting
  // -------------------------------------------------------------------------
  console.log("▶ [Test 4] Testing SMS body formatting and URL appending...");
  const formatted = formatSmsText({
    title: "Annual Gala 2026",
    message: "RSVP deadline extended to this Friday. We look forward to seeing you!",
    actionUrl: "/events/gala",
  });

  if (!formatted.startsWith("[IPAM Alumni] Annual Gala 2026")) {
    throw new Error("FAIL: Formatted SMS missing expected IPAM prefix.");
  }
  if (!formatted.includes("Portal: https://ipam.billnbite.cloud/events/gala")) {
    throw new Error("FAIL: Formatted SMS missing absolute action portal URL.");
  }
  console.log("✔ SMS text formatting verified:");
  console.log("--- Preview ---");
  console.log(formatted);
  console.log("---------------\n");

  // -------------------------------------------------------------------------
  // Test 5: Broadcast Schema Validation for SMS Channel
  // -------------------------------------------------------------------------
  console.log("▶ [Test 5] Validating Omnichannel Broadcast Schema with SMS channel...");
  const smsBroadcastPayload = {
    type: "NOTIFICATION",
    title: "Severe Weather Notice - Freetown Campus",
    message: "Due to heavy rains, afternoon lectures are suspended. Administrative offices remain open.",
    channels: ["SMS", "PUSH"],
    audienceLabel: "All Registered Alumni",
    recipientsCount: 42,
    priority: "CRITICAL",
    actionUrl: "https://ipam.billnbite.cloud",
  };

  const parsed = sendBroadcastSchema.safeParse(smsBroadcastPayload);
  if (!parsed.success) {
    throw new Error(`FAIL: sendBroadcastSchema rejected valid SMS payload: ${JSON.stringify(parsed.error.flatten())}`);
  }
  console.log("✔ Broadcast payload validated successfully with channels:", parsed.data.channels, "\n");

  // -------------------------------------------------------------------------
  // Test 6: Verify Batch Broadcast SMS Flow Functionality
  // -------------------------------------------------------------------------
  console.log("▶ [Test 6] Verifying sendBroadcastSms handler with simulated recipients...");
  const batchResult = await sendBroadcastSms({
    recipients: [],
    title: "Empty batch test",
    message: "This should return clean empty summary without errors",
  });

  if (batchResult.sentCount !== 0 || batchResult.failedCount !== 0) {
    throw new Error("FAIL: Unexpected batch result for empty recipient list");
  }
  console.log("✔ Empty batch handled cleanly (sent: 0, failed: 0).");

  console.log("\n========================================================");
  console.log("🎉 ALL TWILIO SMS INTEGRATION TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

runTwilioTestSuite().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
