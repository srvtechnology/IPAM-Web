/**
 * Automated Test Suite: Auth State Management & Login / Logout Robustness
 * Tests alumni & admin authentication APIs, session cookie management, and payload structures.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log("==================================================================");
  console.log("Starting Auth State Management Robustness Test Suite");
  console.log("==================================================================");

  // 1. Alumni login with valid credentials
  console.log("\n[Test 1] Alumni Login with Valid Credentials");
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
      rememberMe: true,
    }),
  });

  if (alumniLoginRes.status !== 200) {
    throw new Error(`Alumni login failed with status ${alumniLoginRes.status}`);
  }

  const alumniLoginJson = await alumniLoginRes.json();
  const userData = alumniLoginJson.data || alumniLoginJson;

  if (!userData || !userData.id || !userData.email) {
    throw new Error("Alumni login did not return user object with id and email");
  }

  if (typeof userData.savedJobsCount !== "number") {
    throw new Error(`Alumni login payload missing savedJobsCount number: got ${userData.savedJobsCount}`);
  }

  if (!userData.profile || !userData.profile.name) {
    throw new Error("Alumni login payload missing profile object with name");
  }

  const alumniCookie = alumniLoginRes.headers.get("set-cookie");
  if (!alumniCookie || !alumniCookie.includes("ipam_alumni_session")) {
    throw new Error("Alumni login did not set ipam_alumni_session cookie");
  }
  console.log("✅ [Test 1 Passed] Alumni login returned full session object with profile and savedJobsCount.");

  // Extract session token
  const alumniCookieMatch = alumniCookie.match(/ipam_alumni_session=([^;]+)/);
  const alumniCookieHeader = `ipam_alumni_session=${alumniCookieMatch[1]}`;

  // 2. Fetch /api/auth/alumni/me with session cookie
  console.log("\n[Test 2] Query /api/auth/alumni/me with Session Cookie");
  const meRes = await fetch(`${BASE_URL}/api/auth/alumni/me`, {
    headers: { Cookie: alumniCookieHeader },
  });

  if (meRes.status !== 200) {
    throw new Error(`/api/auth/alumni/me failed with status ${meRes.status}`);
  }

  const meJson = await meRes.json();
  const meUser = meJson.data || meJson;

  if (meUser.id !== userData.id || meUser.email !== userData.email) {
    throw new Error("Session mismatch between login and me endpoint");
  }

  if (typeof meUser.savedJobsCount !== "number") {
    throw new Error("Me endpoint missing savedJobsCount");
  }
  console.log("✅ [Test 2 Passed] /api/auth/alumni/me verifies authenticated state and returns consistent data.");

  // 3. Alumni logout
  console.log("\n[Test 3] Alumni Logout");
  const alumniLogoutRes = await fetch(`${BASE_URL}/api/auth/alumni/logout`, {
    method: "POST",
    headers: { Cookie: alumniCookieHeader },
  });

  if (alumniLogoutRes.status !== 200) {
    throw new Error(`Alumni logout failed with status ${alumniLogoutRes.status}`);
  }

  const clearedCookie = alumniLogoutRes.headers.get("set-cookie") || "";
  // Check that cookie was cleared (max-age=0 or empty)
  if (!clearedCookie.includes("ipam_alumni_session=") || (!clearedCookie.includes("Max-Age=0") && !clearedCookie.includes("max-age=0"))) {
    throw new Error("Logout response did not clear session cookie");
  }
  console.log("✅ [Test 3 Passed] Alumni logout properly clears the session cookie.");

  // 4. Query /api/auth/alumni/me without session (or with cleared cookie)
  console.log("\n[Test 4] Query /api/auth/alumni/me Unauthenticated");
  const meUnauthRes = await fetch(`${BASE_URL}/api/auth/alumni/me`);
  if (meUnauthRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated /api/auth/alumni/me, got ${meUnauthRes.status}`);
  }
  console.log("✅ [Test 4 Passed] /api/auth/alumni/me correctly returns 401 when logged out.");

  // 5. Admin Login
  console.log("\n[Test 5] Admin Login");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });

  if (adminLoginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${adminLoginRes.status}`);
  }

  const adminCookie = adminLoginRes.headers.get("set-cookie");
  if (!adminCookie || !adminCookie.includes("ipam_admin_session")) {
    throw new Error("Admin login did not set ipam_admin_session cookie");
  }

  const adminCookieMatch = adminCookie.match(/ipam_admin_session=([^;]+)/);
  const adminCookieHeader = `ipam_admin_session=${adminCookieMatch[1]}`;
  console.log("✅ [Test 5 Passed] Admin login successfully sets ipam_admin_session cookie.");

  // 6. Query admin protected endpoint with cookie
  console.log("\n[Test 6] Admin Protected Endpoint Access");
  const adminDirectoryRes = await fetch(`${BASE_URL}/api/admin/directory`, {
    headers: { Cookie: adminCookieHeader },
  });

  if (adminDirectoryRes.status !== 200) {
    throw new Error(`Admin directory access failed with status ${adminDirectoryRes.status}`);
  }
  console.log("✅ [Test 6 Passed] Admin session cookie successfully authenticates admin API access.");

  // 7. Admin Logout
  console.log("\n[Test 7] Admin Logout");
  const adminLogoutRes = await fetch(`${BASE_URL}/api/auth/admin/logout`, {
    method: "POST",
    headers: { Cookie: adminCookieHeader },
  });

  if (adminLogoutRes.status !== 200) {
    throw new Error(`Admin logout failed with status ${adminLogoutRes.status}`);
  }

  const adminClearedCookie = adminLogoutRes.headers.get("set-cookie") || "";
  if (!adminClearedCookie.includes("ipam_admin_session=") || (!adminClearedCookie.includes("Max-Age=0") && !adminClearedCookie.includes("max-age=0"))) {
    throw new Error("Admin logout did not clear ipam_admin_session cookie");
  }
  console.log("✅ [Test 7 Passed] Admin logout properly clears ipam_admin_session cookie.");

  console.log("\n==================================================================");
  console.log("🎉 ALL AUTH STATE ROBUSTNESS TESTS PASSED (7/7)");
  console.log("==================================================================");
}

run().catch((err) => {
  console.error("\n❌ Test Suite Failed:", err);
  process.exit(1);
});
