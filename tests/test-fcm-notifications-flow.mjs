// Comprehensive Verification Test Suite for Firebase Cloud Messaging (FCM) Integration
// Tests:
// 1. Service account key credentials parsing and verification (auratrade-p93c)
// 2. RS256 JWT signing and Google OAuth2 access token exchange
// 3. Official Google FCM HTTP v1 dispatch to topic "all_alumni"
// 4. Stale/invalid token detection and handling
// 5. Validation schemas for token registration, unregistration, and test dispatch
// 6. Prisma schema and migration SQL validation
// 7. Flutter mobile integration docs and OpenAPI specs

import fs from "node:fs";
import path from "node:path";
import {
  isFirebaseConfigured,
  getFirebaseCredentials,
  getFirebaseAccessToken,
  sendPushToTopic,
  sendPushToDevice,
  sendMulticastPush,
} from "../lib/firebase.ts";

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🔥 IPAM Alumni Platform — FCM Notifications Test Suite");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: Service Account Key & Configuration
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Validating serviceAccountKey.json & Firebase configuration...");
  if (!isFirebaseConfigured()) {
    throw new Error("FAIL: Firebase is not reported as configured.");
  }
  const creds = getFirebaseCredentials();
  if (!creds) {
    throw new Error("FAIL: Could not load credentials.");
  }
  if (creds.project_id !== "auratrade-p93c") {
    throw new Error(`FAIL: Unexpected project_id: ${creds.project_id}`);
  }
  if (!creds.client_email.includes("firebase-adminsdk")) {
    throw new Error(`FAIL: Unexpected client_email: ${creds.client_email}`);
  }
  if (!creds.private_key || !creds.private_key.includes("BEGIN PRIVATE KEY")) {
    throw new Error("FAIL: Invalid private key format.");
  }
  console.log("✔ Firebase service account credentials validated:");
  console.log(`   Project ID:   ${creds.project_id}`);
  console.log(`   Client Email: ${creds.client_email}\n`);

  // -------------------------------------------------------------------------
  // Test 2: Google OAuth2 RS256 Token Minting
  // -------------------------------------------------------------------------
  console.log("▶ [Test 2] Minting Google OAuth2 access token for firebase.messaging...");
  const token = await getFirebaseAccessToken();
  if (!token || typeof token !== "string" || token.length < 50) {
    throw new Error("FAIL: Failed to obtain valid Google OAuth2 access token.");
  }
  console.log(`✔ Access token acquired successfully (length: ${token.length}).`);
  console.log(`   Token prefix: ${token.substring(0, 20)}...\n`);

  // -------------------------------------------------------------------------
  // Test 3: FCM v1 Topic Dispatch to "all_alumni"
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Dispatching real FCM v1 message to topic 'all_alumni'...");
  const topicResult = await sendPushToTopic({
    topic: "all_alumni",
    title: "Official IPAM Notification",
    body: "Automated verification test of Firebase Cloud Messaging pipeline.",
    priority: "HIGH",
    actionUrl: "/pass",
    data: {
      type: "SYSTEM_TEST",
      environment: "test",
    },
  });

  if (!topicResult.success) {
    throw new Error(`FAIL: FCM topic push failed: ${topicResult.error}`);
  }
  if (!topicResult.messageId || !topicResult.messageId.includes("messages/")) {
    throw new Error(`FAIL: Unexpected messageId format: ${topicResult.messageId}`);
  }
  console.log("✔ Push notification delivered to Google FCM v1 successfully!");
  console.log(`   FCM Resource ID: ${topicResult.messageId}\n`);

  // -------------------------------------------------------------------------
  // Test 4: Invalid/Fake Token Detection
  // -------------------------------------------------------------------------
  console.log("▶ [Test 4] Testing invalid device token handling...");
  const fakeTokenResult = await sendPushToDevice({
    token: "fake_device_token_xyz_1234567890_abcdef",
    title: "Test",
    body: "Should fail gracefully",
  });

  if (fakeTokenResult.success) {
    throw new Error("FAIL: Expected sending to fake token to fail, but it succeeded!");
  }
  console.log("   ✔ Token correctly rejected by FCM:", fakeTokenResult.error);
  console.log("✔ Invalid token handled gracefully without throwing exceptions.\n");

  // -------------------------------------------------------------------------
  // Test 5: Multicast Batch Push Behavior
  // -------------------------------------------------------------------------
  console.log("▶ [Test 5] Testing multicast batch handling with multiple tokens...");
  const multicastResult = await sendMulticastPush(
    ["mock_token_1", "mock_token_2"],
    {
      title: "Batch Notification",
      body: "Testing batch delivery",
    }
  );
  if (multicastResult.results.length !== 2) {
    throw new Error(`FAIL: Expected 2 results, got ${multicastResult.results.length}`);
  }
  console.log(`✔ Multicast batch processed ${multicastResult.results.length} tokens cleanly.\n`);

  // -------------------------------------------------------------------------
  // Test 6: Request Validation Schemas
  // -------------------------------------------------------------------------
  console.log("▶ [Test 6] Checking validation schema file...");
  const validationPath = path.resolve("lib/validation/notifications.ts");
  if (!fs.existsSync(validationPath)) {
    throw new Error("FAIL: lib/validation/notifications.ts missing.");
  }
  const valContent = fs.readFileSync(validationPath, "utf8");
  if (!valContent.includes("registerDeviceTokenSchema") || !valContent.includes("unregisterDeviceTokenSchema")) {
    throw new Error("FAIL: Missing schemas in lib/validation/notifications.ts");
  }
  console.log("✔ Notification validation schemas verified.\n");

  // -------------------------------------------------------------------------
  // Test 7: Verify Migration File & Schema Consistency
  // -------------------------------------------------------------------------
  console.log("▶ [Test 7] Verifying Prisma migration and schema consistency...");
  const schemaPath = path.resolve("prisma/schema.prisma");
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  if (!schemaContent.includes("model AlumniDeviceToken")) {
    throw new Error("FAIL: AlumniDeviceToken missing from prisma/schema.prisma");
  }
  if (!schemaContent.includes("model AlumniNotification")) {
    throw new Error("FAIL: AlumniNotification missing from prisma/schema.prisma");
  }
  if (!schemaContent.includes("deviceTokens             AlumniDeviceToken[]")) {
    throw new Error("FAIL: deviceTokens relation missing on AlumniUser");
  }

  const migrationDir = path.resolve("prisma/migrations/20261029180000_add_fcm_device_tokens_and_notifications");
  if (!fs.existsSync(migrationDir) || !fs.existsSync(path.join(migrationDir, "migration.sql"))) {
    throw new Error("FAIL: Migration directory or migration.sql missing.");
  }
  const migrationSql = fs.readFileSync(path.join(migrationDir, "migration.sql"), "utf8");
  if (!migrationSql.includes("CREATE TABLE `alumni_device_tokens`")) {
    throw new Error("FAIL: alumni_device_tokens table definition missing in migration.sql");
  }
  if (!migrationSql.includes("CREATE TABLE `alumni_notifications`")) {
    throw new Error("FAIL: alumni_notifications table definition missing in migration.sql");
  }
  console.log("✔ Prisma schema and migration SQL validated successfully.\n");

  // -------------------------------------------------------------------------
  // Test 8: Mobile Documentation & OpenAPI Spec
  // -------------------------------------------------------------------------
  console.log("▶ [Test 8] Checking Flutter integration docs & OpenAPI specs...");
  const docPath = path.resolve("docs/mobile-api/14-push-notifications-and-fcm.md");
  if (!fs.existsSync(docPath)) {
    throw new Error("FAIL: docs/mobile-api/14-push-notifications-and-fcm.md not found.");
  }
  const openApiPath = path.resolve("lib/swagger/openapi-spec.ts");
  const openApiContent = fs.readFileSync(openApiPath, "utf8");
  if (!openApiContent.includes("/api/notifications/register-token")) {
    throw new Error("FAIL: /api/notifications/register-token missing from OpenAPI spec.");
  }
  if (!openApiContent.includes("Push Notifications & FCM")) {
    throw new Error("FAIL: Push Notifications & FCM tag missing from OpenAPI spec.");
  }
  console.log("✔ Mobile API documentation and OpenAPI specifications confirmed.\n");

  console.log("========================================================");
  console.log("🎉 ALL FCM NOTIFICATION TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

runTestSuite().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
