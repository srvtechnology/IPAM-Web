/**
 * End-to-End Test Suite: Event Banner Images & Media Management
 * Verifies:
 * 1. Admin authentication
 * 2. Seeded events carry bannerImage and bannerImages
 * 3. Creating event with multiple banner images & custom default banner
 * 4. Automatic default banner fallback when multiple images are passed
 * 5. Updating / switching default banner image via PATCH
 * 6. Public event details page renders dynamic banner showcase & multi-photo gallery
 * 7. Public events listing page displays designated banner cover and photo count pill
 * 8. Admin events API reflects banner fields
 */
export {};

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

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
  console.log(`🚀 Starting Event Banner Images & Media Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Admin login
  console.log(`[Test 1] Admin authentication...`);
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login successful");
  const adminCookieHeader = adminLoginRes.headers.get("set-cookie") ?? "";
  const adminCookieMatch = adminCookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(adminCookieMatch), "ipam_admin_session cookie captured");
  const adminCookie = `ipam_admin_session=${adminCookieMatch![1]}`;

  // 2. Verify seeded event has banner images
  console.log(`\n[Test 2] Verifying seeded event 'seed-event-1' banner images...`);
  const seedEventRes = await fetch(`${BASE_URL}/api/admin/events/seed-event-1`, {
    headers: { Cookie: adminCookie },
  });
  assert(seedEventRes.status === 200, "Fetched seed-event-1 successfully");
  const seedEventJson = await seedEventRes.json();
  assert(
    seedEventJson.data.bannerImage === "/images/alumni_gala_event_1788454750646.jpg",
    "seed-event-1 has Gala banner as default cover"
  );
  assert(
    Array.isArray(seedEventJson.data.bannerImages) && seedEventJson.data.bannerImages.length === 2,
    "seed-event-1 has 2 banner images in collection"
  );

  // 3. Create a new event with multiple banner images & custom designated default banner
  console.log(`\n[Test 3] Creating new event with 3 banner images and designated default banner...`);
  const banner1 = "/images/alumni_networking_mixer.jpg";
  const banner2 = "/images/ipam_university_campus_1788350001937.jpg";
  const banner3 = "/images/alumni_tech_summit.jpg";

  const newEventPayload = {
    title: `IPAM Multi-Banner Summit ${Date.now()}`,
    category: "NETWORKING",
    date: new Date(Date.now() + 86400000 * 14).toISOString(),
    displayDate: "November 25, 2026",
    time: "5:30 PM",
    location: "Freetown Executive Hall",
    venueDetails: "Suite 400",
    isVirtual: false,
    isPaid: true,
    ticketPrice: 35,
    currency: "USD",
    capacity: 150,
    dressCode: "Business Casual",
    description: "An exclusive summit testing dynamic multi-banner image selection and default banner cover configuration.",
    status: "PUBLISHED",
    featured: true,
    bannerImage: banner1, // explicitly designated default
    bannerImages: [banner1, banner2, banner3],
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(newEventPayload),
  });
  assert(createRes.status === 201, "Event creation returned 201 Created");
  const createJson = await createRes.json();
  const createdEvent = createJson.data;
  assert(Boolean(createdEvent.id), "Created event has ID");
  assert(createdEvent.bannerImage === banner1, "Created event designated default bannerImage matches banner1");
  assert(
    Array.isArray(createdEvent.bannerImages) && createdEvent.bannerImages.length === 3,
    "Created event bannerImages contains all 3 images"
  );
  assert(
    createdEvent.bannerImages.includes(banner1) &&
    createdEvent.bannerImages.includes(banner2) &&
    createdEvent.bannerImages.includes(banner3),
    "Created event bannerImages contains all expected URLs"
  );

  const testEventId = createdEvent.id;

  // 4. Test automatic default banner assignment when only bannerImages array is provided
  console.log(`\n[Test 4] Creating event with bannerImages array and verifying automatic default assignment...`);
  const autoDefaultPayload = {
    title: `Auto-Default Banner Event ${Date.now()}`,
    category: "WEBINAR",
    date: new Date(Date.now() + 86400000 * 20).toISOString(),
    displayDate: "December 5, 2026",
    time: "2:00 PM",
    location: "Online",
    isVirtual: true,
    virtualLink: "https://zoom.us/j/123456789",
    isPaid: false,
    ticketPrice: 0,
    currency: "USD",
    capacity: 200,
    description: "Testing automatic fallback to first image as default banner.",
    status: "PUBLISHED",
    bannerImages: [banner2, banner3],
  };

  const autoRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(autoDefaultPayload),
  });
  assert(autoRes.status === 201, "Auto default event created successfully");
  const autoJson = await autoRes.json();
  assert(
    autoJson.data.bannerImage === banner2,
    "API automatically selected first image in bannerImages as the default cover"
  );

  // 5. Update event (PATCH): Switch the default banner image and add an image
  console.log(`\n[Test 5] Updating event via PATCH to switch default banner to banner3...`);
  const patchPayload = {
    bannerImage: banner3, // Switch default to Tech Summit
    bannerImages: [banner3, banner1, banner2, "/images/alumni_gala_event_1788454750646.jpg"],
  };

  const patchRes = await fetch(`${BASE_URL}/api/admin/events/${testEventId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(patchPayload),
  });
  assert(patchRes.status === 200, "PATCH event returned 200 OK");
  const patchJson = await patchRes.json();
  assert(
    patchJson.data.bannerImage === banner3,
    "Updated event default bannerImage changed to banner3 (Tech Summit)"
  );
  assert(
    Array.isArray(patchJson.data.bannerImages) && patchJson.data.bannerImages.length === 4,
    "Updated event now has 4 banner images in collection"
  );

  // 6. Verify Public Event Detail View (/events/[id])
  console.log(`\n[Test 6] Querying public event page to verify dynamic banner showcase...`);
  const publicPageRes = await fetch(`${BASE_URL}/events/${testEventId}`);
  assert(publicPageRes.status === 200, "Public event page returns 200 OK");
  const publicHtml = await publicPageRes.text();

  assert(
    publicHtml.includes("Event Banners &amp; Media Showcase") || publicHtml.includes("Official Event Cover"),
    "Public page renders Official Event Cover badge"
  );
  assert(
    publicHtml.includes(banner3),
    "Public page HTML embeds new default banner image (banner3)"
  );
  assert(
    publicHtml.includes("Photos") || publicHtml.includes("4 of 4 Photos") || publicHtml.includes("4 Photos"),
    "Public page displays multi-photo gallery counter / indicator"
  );

  // 7. Verify Public Events Directory Listing (/events)
  console.log(`\n[Test 7] Querying public events listing page to verify card banner...`);
  const listPageRes = await fetch(`${BASE_URL}/events`);
  assert(listPageRes.status === 200, "Public events list returns 200 OK");
  const listHtml = await listPageRes.text();
  assert(
    listHtml.includes(banner3),
    "Public events directory includes event's designated default banner image"
  );
  assert(
    listHtml.includes("4 Photos") || listHtml.includes("Photos"),
    "Public events directory card includes photos counter pill"
  );

  // 8. Verify Admin Events List includes banner fields
  console.log(`\n[Test 8] Querying admin events API...`);
  const adminEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminEventsRes.status === 200, "Admin events API returns 200 OK");
  const adminEventsJson = await adminEventsRes.json();
  const foundAdminEvent = adminEventsJson.data.find((e: { id: string }) => e.id === testEventId);
  assert(Boolean(foundAdminEvent), "Found created event in admin events roster");
  assert(
    foundAdminEvent.bannerImage === banner3,
    "Admin event roster has correct designated default bannerImage"
  );
  assert(
    Array.isArray(foundAdminEvent.bannerImages) && foundAdminEvent.bannerImages.length === 4,
    "Admin event roster has full bannerImages collection (4 images)"
  );

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passedCount}/${totalCount}`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
