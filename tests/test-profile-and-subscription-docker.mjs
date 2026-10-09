// End-to-End Test Suite for Profile Management (Base64 avatar) and Subscription Management
// Running against Docker container at http://localhost:3000

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// A small valid 1x1 PNG base64 data URI for testing
const SAMPLE_BASE64_AVATAR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`Starting E2E Tests on Docker app: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let cookieHeader = "";

  // 1. Alumni Login
  console.log("▶ [Test 1] Authenticating as demo alumni (demo.alumni@ipam.edu)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!loginRes.ok) {
    const errText = await loginRes.text();
    throw new Error(`Login failed (${loginRes.status}): ${errText}`);
  }

  const rawCookies = loginRes.headers.get("set-cookie");
  if (!rawCookies) {
    throw new Error("No set-cookie header received from login");
  }

  // Extract session token
  const tokenMatch = rawCookies.match(/ipam_alumni_session=([^;]+)/);
  if (!tokenMatch) {
    throw new Error(`Could not find ipam_alumni_session cookie. Cookies were: ${rawCookies}`);
  }
  cookieHeader = `ipam_alumni_session=${tokenMatch[1]}`;
  console.log("✔ Login successful. Cookie established.");

  // 2. Fetch Profile via GET /api/profile
  console.log("\n▶ [Test 2] Fetching profile via GET /api/profile...");
  const getProfileRes = await fetch(`${BASE_URL}/api/profile`, {
    headers: { Cookie: cookieHeader },
  });
  if (!getProfileRes.ok) {
    throw new Error(`GET /api/profile failed: ${getProfileRes.status}`);
  }
  const getProfileJson = await getProfileRes.json();
  const profile = getProfileJson.data?.profile || getProfileJson.data;
  if (!profile) {
    throw new Error(`Unexpected profile response structure: ${JSON.stringify(getProfileJson)}`);
  }
  console.log("✔ Profile fetched successfully:", {
    name: profile.name,
    degree: profile.degree,
    skillsCount: profile.skills?.length,
  });

  // 3. Update Profile & Upload Base64 Avatar via PATCH /api/profile
  console.log("\n▶ [Test 3] Updating profile & uploading Base64 avatar via PATCH /api/profile...");
  const updatePayload = {
    name: "Alhaji Momodu Jalloh (Updated)",
    avatar: SAMPLE_BASE64_AVATAR,
    degree: "BSc Applied Accounting",
    major: "Financial Auditing",
    classYear: 2016,
    currentRole: "Senior Financial Director",
    company: "Bank of Sierra Leone",
    location: "Freetown",
    country: "Sierra Leone",
    industry: "Banking & Financial Services",
    isMentor: true,
    bio: "Passionate alumnus mentoring future leaders in public administration and finance.",
    linkedin: "https://linkedin.com/in/momodu-jalloh-alumni",
    skills: ["Financial Management", "Strategic Governance", "Risk Analysis", "Executive Leadership"],
  };

  const patchProfileRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(updatePayload),
  });

  if (!patchProfileRes.ok) {
    const err = await patchProfileRes.text();
    throw new Error(`PATCH /api/profile failed (${patchProfileRes.status}): ${err}`);
  }

  const patchProfileJson = await patchProfileRes.json();
  const updatedProfile = patchProfileJson.data?.profile || patchProfileJson.data;
  if (!updatedProfile) {
    throw new Error(`Failed to update profile: ${JSON.stringify(patchProfileJson)}`);
  }

  if (updatedProfile.avatar !== SAMPLE_BASE64_AVATAR) {
    throw new Error("Uploaded Base64 avatar does not match expected value!");
  }
  if (updatedProfile.name !== updatePayload.name) {
    throw new Error("Updated name does not match expected value!");
  }
  if (!updatedProfile.skills?.includes("Executive Leadership")) {
    throw new Error("Updated skills does not include new skill!");
  }
  console.log("✔ Profile & Base64 avatar saved and verified!");

  // 4. Fetch Subscriptions via GET /api/subscription
  console.log("\n▶ [Test 4] Fetching subscriptions via GET /api/subscription...");
  const getSubRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { Cookie: cookieHeader },
  });
  if (!getSubRes.ok) {
    throw new Error(`GET /api/subscription failed: ${getSubRes.status}`);
  }
  const getSubJson = await getSubRes.json();
  if (!getSubJson.data) {
    throw new Error(`Invalid subscription response: ${JSON.stringify(getSubJson)}`);
  }
  console.log("✔ Subscription status fetched:", {
    currentTier: getSubJson.data.currentTier,
    availableTiers: Object.keys(getSubJson.data.availableTiers || {}),
    historyCount: getSubJson.data.history?.length,
  });

  // 5. Upgrade Subscription to SILVER_LIFETIME via POST /api/subscription
  console.log("\n▶ [Test 5] Upgrading subscription to SILVER_LIFETIME (ANNUAL)...");
  const upgradeSilverRes = await fetch(`${BASE_URL}/api/subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      tier: "SILVER_LIFETIME",
      billingCycle: "ANNUAL",
      paymentMethod: "CARD",
    }),
  });

  if (!upgradeSilverRes.ok) {
    const err = await upgradeSilverRes.text();
    throw new Error(`Upgrade to SILVER_LIFETIME failed: ${err}`);
  }
  const upgradeSilverJson = await upgradeSilverRes.json();
  const silverTier = upgradeSilverJson.data?.tier || upgradeSilverJson.data?.user?.membershipTier;
  if (silverTier !== "SILVER_LIFETIME") {
    throw new Error(`Expected tier SILVER_LIFETIME, got: ${JSON.stringify(upgradeSilverJson)}`);
  }
  console.log("✔ Upgraded to SILVER_LIFETIME successfully. Valid until:", upgradeSilverJson.data.subscription?.validUntil);

  // 6. Upgrade Subscription to GOLD_PATRON (LIFETIME) via POST /api/subscription
  console.log("\n▶ [Test 6] Upgrading subscription to GOLD_PATRON (LIFETIME)...");
  const upgradeGoldRes = await fetch(`${BASE_URL}/api/subscription`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({
      tier: "GOLD_PATRON",
      billingCycle: "LIFETIME",
      paymentMethod: "STRIPE",
    }),
  });

  if (!upgradeGoldRes.ok) {
    const err = await upgradeGoldRes.text();
    throw new Error(`Upgrade to GOLD_PATRON failed: ${err}`);
  }
  const upgradeGoldJson = await upgradeGoldRes.json();
  const goldTier = upgradeGoldJson.data?.tier || upgradeGoldJson.data?.user?.membershipTier;
  if (goldTier !== "GOLD_PATRON") {
    throw new Error(`Expected tier GOLD_PATRON, got: ${JSON.stringify(upgradeGoldJson)}`);
  }
  console.log("✔ Upgraded to GOLD_PATRON successfully!");

  // 7. Toggle Auto-Renew via PATCH /api/subscription
  console.log("\n▶ [Test 7] Toggling auto-renew to false via PATCH /api/subscription...");
  const patchAutoRenewRes1 = await fetch(`${BASE_URL}/api/subscription`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ autoRenew: false }),
  });
  if (!patchAutoRenewRes1.ok) {
    throw new Error(`PATCH /api/subscription autoRenew=false failed`);
  }
  const patchJson1 = await patchAutoRenewRes1.json();
  if (patchJson1.data.autoRenew !== false) {
    throw new Error(`Expected autoRenew=false, got ${patchJson1.data.autoRenew}`);
  }

  const patchAutoRenewRes2 = await fetch(`${BASE_URL}/api/subscription`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ autoRenew: true }),
  });
  if (!patchAutoRenewRes2.ok) {
    throw new Error(`PATCH /api/subscription autoRenew=true failed`);
  }
  const patchJson2 = await patchAutoRenewRes2.json();
  if (patchJson2.data.autoRenew !== true) {
    throw new Error(`Expected autoRenew=true, got ${patchJson2.data.autoRenew}`);
  }
  console.log("✔ Auto-renew toggle works in both directions!");

  // 8. Verify public pages render
  console.log("\n▶ [Test 8] Checking /profile and /subscription public pages HTTP status...");
  const profilePageRes = await fetch(`${BASE_URL}/profile`, {
    headers: { Cookie: cookieHeader },
  });
  if (profilePageRes.status !== 200) {
    throw new Error(`/profile returned status ${profilePageRes.status}`);
  }
  console.log("✔ /profile returned HTTP 200 OK");

  const subPageRes = await fetch(`${BASE_URL}/subscription`, {
    headers: { Cookie: cookieHeader },
  });
  if (subPageRes.status !== 200) {
    throw new Error(`/subscription returned status ${subPageRes.status}`);
  }
  console.log("✔ /subscription returned HTTP 200 OK");

  // 9. Verify Current Alumni Session Reflects Changes
  console.log("\n▶ [Test 9] Verifying /api/auth/alumni/me reflects updated avatar & GOLD_PATRON tier...");
  const meRes = await fetch(`${BASE_URL}/api/auth/alumni/me`, {
    headers: { Cookie: cookieHeader },
  });
  const meJson = await meRes.json();
  if (meJson.data.membershipTier !== "GOLD_PATRON") {
    throw new Error(`Expected GOLD_PATRON in me endpoint, got: ${meJson.data.membershipTier}`);
  }
  if (!meJson.data.profile?.avatar?.startsWith("data:image/png;base64")) {
    throw new Error("Expected avatar to be present in /api/auth/alumni/me profile");
  }
  console.log("✔ Verified alumni session contains updated tier and base64 avatar!");

  console.log("\n======================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY ON DOCKER APP!");
  console.log("======================================================\n");
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
