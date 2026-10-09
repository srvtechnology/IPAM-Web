// E2E Test Suite for Dynamic Subscription Management via Admin Panel
// Running against Docker container at http://localhost:3000

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`Starting Dynamic Subscriptions Admin E2E Tests on Docker: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let adminCookie = "";
  let alumniCookie = "";

  // 1. Admin Login
  console.log("▶ [Test 1] Authenticating as Admin (demo.admin@ipam.edu)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!adminLoginRes.ok) {
    throw new Error(`Admin login failed (${adminLoginRes.status}): ${await adminLoginRes.text()}`);
  }

  const adminCookies = adminLoginRes.headers.get("set-cookie");
  const adminTokenMatch = adminCookies?.match(/ipam_admin_session=([^;]+)/);
  if (!adminTokenMatch) {
    throw new Error("Missing ipam_admin_session cookie");
  }
  adminCookie = `ipam_admin_session=${adminTokenMatch[1]}`;
  console.log("✔ Admin authenticated successfully.");

  // 2. Fetch Subscription Plans as Admin
  console.log("\n▶ [Test 2] Fetching subscription plans via GET /api/admin/subscription-plans...");
  const getPlansRes = await fetch(`${BASE_URL}/api/admin/subscription-plans`, {
    headers: { Cookie: adminCookie },
  });

  if (!getPlansRes.ok) {
    throw new Error(`GET /api/admin/subscription-plans failed: ${getPlansRes.status} ${await getPlansRes.text()}`);
  }

  const plansJson = await getPlansRes.json();
  const plans = plansJson.data || plansJson;
  console.log(`✔ Plans fetched successfully (${plans.length} tiers found):`);
  plans.forEach((p) => {
    console.log(`   - [${p.tier}] ${p.name}: Annual=$${p.annualPrice}, Lifetime=$${p.lifetimePrice}, Perks=${p.perks?.length || 0}`);
  });

  if (!plans.some((p) => p.tier === "SILVER_LIFETIME") || !plans.some((p) => p.tier === "GOLD_PATRON")) {
    throw new Error("Missing expected default tiers in database");
  }

  // 3. Update Silver Plan via PATCH /api/admin/subscription-plans/SILVER_LIFETIME
  console.log("\n▶ [Test 3] Modifying Silver Patron tier via PATCH /api/admin/subscription-plans/SILVER_LIFETIME...");
  const updatePayload = {
    name: "Silver Executive Patron (Dynamic)",
    tagline: "Admin Configured Dynamic Tier for Testing",
    annualPrice: 65,
    lifetimePrice: 350,
    monthlyPrice: 0,
    badgeText: "MOST POPULAR",
    perks: [
      "All Standard Alumni Privileges Included",
      "Silver Metallic Virtual Card Pass & Verified Badge",
      "Priority RSVP & Seating at Annual Alumni Conferences",
      "Dynamic Admin Perk: 24/7 Priority Hotline",
    ],
  };

  const patchPlanRes = await fetch(`${BASE_URL}/api/admin/subscription-plans/SILVER_LIFETIME`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(updatePayload),
  });

  if (!patchPlanRes.ok) {
    throw new Error(`PATCH plan failed: ${patchPlanRes.status} ${await patchPlanRes.text()}`);
  }

  const patchedPlanJson = await patchPlanRes.json();
  const patchedPlan = patchedPlanJson.data || patchedPlanJson;
  console.log("✔ Silver plan successfully updated by Admin:", {
    name: patchedPlan.name,
    annualPrice: patchedPlan.annualPrice,
    lifetimePrice: patchedPlan.lifetimePrice,
    badgeText: patchedPlan.badgeText,
    perksCount: patchedPlan.perks?.length,
  });

  if (patchedPlan.annualPrice !== 65 || patchedPlan.lifetimePrice !== 350) {
    throw new Error(`Plan update values mismatch: ${JSON.stringify(patchedPlan)}`);
  }

  // 4. Authenticate as Alumni & verify public portal sees dynamic changes
  console.log("\n▶ [Test 4] Authenticating as Alumni (demo.alumni@ipam.edu)...");
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!alumniLoginRes.ok) {
    throw new Error(`Alumni login failed (${alumniLoginRes.status}): ${await alumniLoginRes.text()}`);
  }

  const alumniCookies = alumniLoginRes.headers.get("set-cookie");
  const alumniTokenMatch = alumniCookies?.match(/ipam_alumni_session=([^;]+)/);
  if (!alumniTokenMatch) {
    throw new Error("Missing ipam_alumni_session cookie");
  }
  alumniCookie = `ipam_alumni_session=${alumniTokenMatch[1]}`;
  console.log("✔ Alumni authenticated.");

  // 5. Fetch Public Subscription Details as Alumni via GET /api/subscription
  console.log("\n▶ [Test 5] Calling GET /api/subscription as Alumni to verify dynamic database values...");
  const getSubRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { Cookie: alumniCookie },
  });

  if (!getSubRes.ok) {
    throw new Error(`GET /api/subscription failed: ${getSubRes.status} ${await getSubRes.text()}`);
  }

  const resJson = await getSubRes.json();
  const resData = resJson.data || resJson;
  const tiersMap = resData.availableTiers || {};
  const dynamicTiers = Array.isArray(tiersMap) ? tiersMap : Object.values(tiersMap);
  console.log(`✔ Received ${dynamicTiers.length} dynamic tiers on Alumni portal:`);

  const dynamicSilver = dynamicTiers.find((t) => t.id === "SILVER_LIFETIME" || t.tier === "SILVER_LIFETIME");
  if (!dynamicSilver) {
    throw new Error("Dynamic Silver tier not returned to alumni");
  }

  console.log("✔ Dynamic Silver Tier on Public Portal:", {
    name: dynamicSilver.name,
    annualPrice: dynamicSilver.annualPrice,
    lifetimePrice: dynamicSilver.lifetimePrice,
    badge: dynamicSilver.badge,
    features: dynamicSilver.features,
  });

  const returnedAnnual = dynamicSilver.annualPrice;
  const returnedLifetime = dynamicSilver.lifetimePrice;
  if (returnedAnnual !== 65 || returnedLifetime !== 350) {
    throw new Error(`Expected updated prices ($65 / $350), but got annual=${returnedAnnual}, lifetime=${returnedLifetime}`);
  }
  console.log("✔ DYNAMIC VERIFICATION CONFIRMED: Alumni portal directly reflects admin panel configuration changes!");

  // 6. Test Admin Subscriptions Directory via GET /api/admin/subscriptions
  console.log("\n▶ [Test 6] Admin query subscriber list via GET /api/admin/subscriptions...");
  const adminSubsRes = await fetch(`${BASE_URL}/api/admin/subscriptions?search=demo.alumni`, {
    headers: { Cookie: adminCookie },
  });

  if (!adminSubsRes.ok) {
    throw new Error(`GET /api/admin/subscriptions failed: ${adminSubsRes.status} ${await adminSubsRes.text()}`);
  }

  const adminSubsJson = await adminSubsRes.json();
  const subscribers = adminSubsJson.data?.subscribers || adminSubsJson.subscribers || [];
  console.log(`✔ Admin retrieved ${subscribers.length} subscriber(s) for query.`);
  if (subscribers.length === 0) {
    throw new Error("Expected to find demo.alumni@ipam.edu in admin subscriber list");
  }
  const alumniSub = subscribers.find((s) => s.email === "demo.alumni@ipam.edu");
  if (!alumniSub) {
    throw new Error("Could not find demo.alumni@ipam.edu in subscribers list");
  }
  console.log("   Current subscriber status:", {
    email: alumniSub.email,
    name: alumniSub.name,
    tier: alumniSub.tier,
    billingCycle: alumniSub.billingCycle,
  });

  // 7. Test Admin Manual Grant via POST /api/admin/subscriptions/grant
  console.log("\n▶ [Test 7] Testing Admin manual grant (Upgrading to GOLD_PATRON Lifetime)...");
  const grantRes = await fetch(`${BASE_URL}/api/admin/subscriptions/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      userId: alumniSub.userId || alumniSub.id,
      tier: "GOLD_PATRON",
      billingCycle: "LIFETIME",
      notes: "Granted courtesy VIP Executive status by Super Administrator via Admin Panel test",
    }),
  });

  if (!grantRes.ok) {
    throw new Error(`POST /api/admin/subscriptions/grant failed: ${grantRes.status} ${await grantRes.text()}`);
  }

  const grantJson = await grantRes.json();
  console.log("✔ Admin manual grant succeeded:", grantJson.message || grantJson.data?.message);

  // 8. Re-check Alumni subscription status via GET /api/subscription
  console.log("\n▶ [Test 8] Confirming Alumni tier updated to GOLD_PATRON...");
  const checkSubRes = await fetch(`${BASE_URL}/api/subscription`, {
    headers: { Cookie: alumniCookie },
  });

  const checkSubJson = await checkSubRes.json();
  const subDataAfterGrant = checkSubJson.data || checkSubJson;
  const currentTier = subDataAfterGrant.currentTier;
  const billingCycle = subDataAfterGrant.billingCycle;
  console.log("✔ Alumni active membership after admin grant:", {
    tier: currentTier,
    billingCycle: billingCycle,
    expiresAt: subDataAfterGrant.membershipValidUntil,
  });

  if (currentTier !== "GOLD_PATRON" || billingCycle !== "LIFETIME") {
    throw new Error(`Expected tier GOLD_PATRON / LIFETIME, got: tier=${currentTier}, billingCycle=${billingCycle}`);
  }

  // 9. Reset Silver plan back to standard defaults
  console.log("\n▶ [Test 9] Resetting Silver plan configuration to clean default state...");
  await fetch(`${BASE_URL}/api/admin/subscription-plans/SILVER_LIFETIME`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      name: "Silver Patron",
      tagline: "Distinguished patron tier for alumni leaders supporting IPAM's endowment and mentoring scholars.",
      annualPrice: 49,
      lifetimePrice: 299,
      monthlyPrice: 0,
      badgeText: null,
      perks: [
        "All Standard Alumni Privileges Included",
        "Silver Metallic Virtual Card Pass & Verified Badge",
        "Priority RSVP & Seating at Annual Alumni Conferences",
        "Exclusive Access to Executive Mentorship Network",
        "15% Courtesy Discount on Official Physical RFID ID Cards",
        "Quarterly Dean's Economic & Institutional Leadership Briefings",
      ],
    }),
  });
  console.log("✔ Silver plan reset to defaults.");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL DYNAMIC SUBSCRIPTION ADMIN TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:\n", err);
  process.exit(1);
});
