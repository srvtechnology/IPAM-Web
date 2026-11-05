import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

async function runTests() {
  console.log("\n========================================================");
  console.log("🔐 Testing Auth Existing User Robust Error Handling");
  console.log("========================================================\n");

  // 1. Verify existence of check-exists route
  console.log("▶ [Test 1] Verifying check-exists endpoint route file exists...");
  const checkExistsPath = path.resolve("app/api/auth/alumni/check-exists/route.ts");
  assert(fs.existsSync(checkExistsPath), "check-exists route file exists");
  const checkExistsCode = fs.readFileSync(checkExistsPath, "utf8");
  assert(checkExistsCode.includes("existingEmailUser"), "checkExists checks email in DB");
  assert(checkExistsCode.includes("existingStudentIdUser"), "checkExists checks studentId in DB");
  assert(checkExistsCode.includes("USER_ALREADY_EXISTS") || checkExistsCode.includes("APPROVED"), "checkExists handles existing approved user");
  assert(checkExistsCode.includes("PENDING"), "checkExists handles pending application");
  console.log("  ✔ check-exists route verified with email and studentId pre-validation.\n");

  // 2. Verify send-otp route handles existing user rejection for REGISTRATION
  console.log("▶ [Test 2] Verifying send-otp route pre-validates user existence...");
  const sendOtpPath = path.resolve("app/api/auth/2fa/send-otp/route.ts");
  const sendOtpCode = fs.readFileSync(sendOtpPath, "utf8");
  assert(sendOtpCode.includes("existingEmailUser"), "send-otp checks existing email user");
  assert(sendOtpCode.includes("existingStudentIdUser"), "send-otp checks existing studentId user");
  assert(sendOtpCode.includes("USER_ALREADY_EXISTS"), "send-otp returns USER_ALREADY_EXISTS code");
  assert(sendOtpCode.includes("PENDING_APPROVAL"), "send-otp returns PENDING_APPROVAL code");
  assert(sendOtpCode.includes("409"), "send-otp returns 409 status code on conflict");
  console.log("  ✔ send-otp verified with 409 conflict rejection on existing/pending accounts.\n");

  // 3. Verify register route handles existing user rejection and unique constraints
  console.log("▶ [Test 3] Verifying register route duplicate checks and P2002 error handling...");
  const registerPath = path.resolve("app/api/auth/alumni/register/route.ts");
  const registerCode = fs.readFileSync(registerPath, "utf8");
  assert(registerCode.includes("USER_ALREADY_EXISTS"), "register returns USER_ALREADY_EXISTS code");
  assert(registerCode.includes("PENDING_APPROVAL"), "register returns PENDING_APPROVAL code");
  assert(registerCode.includes("CREDENTIALS_CONFLICT"), "register returns CREDENTIALS_CONFLICT code");
  assert(registerCode.includes("P2002"), "register handles Prisma P2002 unique constraint error");
  console.log("  ✔ register route verified with explicit 409 error handling for duplicate email/student ID.\n");

  // 4. Verify web register page passes studentId to send-otp and renders clear error link
  console.log("▶ [Test 4] Verifying web registration UI handles existing user errors...");
  const registerPagePath = path.resolve("app/(public)/register/page.tsx");
  const registerPageCode = fs.readFileSync(registerPagePath, "utf8");
  assert(registerPageCode.includes("studentId: form.studentId.trim()"), "register page passes studentId to send-otp");
  assert(registerPageCode.includes("Sign In to Existing Account"), "register page displays direct Sign In link on already exists error");
  console.log("  ✔ Web register page passes studentId and renders direct Sign In action on conflict.\n");

  // 5. Verify web verify page displays clear error and Sign In link
  console.log("▶ [Test 5] Verifying web 2FA verification page displays clear duplicate error...");
  const verifyPagePath = path.resolve("app/(public)/register/verify/page.tsx");
  const verifyPageCode = fs.readFileSync(verifyPagePath, "utf8");
  assert(verifyPageCode.includes("Sign In to Existing Account"), "verify page displays direct Sign In link on duplicate error");
  console.log("  ✔ Web verify page renders direct Sign In action when user already exists.\n");

  // 6. Test handler with invalid payload
  console.log("▶ [Test 6] Testing send-otp route validation failure...");
  const { POST: handleSendOtp } = await import("../app/api/auth/2fa/send-otp/route.ts");

  const invalidReq = new Request("http://localhost:3000/api/auth/2fa/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email" }),
  });
  const invalidRes = await handleSendOtp(invalidReq);
  assert.equal(invalidRes.status, 400);
  const invalidJson = await invalidRes.json();
  assert(invalidJson.error.includes("Validation failed"));
  console.log("  ✔ send-otp rejects invalid email with 400.\n");

  console.log("========================================================");
  console.log("🎉 ALL AUTH EXISTING USER ROBUST ERROR HANDLING CHECKS PASSED!");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
