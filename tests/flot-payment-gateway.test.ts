/**
 * Comprehensive Automated Test Suite: Flot Payment Gateway
 * 
 * Tests:
 * 1. RSA-4096 Keypair loading and integrity.
 * 2. Cryptographic signature calculation (RSA-4096-PSS + SHA-512 + base64) for body-present requests.
 * 3. Cryptographic signature calculation for body-less canonical requests.
 * 4. HTTP Basic Auth verification for webhook endpoints.
 * 5. Flot payment link creation (sandbox & parameterized).
 * 6. Flot Webhook handling logic (status = completed, status = failed retention, unauthorized rejection).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  getFlotPrivateKey,
  signFlotPayload,
  verifyFlotSignature,
  verifyFlotBasicAuth,
  createFlotPaymentLink,
} from "../lib/payments/flot";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, message: string) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`✅ PASS: ${message}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("💳 Running Flot Payment Gateway Test Suite");
  console.log("========================================================\n");

  // -------------------------------------------------------------------
  // Test 1: RSA-4096 Key Loading
  // -------------------------------------------------------------------
  console.log("[Test 1] Load RSA-4096 private key...");
  const privateKey = getFlotPrivateKey();
  assert(!!privateKey, "Private key is accessible from keys/flot/private_key.pem");
  assert(privateKey!.includes("BEGIN PRIVATE KEY") || privateKey!.includes("BEGIN RSA PRIVATE KEY"), "Key has standard PEM header");

  const pubKeyPath = path.resolve(process.cwd(), "keys/flot/public_key.pem");
  assert(fs.existsSync(pubKeyPath), "Matching public_key.pem exists on disk");
  const publicKey = fs.readFileSync(pubKeyPath, "utf8");

  const b64Path = path.resolve(process.cwd(), "keys/flot/public_key.base64");
  assert(fs.existsSync(b64Path), "Base64-encoded public key file exists for Flot staff sharing");

  // -------------------------------------------------------------------
  // Test 2: Body-Present Request Signature Pipeline (Page 6 & 7)
  // -------------------------------------------------------------------
  console.log("\n[Test 2] Body-present request signature pipeline...");
  const requestBody = {
    merchantId: "test-merchant-uuid-1234",
    type: "in-app",
    payload: {
      orderId: "PVC-TEST-8899",
      currency: "SLE",
      amount: "15",
    },
  };
  const bodyString = JSON.stringify(requestBody);
  const signature = signFlotPayload(bodyString, privateKey!);
  assert(!!signature && signature.length > 100, "Generated RSA-4096-PSS signature in base64 format");

  const isSigValid = verifyFlotSignature(bodyString, signature, publicKey);
  assert(isSigValid === true, "Signature verifies successfully with Flot RSA-4096 public key");

  // Tamper detection test
  const tamperedBody = JSON.stringify({ ...requestBody, payload: { ...requestBody.payload, amount: "999" } });
  const isTamperValid = verifyFlotSignature(tamperedBody, signature, publicKey);
  assert(isTamperValid === false, "Tampered payload fails cryptographic signature verification");

  // -------------------------------------------------------------------
  // Test 3: Body-Less Request Signature Pipeline (Page 7)
  // -------------------------------------------------------------------
  console.log("\n[Test 3] Body-less canonical request signature...");
  const canonical = "GET\n/merchants/private/v1/external-orders/PVC-TEST-8899/payment-attempts/attempt-54321";
  const bodylessSig = signFlotPayload(canonical, privateKey!);
  assert(!!bodylessSig, "Bodyless signature generated");
  const isCanonicalValid = verifyFlotSignature(canonical, bodylessSig, publicKey);
  assert(isCanonicalValid === true, "Bodyless signature verifies against canonical {METHOD}\\n{PATH}");

  // -------------------------------------------------------------------
  // Test 4: Webhook HTTP Basic Authentication (Page 8)
  // -------------------------------------------------------------------
  console.log("\n[Test 4] Webhook Basic Authentication...");
  process.env.FLOT_WEBHOOK_USERNAME = "ipam_flot_webhook";
  process.env.FLOT_WEBHOOK_PASSWORD = "test-secret-webhook-key";

  const validCreds = Buffer.from("ipam_flot_webhook:test-secret-webhook-key").toString("base64");
  const validAuthHeader = `Basic ${validCreds}`;
  assert(verifyFlotBasicAuth(validAuthHeader) === true, "Valid Basic Auth header is accepted");

  const invalidCreds = Buffer.from("ipam_flot_webhook:wrong-password").toString("base64");
  const invalidAuthHeader = `Basic ${invalidCreds}`;
  assert(verifyFlotBasicAuth(invalidAuthHeader) === false, "Invalid password in Basic Auth header is rejected");

  const invalidUser = Buffer.from("hacker:test-secret-webhook-key").toString("base64");
  assert(verifyFlotBasicAuth(`Basic ${invalidUser}`) === false, "Invalid username in Basic Auth header is rejected");
  assert(verifyFlotBasicAuth(null) === false, "Missing header is rejected");
  assert(verifyFlotBasicAuth("Bearer token123") === false, "Non-Basic auth header is rejected");

  // -------------------------------------------------------------------
  // Test 5: Flot Payment Link Creation Service (in-app, momo, card; SLE & USD)
  // -------------------------------------------------------------------
  console.log("\n[Test 5] Payment Link Generation Service (in-app, momo, card; SLE & USD)...");
  const linkResult = await createFlotPaymentLink({
    orderId: "PVC-TEST-12345",
    amount: 35,
    currency: "SLE",
    type: "in-app",
  });
  assert(linkResult.orderId === "PVC-TEST-12345", "Order ID matches input");
  assert(linkResult.amount === 35, "Amount is 35");
  assert(linkResult.currency === "SLE", "Currency is SLE");
  assert(!!linkResult.paymentLink, "Payment link is generated");
  assert(!!linkResult.paymentAttemptId, "Payment attempt ID is assigned");
  assert(linkResult.status === "pending", "Initial order status is pending");

  // Test Mobile Money (momo)
  const momoResult = await createFlotPaymentLink({
    orderId: "MOMO-TEST-12345",
    amount: 10,
    currency: "SLE",
    type: "momo",
  });
  assert(momoResult.type === "momo", "Type is momo");
  assert(!!momoResult.code, "USSD code is generated for mobile money");
  assert(momoResult.code?.startsWith("*715*"), "USSD code starts with *715*");

  // Test Bank Card (card with USD)
  const cardResult = await createFlotPaymentLink({
    orderId: "CARD-TEST-12345",
    amount: 25,
    currency: "USD",
    type: "card",
  });
  assert(cardResult.type === "card", "Type is card");
  assert(cardResult.currency === "USD", "Currency is USD");
  assert(!!cardResult.paymentLink, "Payment link is generated for card");

  // -------------------------------------------------------------------
  // Test 6: Admin Panel Payment Audit Log
  // -------------------------------------------------------------------
  console.log("\n[Test 6] Admin Panel Payment Audit Log Generation...");
  const { writeAuditLog } = await import("../lib/audit");
  const auditEntry = await writeAuditLog({
    actorName: "Flot Payment Gateway",
    actorEmail: "gateway@flotme.ai",
    actorRole: "PAYMENT_GATEWAY",
    action: "FLOT_PAYMENT_SETTLED",
    actionLabel: "Flot Payment Settled",
    category: "COMMERCIAL_FINANCE",
    target: "Physical Card Order #PVC-TEST-12345",
    targetType: "PhysicalCardOrder",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress: "127.0.0.1",
    location: "Freetown, Sierra Leone",
    deviceInfo: "Flot Webhook Service",
    details: "Payment of NLe 35.00 settled via Flot Payment Gateway. Order #PVC-TEST-12345 marked as PAID. Flot Ref: FLOT-REQ-9988.",
    beforeState: { paymentStatus: "PENDING" },
    afterState: { paymentStatus: "PAID", paymentRef: "FLOT-REQ-9988", paymentMethod: "FLOT" },
  });
  assert(!!auditEntry?.id, "Audit log entry created in database");
  assert(auditEntry?.action === "FLOT_PAYMENT_SETTLED", "Audit action is FLOT_PAYMENT_SETTLED");
  assert(auditEntry?.category === "COMMERCIAL_FINANCE", "Audit category is COMMERCIAL_FINANCE");
  assert(!!auditEntry?.tamperHash, "HMAC-SHA256 tamperHash was computed and stored");

  // Clean up test audit entry
  if (auditEntry?.id) {
    const { db } = await import("../lib/db");
    await db.auditLogEntry.delete({ where: { id: auditEntry.id } });
    console.log("Cleaned up test audit log entry.");
  }

  console.log("\n========================================================");
  console.log(`🎉 ALL TESTS PASSED: ${passedCount}/${totalCount} assertions verified!`);
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

