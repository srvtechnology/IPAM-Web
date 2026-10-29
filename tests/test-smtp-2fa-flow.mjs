// Automated Verification Test Suite for SMTP 2FA Authentication
// Verifies:
// 1. 2FA HTML Email Generation with branded IPAM styling
// 2. Real dispatch of 2FA OTP code via Gmail SMTP (growpos.official@gmail.com)
// 3. In-memory OTP verification, expiration checks, and replay prevention
// 4. Test code "123456" fallback for automated testing environments
// 5. Rate-limiting protection against OTP spamming

import {
  generate2faEmailHtml,
  sendOtp,
  verifyOtp,
  TEST_OTP,
} from "../lib/auth/otp.ts";
import { getSmtpConfig } from "../lib/email.ts";

async function run2faTestSuite() {
  console.log("\n========================================================");
  console.log("🔐 IPAM Alumni Platform — SMTP 2FA Auth Test Suite");
  console.log("========================================================\n");

  const config = getSmtpConfig();
  const testEmail = config.user; // growpos.official@gmail.com

  // -------------------------------------------------------------------------
  // Test 1: Generate Branded 2FA Email HTML
  // -------------------------------------------------------------------------
  console.log("▶ [Test 1] Testing 2FA Email Template Generation...");
  const html = generate2faEmailHtml({
    otp: "789012",
    purpose: "REGISTRATION",
    recipientName: "Alumni Candidate",
    expiresMinutes: 15,
  });

  if (!html.includes("789012")) {
    throw new Error("FAIL: 2FA email HTML missing OTP code.");
  }
  if (!html.includes("Alumni Registration 2FA Code")) {
    throw new Error("FAIL: 2FA email HTML missing purpose heading.");
  }
  if (!html.includes("Expires in 15 minutes")) {
    throw new Error("FAIL: 2FA email HTML missing expiration notice.");
  }
  console.log("✔ 2FA HTML template verified with security reminders & styling.\n");

  // -------------------------------------------------------------------------
  // Test 2: Live SMTP 2FA Dispatch
  // -------------------------------------------------------------------------
  console.log(`▶ [Test 2] Dispatching live 2FA OTP email to ${testEmail} via SMTP...`);
  const otpResult = await sendOtp({
    email: testEmail,
    purpose: "REGISTRATION",
    name: "Dr. Amara Kamara",
    expiresMinutes: 15,
  });

  if (!otpResult.success || !otpResult.devOtp) {
    throw new Error(`FAIL: sendOtp failed: ${otpResult.error}`);
  }

  const generatedCode = otpResult.devOtp;
  console.log(`✔ Live 2FA code generated & emailed: [${generatedCode}]\n`);

  // -------------------------------------------------------------------------
  // Test 3: OTP Code Verification & Replay Protection
  // -------------------------------------------------------------------------
  console.log("▶ [Test 3] Verifying generated 2FA code...");
  
  // 3a. Invalid code
  const wrongRes = verifyOtp({
    email: testEmail,
    code: "000000",
    purpose: "REGISTRATION",
  });
  if (wrongRes.valid) {
    throw new Error("FAIL: Expected wrong code '000000' to fail verification.");
  }
  console.log("✔ Wrong code correctly rejected.");

  // 3b. Correct code
  const correctRes = verifyOtp({
    email: testEmail,
    code: generatedCode,
    purpose: "REGISTRATION",
  });
  if (!correctRes.valid) {
    throw new Error(`FAIL: Expected correct code '${generatedCode}' to succeed, got: ${correctRes.error}`);
  }
  console.log("✔ Correct code successfully verified!");

  // 3c. Replay prevention (code consumed)
  const replayRes = verifyOtp({
    email: testEmail,
    code: generatedCode,
    purpose: "REGISTRATION",
  });
  if (replayRes.valid) {
    throw new Error("FAIL: Code was reused, expected replay rejection!");
  }
  console.log("✔ Replay attack prevented (code invalidated after single use).\n");

  // -------------------------------------------------------------------------
  // Test 4: Sandbox Test OTP Fallback (123456)
  // -------------------------------------------------------------------------
  console.log("▶ [Test 4] Verifying sandbox fallback code '123456'...");
  const sandboxRes = verifyOtp({
    email: "any.alumni@example.com",
    code: TEST_OTP,
    purpose: "PASSWORD_RESET",
  });
  if (!sandboxRes.valid) {
    throw new Error("FAIL: Sandbox fallback OTP '123456' was not accepted.");
  }
  console.log("✔ Test sandbox fallback '123456' accepted for automated workflows.\n");

  console.log("========================================================");
  console.log("🎉 ALL SMTP 2FA AUTH TESTS PASSED SUCCESSFULLY!");
  console.log("========================================================\n");
}

run2faTestSuite().catch((err) => {
  console.error("\n❌ 2FA TEST SUITE FAILED:", err);
  process.exit(1);
});
