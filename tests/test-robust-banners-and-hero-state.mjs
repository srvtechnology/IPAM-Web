import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function loginAdmin() {
  const res = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.admin@ipam.edu", password: "Password123!" }),
  });
  const data = await res.json().catch(() => null);
  assert.equal(res.status, 200, `Admin login failed: ${JSON.stringify(data)}`);
  const setCookie = res.headers.get("set-cookie") || "";
  const cookie = setCookie.split(";")[0];
  return { cookie, admin: data.data };
}

async function run() {
  console.log("=====================================================================");
  console.log("TESTING ROBUST STATE MANAGEMENT: HERO CAROUSEL & ADS/COMMERCIAL BANNERS");
  console.log("=====================================================================");
  console.log(`Connecting to: ${BASE_URL}\n`);

  // Step 1: Login
  console.log("▶ [Step 1] Authenticating Admin user...");
  const { cookie } = await loginAdmin();
  console.log("✔ Admin authenticated successfully.\n");

  // ==========================================
  // PART A: HERO CAROUSEL STATE MANAGEMENT
  // ==========================================
  console.log("--------------------------------------------------");
  console.log("PART A: HERO CAROUSEL STATE MANAGEMENT");
  console.log("--------------------------------------------------");

  // A1. Initial state
  console.log("▶ [A1] Fetching active hero slides from public API...");
  const publicHeroRes = await fetch(`${BASE_URL}/api/hero-slides`);
  assert.equal(publicHeroRes.status, 200, "Expected 200 from /api/hero-slides");
  const publicHeroData = (await publicHeroRes.json()).data;
  assert.ok(Array.isArray(publicHeroData), "Expected slides array");
  console.log(`✔ Public active slides count: ${publicHeroData.length}`);

  console.log("▶ [A2] Fetching admin hero slides...");
  const adminHeroRes = await fetch(`${BASE_URL}/api/admin/hero-slides`, {
    headers: { Cookie: cookie },
  });
  assert.equal(adminHeroRes.status, 200, "Expected 200 from /api/admin/hero-slides");
  const adminHeroSlides = (await adminHeroRes.json()).data;
  console.log(`✔ Admin all slides count: ${adminHeroSlides.length}`);

  // A2. Creating a new hero slide
  console.log("\n▶ [A3] Creating a new test hero slide...");
  const testSlidePayload = {
    imageUrl: "/images/alumni_networking_mixer.jpg",
    title: "State Management Test Slide " + Date.now(),
    subtitle: "Testing optimistic UI synchronization and persistence",
    badge: "Verified Test • IPAM Network",
    caption: "Freetown Executive Campus",
    order: adminHeroSlides.length + 1,
    active: true,
    ctaText: "Test CTA",
    ctaLink: "/directory",
  };

  const createSlideRes = await fetch(`${BASE_URL}/api/admin/hero-slides`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(testSlidePayload),
  });
  assert.equal(createSlideRes.status, 201, "Expected 201 Created for new slide");
  const createdSlide = (await createSlideRes.json()).data;
  assert.ok(createdSlide.id, "Expected created slide to have ID");
  assert.equal(createdSlide.title, testSlidePayload.title);
  console.log(`✔ Slide created successfully! ID: ${createdSlide.id}`);

  // Verify it appears in public active slides
  const publicAfterCreate = (await (await fetch(`${BASE_URL}/api/hero-slides`)).json()).data;
  const inPublic = publicAfterCreate.find((s) => s.id === createdSlide.id);
  assert.ok(inPublic, "New active slide MUST appear in public /api/hero-slides state");
  console.log("✔ New slide immediately reflected in public carousel state.");

  // A3. Updating the slide
  console.log("\n▶ [A4] Updating the hero slide in edit mode...");
  const updateSlideRes = await fetch(`${BASE_URL}/api/admin/hero-slides/${createdSlide.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      title: "Updated Title - High Resilience",
      caption: "Main Campus Auditorium",
    }),
  });
  assert.equal(updateSlideRes.status, 200, "Expected 200 for slide update");
  const updatedSlide = (await updateSlideRes.json()).data;
  assert.equal(updatedSlide.title, "Updated Title - High Resilience");
  assert.equal(updatedSlide.caption, "Main Campus Auditorium");
  console.log("✔ Slide updated successfully. State reflects new title and caption.");

  // A4. Toggling active state to false
  console.log("\n▶ [A5] Deactivating slide and verifying state isolation...");
  const toggleOffRes = await fetch(`${BASE_URL}/api/admin/hero-slides/${createdSlide.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ active: false }),
  });
  assert.equal(toggleOffRes.status, 200);

  const publicAfterDeactivate = (await (await fetch(`${BASE_URL}/api/hero-slides`)).json()).data;
  const inPublicDeactivated = publicAfterDeactivate.find((s) => s.id === createdSlide.id);
  assert.equal(inPublicDeactivated, undefined, "Inactive slide must NOT exist in public active state");
  console.log("✔ Inactive slide immediately removed from public carousel state.");

  // A5. Reordering slides
  console.log("\n▶ [A6] Testing slides reordering state...");
  const allCurrentAdmin = (await (await fetch(`${BASE_URL}/api/admin/hero-slides`, { headers: { Cookie: cookie } })).json()).data;
  const reversedIds = allCurrentAdmin.map((s) => s.id).reverse();
  const reorderRes = await fetch(`${BASE_URL}/api/admin/hero-slides/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ slideIds: reversedIds }),
  });
  assert.equal(reorderRes.status, 200, "Expected 200 for reordering");
  const reorderedList = (await reorderRes.json()).data;
  assert.equal(reorderedList[0].id, reversedIds[0], "First slide ID must match reversed ID 0");
  console.log("✔ Reordering state persisted properly.");

  // A6. Clean up: Delete test slide
  console.log("\n▶ [A7] Deleting test slide...");
  const deleteSlideRes = await fetch(`${BASE_URL}/api/admin/hero-slides/${createdSlide.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.equal(deleteSlideRes.status, 200, "Expected 200 for slide deletion");

  const adminAfterDelete = (await (await fetch(`${BASE_URL}/api/admin/hero-slides`, { headers: { Cookie: cookie } })).json()).data;
  const stillExists = adminAfterDelete.find((s) => s.id === createdSlide.id);
  assert.equal(stillExists, undefined, "Deleted slide must NOT exist in admin state");
  console.log("✔ Slide deletion verified. State cleaned up.\n");


  // ==========================================
  // PART B: ADS & COMMERCIAL BANNERS STATE MANAGEMENT
  // ==========================================
  console.log("--------------------------------------------------");
  console.log("PART B: ADS & COMMERCIAL BANNERS STATE MANAGEMENT");
  console.log("--------------------------------------------------");

  // B1. Verifying all 6 pages have active banners
  console.log("▶ [B1] Verifying initial banners across all 6 target pages...");
  const pages = ["/", "/directory", "/events", "/jobs", "/businesses", "/giving"];
  for (const p of pages) {
    const res = await fetch(`${BASE_URL}/api/banners?page=${encodeURIComponent(p)}`);
    assert.equal(res.status, 200, `Page ${p} banner API failed: ${res.status}`);
    const data = (await res.json()).data;
    assert.ok(Array.isArray(data), `Expected data array for ${p}`);
    assert.ok(data.length >= 1, `Page ${p} should have at least 1 commercial banner`);
    console.log(`✔ Page "${p}": Found ${data.length} banner(s). Top: "${data[0].headline}"`);
  }

  // B2. Creating a multi-page targeted commercial banner
  console.log("\n▶ [B2] Creating new commercial ad targeting ONLY [/directory, /jobs]...");
  const adPayload = {
    name: "Sierra Leone FinTech Alliance " + Date.now(),
    headline: "Fast-Track Digital Banking API Sandbox",
    description: "Build integrated payment flows for West African commerce with full regulatory sandbox compliance.",
    badge: "Official Tech Sponsor",
    ctaText: "Access API Sandbox",
    targetUrl: "https://sandbox.fintech.sl",
    bannerImageUrl: "/images/sponsor_telecom_banner.jpg",
    slot: "/directory,/jobs",
    pages: ["/directory", "/jobs"],
    order: 1,
    active: true,
    monthlyFee: 500,
  };

  const createAdRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(adPayload),
  });
  assert.equal(createAdRes.status, 201, "Expected 201 Created for banner");
  const createdBanner = (await createAdRes.json()).data;
  assert.ok(createdBanner.id, "Expected created banner ID");
  console.log(`✔ Commercial banner created! ID: ${createdBanner.id}, Name: "${createdBanner.name}"`);

  // B3. Verifying placement isolation
  console.log("\n▶ [B3] Verifying placement routing isolation...");
  const dirBanners = (await (await fetch(`${BASE_URL}/api/banners?page=/directory`)).json()).data;
  const inDir = dirBanners.find((b) => b.id === createdBanner.id);
  assert.ok(inDir, "New ad MUST appear on /directory");
  console.log("✔ Ad successfully routed to /directory.");

  const jobsBanners = (await (await fetch(`${BASE_URL}/api/banners?page=/jobs`)).json()).data;
  const inJobs = jobsBanners.find((b) => b.id === createdBanner.id);
  assert.ok(inJobs, "New ad MUST appear on /jobs");
  console.log("✔ Ad successfully routed to /jobs.");

  const eventsBanners = (await (await fetch(`${BASE_URL}/api/banners?page=/events`)).json()).data;
  const inEvents = eventsBanners.find((b) => b.id === createdBanner.id);
  assert.equal(inEvents, undefined, "New ad must NOT appear on /events (isolation check)");
  console.log("✔ Ad correctly isolated from unselected page (/events).");

  // B4. Impression & Click tracking state management
  console.log("\n▶ [B4] Testing Impression & Click tracking state...");
  const impRes = await fetch(`${BASE_URL}/api/banners/impressions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: [createdBanner.id] }),
  });
  assert.equal(impRes.status, 200, "Impression recording should succeed");

  const clickRes = await fetch(`${BASE_URL}/api/banners/${createdBanner.id}/click`, {
    method: "POST",
  });
  assert.equal(clickRes.status, 200, "Click recording should succeed");

  const bannerAfterClick = (await (await fetch(`${BASE_URL}/api/admin/banners/${createdBanner.id}`, { headers: { Cookie: cookie } })).json()).data;
  assert.equal(bannerAfterClick.clicks, 1, "Clicks count must be 1");
  assert.ok(bannerAfterClick.impressions >= 1, "Impressions count must be at least 1");
  console.log(`✔ Tracking state verified: Clicks = ${bannerAfterClick.clicks}, Impressions = ${bannerAfterClick.impressions}, CTR = ${bannerAfterClick.ctr}`);

  // B5. Toggle active / paused state
  console.log("\n▶ [B5] Testing Toggle Active/Paused state...");
  const toggleBannerRes = await fetch(`${BASE_URL}/api/admin/banners/${createdBanner.id}/toggle`, {
    method: "PATCH",
    headers: { Cookie: cookie },
  });
  assert.equal(toggleBannerRes.status, 200, "Toggle should succeed");

  const dirAfterPause = (await (await fetch(`${BASE_URL}/api/banners?page=/directory`)).json()).data;
  const inDirPaused = dirAfterPause.find((b) => b.id === createdBanner.id);
  assert.equal(inDirPaused, undefined, "Paused banner must NOT appear in public directory state");
  console.log("✔ Paused banner immediately hidden from public directory state.");

  // B6. Deleting banner & verifying cleanup
  console.log("\n▶ [B6] Deleting commercial banner and verifying state cleanup...");
  const deleteBannerRes = await fetch(`${BASE_URL}/api/admin/banners/${createdBanner.id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  assert.equal(deleteBannerRes.status, 200, "Deletion should succeed");

  const allAdminBannersAfter = (await (await fetch(`${BASE_URL}/api/admin/banners`, { headers: { Cookie: cookie } })).json()).data;
  const existsInAdmin = allAdminBannersAfter.find((b) => b.id === createdBanner.id);
  assert.equal(existsInAdmin, undefined, "Deleted banner must NOT exist in admin state");
  console.log("✔ Commercial banner deleted. Admin state clean.");

  console.log("\n=====================================================================");
  console.log("🎉 ALL ROBUST STATE MANAGEMENT TESTS PASSED WITH 100% SUCCESS!");
  console.log("=====================================================================");
}

run().catch((err) => {
  console.error("\n❌ TEST FAILED:", err);
  process.exit(1);
});
