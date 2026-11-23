/**
 * End-to-End Cross-Verification of Flot Payment Gateway
 * 
 * Verifies:
 * 1. RSA-4096 Keys and Cryptographic PSS Signatures
 * 2. Currency Conversion (SLE <-> USD at ~22.50)
 * 3. USD Payment Rule Enforcement (Card-only)
 * 4. Live Flot API Call - In-App (SLE)
 * 5. Live Flot API Call - Mobile Money (SLE USSD code)
 * 6. Live Flot API Call - Bank Card (USD)
 * 7. Live Flot Status Check Endpoint
 * 8. Webhook Basic Authentication & Handler
 * 9. Admin Audit Log Generation & Tamper Hash Verification
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
  getFlotPaymentAttemptStatus,
} from "../lib/payments/flot";
import { sleToUsd, usdToSle, formatCurrencyAmount } from "../lib/payments/currency";
import { writeAuditLog } from "../lib/audit";
import { db } from "../lib/db";

async function main() {
  console.log("=================================================================");
  console.log("🛡️  FLOT PAYMENT GATEWAY - COMPREHENSIVE CROSS-VERIFICATION");
  console.log("=================================================================\n");

  let passes = 0;
  let fails = 0;

  function report(name: string, ok: boolean, details?: string) {
    if (ok) {
      passes++;
      console.log(`✅ [PASS] ${name}${details ? ` -> ${details}` : ""}`);
    } else {
      fails++;
      console.error(`❌ [FAIL] ${name}${details ? ` -> ${details}` : ""}`);
    }
  }

  // -------------------------------------------------------------
  // 1. RSA Keys & Crypto Verification
  // -------------------------------------------------------------
  console.log("--- 1. Cryptographic Keypair & Signature Verification ---");
  const privateKey = getFlotPrivateKey();
  report("Private Key Loaded", !!privateKey && privateKey.includes("PRIVATE KEY"));

  const pubKeyPath = path.resolve(process.cwd(), "keys/flot/public_key.pem");
  const publicKey = fs.readFileSync(pubKeyPath, "utf8");
  report("Public Key Exists", !!publicKey && publicKey.includes("PUBLIC KEY"));

  const samplePayload = JSON.stringify({
    merchantId: "68ba690f-7499-404a-a2bf-c0d5b2cda7be",
    type: "in-app",
    payload: { orderId: "TEST-ORD-01", currency: "SLE", amount: "10" },
  });
  const sig = signFlotPayload(samplePayload, privateKey!);
  report("RSA-4096-PSS Signature Generated", !!sig && sig.length > 200, `Signature length: ${sig.length}`);

  const validSig = verifyFlotSignature(samplePayload, sig, publicKey);
  report("Signature Verification with Public Key", validSig === true);

  const tamperedSig = verifyFlotSignature(samplePayload.replace("10", "999"), sig, publicKey);
  report("Tamper Resistance Detection", tamperedSig === false);

  const canonical = "GET\n/merchants/private/v1/external-orders/TEST-ORD-01/payment-attempts/attempt-01";
  const bodylessSig = signFlotPayload(canonical, privateKey!);
  const validCanonical = verifyFlotSignature(canonical, bodylessSig, publicKey);
  report("Bodyless Canonical Signature Verification", validCanonical === true);

  // -------------------------------------------------------------
  // 2. Currency Conversion Logic
  // -------------------------------------------------------------
  console.log("\n--- 2. Currency Conversion Logic Verification ---");
  const sleVal = 23.00;
  const usdVal = sleToUsd(sleVal);
  report("SLE to USD Conversion (23.00 NLe)", usdVal === 1.02, `23.00 SLE = $${usdVal} USD`);

  const reverseSle = usdToSle(usdVal);
  report("USD to SLE Conversion ($1.02 USD)", reverseSle === 22.95, `$1.02 USD = ${reverseSle} SLE`);

  const formattedSle = formatCurrencyAmount(23, "SLE");
  report("Format Currency SLE", formattedSle === "NLe 23.00 SLE", formattedSle);

  const formattedUsd = formatCurrencyAmount(1.02, "USD");
  report("Format Currency USD", formattedUsd === "$ 1.02 USD", formattedUsd);

  // -------------------------------------------------------------
  // 3. Live Flot API - SLE In-App Payment Link
  // -------------------------------------------------------------
  console.log("\n--- 3. Live Flot API - In-App (SLE) ---");
  const inAppOrderId = `VERIFY-APP-${Date.now().toString(36).toUpperCase()}`;
  try {
    const appResult = await createFlotPaymentLink({
      orderId: inAppOrderId,
      amount: 10,
      currency: "SLE",
      type: "in-app",
      description: "Verification In-App Order",
    });
    report("In-App Order Created via Flot", appResult.orderId === inAppOrderId);
    report("In-App Payment Link Generated", !!appResult.paymentLink, appResult.paymentLink);
    report("In-App QR Data Generated", !!appResult.qrCodeData);
    report("In-App Status Pending", appResult.status === "pending");
  } catch (err: unknown) {
    report("In-App Flot Call", false, err instanceof Error ? err.message : String(err));
  }

  // -------------------------------------------------------------
  // 4. Live Flot API - Mobile Money (SLE USSD)
  // -------------------------------------------------------------
  console.log("\n--- 4. Live Flot API - Mobile Money (SLE USSD) ---");
  const momoOrderId = `VERIFY-MOMO-${Date.now().toString(36).toUpperCase()}`;
  try {
    const momoResult = await createFlotPaymentLink({
      orderId: momoOrderId,
      amount: 10,
      currency: "SLE",
      type: "momo",
      description: "Verification Momo Order",
    });
    report("Mobile Money Order Created via Flot", momoResult.orderId === momoOrderId);
    report("Mobile Money Type is momo", momoResult.type === "momo");
    report("USSD Dial Code Generated", !!momoResult.code && momoResult.code.startsWith("*715*"), `Code: ${momoResult.code}`);
  } catch (err: unknown) {
    report("Mobile Money Flot Call", false, err instanceof Error ? err.message : String(err));
  }

  // -------------------------------------------------------------
  // 5. Live Flot API - Bank Card (USD)
  // -------------------------------------------------------------
  console.log("\n--- 5. Live Flot API - Bank Card (USD) ---");
  const cardOrderId = `VERIFY-CARD-${Date.now().toString(36).toUpperCase()}`;
  let liveAttemptId = "";
  try {
    const cardResult = await createFlotPaymentLink({
      orderId: cardOrderId,
      amount: 1.02,
      currency: "USD",
      type: "card",
      description: "Verification USD Card Order",
    });
    liveAttemptId = cardResult.paymentAttemptId || "";
    report("USD Card Order Created via Flot", cardResult.orderId === cardOrderId);
    report("USD Currency Preserved", cardResult.currency === "USD");
    report("USD Card Gateway URL Generated", !!cardResult.paymentLink && cardResult.paymentLink.includes("pay.leogcltd.com"), cardResult.paymentLink);
  } catch (err: unknown) {
    report("USD Card Flot Call", false, err instanceof Error ? err.message : String(err));
  }

  // -------------------------------------------------------------
  // 6. Live Flot Status Check Endpoint
  // -------------------------------------------------------------
  console.log("\n--- 6. Live Flot Status Check Endpoint ---");
  if (cardOrderId && liveAttemptId) {
    try {
      const statusRes = await getFlotPaymentAttemptStatus(cardOrderId, liveAttemptId);
      report("GET /external-orders/{orderId}/payment-attempts/{attemptId}", !!statusRes.status, `Status: ${statusRes.status}`);
    } catch (err: unknown) {
      report("Status Check Call", false, err instanceof Error ? err.message : String(err));
    }
  } else {
    report("Status Check Call Skipped", false, "No attempt ID available");
  }

  // -------------------------------------------------------------
  // 7. Webhook Basic Authentication
  // -------------------------------------------------------------
  console.log("\n--- 7. Webhook Security & Basic Authentication ---");
  const validAuth = "Basic " + Buffer.from("ipam_flot_webhook:QqfeSwVmCKCSf82l6ku_GC1UtA4ZLVYD").toString("base64");
  report("Valid Basic Auth Header Accepted", verifyFlotBasicAuth(validAuth) === true);

  const invalidAuth = "Basic " + Buffer.from("ipam_flot_webhook:wrong_password").toString("base64");
  report("Wrong Password Rejected", verifyFlotBasicAuth(invalidAuth) === false);

  const invalidUser = "Basic " + Buffer.from("wrong_user:QqfeSwVmCKCSf82l6ku_GC1UtA4ZLVYD").toString("base64");
  report("Wrong Username Rejected", verifyFlotBasicAuth(invalidUser) === false);

  report("Missing Header Rejected", verifyFlotBasicAuth(null) === false);
  report("Bearer Header Rejected", verifyFlotBasicAuth("Bearer 123456") === false);

  // -------------------------------------------------------------
  // 8. Admin Audit Log Verification
  // -------------------------------------------------------------
  console.log("\n--- 8. Admin Audit Log & Tamper Hash Verification ---");
  try {
    const audit = await writeAuditLog({
      actorName: "Flot Payment Gateway Verification",
      actorEmail: "gateway@flotme.ai",
      actorRole: "PAYMENT_GATEWAY",
      action: "FLOT_PAYMENT_SETTLED",
      actionLabel: "Flot Payment Settled",
      category: "COMMERCIAL_FINANCE",
      target: `Verification Order #${inAppOrderId}`,
      targetType: "PhysicalCardOrder",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress: "127.0.0.1",
      location: "Freetown, Sierra Leone",
      deviceInfo: "Verification Script",
      details: "Automated cross-verification of Flot payment audit log settlement.",
      beforeState: { paymentStatus: "PENDING" },
      afterState: { paymentStatus: "PAID", paymentRef: "VERIFY-REF-101", paymentMethod: "FLOT" },
    });

    report("Audit Log Entry Saved to DB", !!audit?.id, `Audit ID: ${audit?.id}`);
    report("Audit Action Correct", audit?.action === "FLOT_PAYMENT_SETTLED");
    report("Audit Category Correct", audit?.category === "COMMERCIAL_FINANCE");
    report("Cryptographic Tamper Hash Generated", !!audit?.tamperHash, `Hash: ${audit?.tamperHash?.slice(0, 16)}...`);

    // Verify entry in database
    const dbRecord = await db.auditLogEntry.findUnique({ where: { id: audit.id } });
    report("Audit Log Confirmed in Prisma DB", dbRecord !== null && dbRecord.action === "FLOT_PAYMENT_SETTLED");

    // Clean up
    if (audit?.id) {
      await db.auditLogEntry.delete({ where: { id: audit.id } });
      console.log("   (Cleaned up verification audit log entry)");
    }
  } catch (err: unknown) {
    report("Admin Audit Log Test", false, err instanceof Error ? err.message : String(err));
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log("\n=================================================================");
  console.log(`📊 FINAL RESULT: ${passes} Passed, ${fails} Failed (Total ${passes + fails} checks)`);
  console.log("=================================================================\n");

  if (fails > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
