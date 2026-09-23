/**
 * End-to-End Test Suite: Alumni Registration, 2FA (OTP 123456), Admin Approval/Rejection Workflow,
 * Re-submission, and Directory State Transitions.
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestContext {
  adminCookie?: string;
  testEmail: string;
  testStudentId: string;
  testPassword: string;
  recordId?: string;
}

const ctx: TestContext = {
  testEmail: `alumni_test_${Date.now()}@ipam.edu`,
  testStudentId: `REG-${Date.now().toString().slice(-6)}`,
  testPassword: "SecurePassword123!",
};

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
  console.log(`\n======================================================`);
  console.log(`🚀 Starting End-to-End Auth & Directory Workflow Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Test User: ${ctx.testEmail} (${ctx.testStudentId})`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // Test 1: Register with Invalid 2FA OTP
  // -------------------------------------------------------------------------
  console.log(`[Test 1] Registration with invalid OTP...`);
  const res1 = await fetch(`${BASE_URL}/api/auth/alumni/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Test Graduate",
      email: ctx.testEmail,
      studentId: ctx.testStudentId,
      password: ctx.testPassword,
      classYear: 2024,
      degree: "B.Sc. Information Technology",
      major: "Software Systems",
      currentRole: "Associate Developer",
      company: "Tech Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Technology",
      otp: "999999", // Invalid OTP!
    }),
  });
  const json1 = await res1.json();
  assert(res1.status === 400, `Expected HTTP 400 for invalid OTP, received ${res1.status}`);
  assert(json1.error?.includes("OTP") || json1.error?.includes("123456"), `Expected error mentioning OTP, got: ${json1.error}`);

  // -------------------------------------------------------------------------
  // Test 2: Register with Correct Default 2FA OTP (123456)
  // -------------------------------------------------------------------------
  console.log(`\n[Test 2] Registration with correct default OTP 123456...`);
  const res2 = await fetch(`${BASE_URL}/api/auth/alumni/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Test Graduate",
      email: ctx.testEmail,
      studentId: ctx.testStudentId,
      password: ctx.testPassword,
      classYear: 2024,
      degree: "B.Sc. Information Technology",
      major: "Software Systems",
      currentRole: "Associate Developer",
      company: "Tech Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Technology",
      otp: "123456", // Default OTP!
    }),
  });
  const json2 = await res2.json();
  const setCookie2 = res2.headers.get("set-cookie") || "";
  assert(res2.status === 201, `Expected HTTP 201 for valid registration, received ${res2.status}`);
  assert(json2.data?.status === "PENDING", `Expected status PENDING, received ${json2.data?.status}`);
  assert(
    !setCookie2.includes("ipam_alumni_session"),
    `Expected NO active alumni session cookie issued before admin approval`
  );

  // -------------------------------------------------------------------------
  // Test 3: Attempt Login with Pending Account
  // -------------------------------------------------------------------------
  console.log(`\n[Test 3] Attempting login with PENDING account...`);
  const res3 = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.testEmail,
      password: ctx.testPassword,
    }),
  });
  const json3 = await res3.json();
  assert(res3.status === 403, `Expected HTTP 403 Forbidden for pending user login, received ${res3.status}`);
  assert(json3.status === "PENDING", `Expected json.status === "PENDING", got: ${json3.status}`);

  // -------------------------------------------------------------------------
  // Test 4: Admin Login & Find User in Directory
  // -------------------------------------------------------------------------
  console.log(`\n[Test 4] Admin login & querying directory...`);
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(adminLoginRes.status === 200, `Admin login should succeed with 200, got: ${adminLoginRes.status}`);
  const adminCookieHeader = adminLoginRes.headers.get("set-cookie") || "";
  const adminCookieMatch = adminCookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(adminCookieMatch), `Admin cookie ipam_admin_session should be set`);
  ctx.adminCookie = `ipam_admin_session=${adminCookieMatch![1]}`;

  const directoryRes = await fetch(`${BASE_URL}/api/admin/directory`, {
    headers: { Cookie: ctx.adminCookie },
  });
  const directoryJson = await directoryRes.json();
  assert(directoryRes.status === 200, `Admin directory list should return 200`);
  const found = directoryJson.data?.find((r: { email: string }) => r.email === ctx.testEmail);
  assert(Boolean(found), `Newly registered user should be in directory list`);
  assert(found.status === "PENDING", `User in directory should have status PENDING, got: ${found.status}`);
  ctx.recordId = found.id;

  // -------------------------------------------------------------------------
  // Test 5: Admin Rejects User with Reason
  // -------------------------------------------------------------------------
  console.log(`\n[Test 5] Admin rejects user with specific reason...`);
  const rejectionReasonText = "Matriculation number REG-9999 could not be cross-referenced with faculty rolls.";
  const rejectRes = await fetch(`${BASE_URL}/api/admin/directory/${ctx.recordId}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: ctx.adminCookie,
    },
    body: JSON.stringify({ rejectionReason: rejectionReasonText }),
  });
  const rejectJson = await rejectRes.json();
  assert(rejectRes.status === 200, `Expected 200 on rejection, received ${rejectRes.status}`);
  assert(rejectJson.data?.status === "REJECTED", `Expected record status REJECTED, got: ${rejectJson.data?.status}`);
  assert(
    rejectJson.data?.rejectionReason === rejectionReasonText,
    `Expected rejectionReason to match, got: ${rejectJson.data?.rejectionReason}`
  );

  // -------------------------------------------------------------------------
  // Test 6: User Attempts Login While REJECTED
  // -------------------------------------------------------------------------
  console.log(`\n[Test 6] User attempts login while REJECTED...`);
  const res6 = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.testEmail,
      password: ctx.testPassword,
    }),
  });
  const json6 = await res6.json();
  assert(res6.status === 403, `Expected HTTP 403 Forbidden for rejected user, received ${res6.status}`);
  assert(json6.status === "REJECTED", `Expected json.status === "REJECTED", got: ${json6.status}`);
  assert(
    json6.rejectionReason === rejectionReasonText,
    `Expected exact rejectionReason received on login, got: ${json6.rejectionReason}`
  );
  assert(json6.canResubmit === true, `Expected canResubmit === true`);

  // -------------------------------------------------------------------------
  // Test 7: Fetch Resubmit Profile Info
  // -------------------------------------------------------------------------
  console.log(`\n[Test 7] Fetching re-submission info for rejected user...`);
  const res7 = await fetch(`${BASE_URL}/api/auth/alumni/resubmit-info?email=${encodeURIComponent(ctx.testEmail)}`);
  const json7 = await res7.json();
  assert(res7.status === 200, `Expected 200 from resubmit-info endpoint`);
  assert(json7.data?.isRejected === true, `Expected isRejected === true`);
  assert(json7.data?.rejectionReason === rejectionReasonText, `Expected rejectionReason in resubmit data`);
  assert(json7.data?.studentId === ctx.testStudentId, `Expected studentId preserved in resubmit data`);

  // -------------------------------------------------------------------------
  // Test 8: User Re-submits Registration with Corrected Info + OTP 123456
  // -------------------------------------------------------------------------
  console.log(`\n[Test 8] User re-submits registration with corrected info...`);
  const res8 = await fetch(`${BASE_URL}/api/auth/alumni/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "E2E Test Graduate (Updated)",
      email: ctx.testEmail,
      studentId: `${ctx.testStudentId}-FIXED`,
      password: ctx.testPassword,
      classYear: 2024,
      degree: "B.Sc. Information Technology",
      major: "Software Engineering & Data",
      currentRole: "Lead Engineer",
      company: "Apex Global Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Technology",
      otp: "123456",
      isResubmission: true,
    }),
  });
  const json8 = await res8.json();
  assert(res8.status === 200 || res8.status === 201, `Expected 200/201 on re-submission, received ${res8.status}`);
  assert(json8.status === "PENDING" || json8.data?.status === "PENDING", `Expected status to revert to PENDING`);

  // -------------------------------------------------------------------------
  // Test 9: Verify Login is Blocked While Pending Re-evaluation
  // -------------------------------------------------------------------------
  console.log(`\n[Test 9] Verifying user login is blocked while pending re-evaluation...`);
  const res9 = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.testEmail,
      password: ctx.testPassword,
    }),
  });
  const json9 = await res9.json();
  assert(res9.status === 403, `Expected 403 while pending re-evaluation, got: ${res9.status}`);
  assert(json9.status === "PENDING", `Expected status PENDING`);

  // -------------------------------------------------------------------------
  // Test 10: Admin Approves User
  // -------------------------------------------------------------------------
  console.log(`\n[Test 10] Admin approves the re-submitted user...`);
  const approveRes = await fetch(`${BASE_URL}/api/admin/directory/${ctx.recordId}/approve`, {
    method: "PATCH",
    headers: { Cookie: ctx.adminCookie },
  });
  const approveJson = await approveRes.json();
  assert(approveRes.status === 200, `Expected 200 on approve, received ${approveRes.status}`);
  assert(approveJson.data?.status === "APPROVED", `Expected status APPROVED, got: ${approveJson.data?.status}`);
  assert(approveJson.data?.rejectionReason === null, `Expected rejectionReason to be cleared on approval`);

  // -------------------------------------------------------------------------
  // Test 11: User Login Successfully When APPROVED
  // -------------------------------------------------------------------------
  console.log(`\n[Test 11] User logs in after approval...`);
  const loginApprovedRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.testEmail,
      password: ctx.testPassword,
    }),
  });
  const loginApprovedJson = await loginApprovedRes.json();
  const alumniCookieHeader = loginApprovedRes.headers.get("set-cookie") || "";
  assert(loginApprovedRes.status === 200, `Expected 200 for approved user login, received ${loginApprovedRes.status}`);
  assert(
    alumniCookieHeader.includes("ipam_alumni_session"),
    `Expected valid ipam_alumni_session cookie set on approved login`
  );
  assert(loginApprovedJson.data?.email === ctx.testEmail, `Expected user profile returned on login`);

  // -------------------------------------------------------------------------
  // Test 12: Admin Marks User as Pending
  // -------------------------------------------------------------------------
  console.log(`\n[Test 12] Admin marks user as PENDING...`);
  const pendingRes = await fetch(`${BASE_URL}/api/admin/directory/${ctx.recordId}/pending`, {
    method: "PATCH",
    headers: { Cookie: ctx.adminCookie },
  });
  const pendingJson = await pendingRes.json();
  assert(pendingRes.status === 200, `Expected 200 on mark pending, received ${pendingRes.status}`);
  assert(pendingJson.data?.status === "PENDING", `Expected status PENDING, got: ${pendingJson.data?.status}`);

  // -------------------------------------------------------------------------
  // Test 13: User Login is Blocked Again When Marked Pending
  // -------------------------------------------------------------------------
  console.log(`\n[Test 13] User login is blocked again after marked pending...`);
  const res13 = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: ctx.testEmail,
      password: ctx.testPassword,
    }),
  });
  const json13 = await res13.json();
  assert(res13.status === 403, `Expected 403 when marked pending, got: ${res13.status}`);
  assert(json13.status === "PENDING", `Expected status PENDING on blocked login`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedCount}/${totalCount} TEST CASES PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("\n💥 End-to-End Test Suite Failed with Error:\n", err);
  process.exit(1);
});
