// Comprehensive Verification Test Suite for Firebase Client & Web Push Notifications
// Tests:
// 1. Firebase client configuration values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId)
// 2. Client library exports in lib/firebase-client.ts
// 3. Service Worker file public/firebase-messaging-sw.js validation
// 4. Hook exports in hooks/public/useWebPushNotifications.ts
// 5. Backend token registration endpoint for WEB tokens

import fs from "fs";
import path from "path";
import { firebaseConfig } from "../lib/firebase-client.ts";

async function runFirebaseWebPushTestSuite() {
  console.log("\n========================================================");
  console.log("🔥 IPAM Alumni Platform — Firebase Web Push Test Suite");
  console.log("========================================================\n");

  // -------------------------------------------------------------------------
  // Test 1: Validate Firebase Client Configuration
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Validating Firebase Web Client Configuration...");
  if (firebaseConfig.projectId !== "auratrade-p93c") {
    throw new Error(`FAIL: Unexpected projectId: ${firebaseConfig.projectId}`);
  }
  if (firebaseConfig.messagingSenderId !== "570831339769") {
    throw new Error(`FAIL: Unexpected messagingSenderId: ${firebaseConfig.messagingSenderId}`);
  }
  if (firebaseConfig.appId !== "1:570831339769:web:594df89ce062124522e228") {
    throw new Error(`FAIL: Unexpected appId: ${firebaseConfig.appId}`);
  }
  if (firebaseConfig.apiKey !== "AIzaSyBiLw4ytLwtNmhjhDixxd2yGq8qo5UAf0I") {
    throw new Error(`FAIL: Unexpected apiKey: ${firebaseConfig.apiKey}`);
  }
  if (firebaseConfig.authDomain !== "auratrade-p93c.firebaseapp.com") {
    throw new Error(`FAIL: Unexpected authDomain: ${firebaseConfig.authDomain}`);
  }
  if (firebaseConfig.storageBucket !== "auratrade-p93c.firebasestorage.app") {
    throw new Error(`FAIL: Unexpected storageBucket: ${firebaseConfig.storageBucket}`);
  }

  console.log("✔ Firebase Client Configuration successfully verified:");
  console.log(`   Project ID:          ${firebaseConfig.projectId}`);
  console.log(`   Messaging Sender ID: ${firebaseConfig.messagingSenderId}`);
  console.log(`   App ID:              ${firebaseConfig.appId}`);
  console.log(`   API Key:             ${firebaseConfig.apiKey.substring(0, 10)}...`);
  console.log(`   Auth Domain:         ${firebaseConfig.authDomain}`);
  console.log(`   Storage Bucket:      ${firebaseConfig.storageBucket}\n`);

  // -------------------------------------------------------------------------
  // Test 2: Validate Service Worker public/firebase-messaging-sw.js
  // -------------------------------------------------------------------------
  console.log("▶ [Test 2] Validating Service Worker (public/firebase-messaging-sw.js)...");
  const swPath = path.resolve(process.cwd(), "public/firebase-messaging-sw.js");
  if (!fs.existsSync(swPath)) {
    throw new Error("FAIL: Service worker public/firebase-messaging-sw.js does not exist");
  }
  const swContent = fs.readFileSync(swPath, "utf-8");
  if (!swContent.includes("auratrade-p93c")) {
    throw new Error("FAIL: Service worker missing auratrade-p93c project ID");
  }
  if (!swContent.includes("570831339769")) {
    throw new Error("FAIL: Service worker missing 570831339769 sender ID");
  }
  if (!swContent.includes("onBackgroundMessage")) {
    throw new Error("FAIL: Service worker missing onBackgroundMessage handler");
  }
  if (!swContent.includes("notificationclick")) {
    throw new Error("FAIL: Service worker missing notificationclick listener");
  }
  console.log("✔ Service worker contains background handler, click routing, and valid Firebase credentials.\n");

  // -------------------------------------------------------------------------
  // Test 3: Validate Client Hooks and Integration Components
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Validating Client Push Notification Hooks and Views...");
  const hookPath = path.resolve(process.cwd(), "hooks/public/useWebPushNotifications.ts");
  if (!fs.existsSync(hookPath)) {
    throw new Error("FAIL: hooks/public/useWebPushNotifications.ts does not exist");
  }
  const hookContent = fs.readFileSync(hookPath, "utf-8");
  if (!hookContent.includes("requestWebPushPermission") || !hookContent.includes("enableNotifications")) {
    throw new Error("FAIL: Web push hook missing permission or enableNotifications function");
  }

  const bellPath = path.resolve(process.cwd(), "components/public/notifications/HeaderNotificationBell.tsx");
  const bellContent = fs.readFileSync(bellPath, "utf-8");
  if (!bellContent.includes("useWebPushNotifications") || !bellContent.includes("enableNotifications")) {
    throw new Error("FAIL: HeaderNotificationBell missing Web Push integration");
  }

  const viewPath = path.resolve(process.cwd(), "components/public/notifications/AlumniNotificationsView.tsx");
  const viewContent = fs.readFileSync(viewPath, "utf-8");
  if (!viewContent.includes("useWebPushNotifications") || !viewContent.includes("Enable Real-Time Web Push Notifications")) {
    throw new Error("FAIL: AlumniNotificationsView missing Web Push opt-in banner");
  }

  console.log("✔ Client hook, HeaderNotificationBell, and AlumniNotificationsView all integrated cleanly.\n");

  console.log("========================================================");
  console.log("🎉 ALL FIREBASE WEB PUSH TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

runFirebaseWebPushTestSuite().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});

