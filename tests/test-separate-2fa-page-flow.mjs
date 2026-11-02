// Test suite for Separate 2FA Page Flow
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { verifyOtp, sendOtp, generate2faEmailHtml, TEST_OTP } from "../lib/auth/otp.ts";

async function runTests() {
  console.log("\n========================================================");
  console.log("🔐 Testing Separate 2FA Verification Page Architecture");
  console.log("========================================================\n");

  // 1. Verify existence of separate 2FA page files
  console.log("▶ [Test 1] Verifying separate page route files...");
  const verifyPagePath = path.resolve("app/(public)/register/verify/page.tsx");
  const aliasPagePath = path.resolve("app/(public)/verify-2fa/page.tsx");
  const registerPagePath = path.resolve("app/(public)/register/page.tsx");

  assert(fs.existsSync(verifyPagePath), "app/(public)/register/verify/page.tsx exists");
  assert(fs.existsSync(aliasPagePath), "app/(public)/verify-2fa/page.tsx exists");
  assert(fs.existsSync(registerPagePath), "app/(public)/register/page.tsx exists");

  const verifyPageCode = fs.readFileSync(verifyPagePath, "utf8");
  const registerPageCode = fs.readFileSync(registerPagePath, "utf8");

  // 2. Ensure modal popup is completely removed from /register
  console.log("▶ [Test 2] Ensuring modal popup has been completely removed from /register...");
  assert(!registerPageCode.includes("otpModalOpen"), "No otpModalOpen state in register page");
  assert(!registerPageCode.includes("Two-Factor Authentication Modal"), "No modal comment in register page");
  assert(registerPageCode.includes("router.push(`/register/verify?email="), "Register page redirects to /register/verify");
  console.log("✔ Modal popup completely replaced by navigation to separate page.\n");

  // 3. Verify separate 2FA page has dynamic SMTP guidance and form submission
  console.log("▶ [Test 3] Verifying /register/verify page components...");
  assert(verifyPageCode.includes("Two-Factor Authentication"), "Page renders Two-Factor Authentication heading");
  assert(verifyPageCode.includes("SMTP Security Verification"), "Page displays SMTP Security badge");
  assert(verifyPageCode.includes("Dispatched via SMTP"), "Page indicates code dispatch");
  assert(verifyPageCode.includes("/api/auth/2fa/send-otp"), "Page supports resending dynamic OTP via /api/auth/2fa/send-otp");
  assert(verifyPageCode.includes("/api/auth/alumni/register"), "Page submits registration with verified OTP");
  assert(verifyPageCode.includes("sessionStorage.removeItem"), "Page cleans up sessionStorage draft after completion");
  assert(verifyPageCode.includes("Registration Submitted!"), "Page includes celebration pending review confirmation");
  console.log("✔ Separate 2FA verification page verified with all security controls.\n");

  // 4. Verify alias route /verify-2fa redirects to /register/verify
  console.log("▶ [Test 4] Verifying alias route /verify-2fa...");
  const aliasCode = fs.readFileSync(aliasPagePath, "utf8");
  assert(aliasCode.includes("/register/verify"), "Alias route properly redirects to /register/verify");
  console.log("✔ /verify-2fa redirects smoothly to /register/verify.\n");

  // 5. Verify dynamic OTP enforcement in backend
  console.log("▶ [Test 5] Verifying dynamic OTP enforcement in backend...");
  delete process.env.ALLOW_TEST_OTP;
  const staticBlocked = verifyOtp({
    email: "dynamic.check@example.com",
    code: TEST_OTP,
    purpose: "REGISTRATION",
  });
  assert(staticBlocked.valid === false, "Static code '123456' strictly blocked by default");

  process.env.ALLOW_TEST_OTP = "true";
  const ciAllowed = verifyOtp({
    email: "dynamic.check@example.com",
    code: TEST_OTP,
    purpose: "REGISTRATION",
  });
  assert(ciAllowed.valid === true, "ALLOW_TEST_OTP=true permits test automation");
  delete process.env.ALLOW_TEST_OTP;
  console.log("✔ Dynamic OTP strictly enforced.\n");

  console.log("========================================================");
  console.log("🎉 ALL SEPARATE 2FA PAGE ARCHITECTURE TESTS PASSED!");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});

