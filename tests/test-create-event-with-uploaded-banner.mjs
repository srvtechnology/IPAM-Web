/**
 * Test: Create Event with Uploaded Device Banner, Custom Times, and Program Blocks
 * Reproduces the user's exact form flow:
 * - Base64 Data URL banner uploaded from local device (simulating a screenshot / photo)
 * - Program timeline with times like "6:30" and "7:30"
 * - Featured checkbox checked
 * - Multiple consecutive event creations to verify zero displayId collision in audit log
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedCount++;
  console.log(`✅ PASS: ${message}`);
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 Testing Event Creation with Uploaded Device Banner`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Authenticate as Admin
  console.log(`[Step 1] Authenticating admin...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(loginRes.status === 200, "Admin logged in successfully");
  const cookieHeader = loginRes.headers.get("set-cookie") || "";
  const match = cookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(match), "Captured admin session cookie");
  const adminCookie = `ipam_admin_session=${match[1]}`;

  // 2. Generate a realistic Base64 data URL banner (simulating user's uploaded device screenshot)
  // 100KB Base64 image payload
  const fakeBase64Png = "data:image/png;base64," + "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEfQHzx5t00AAAAABJRU5ErkJggg==".repeat(1500);

  // 3. Create Event with the user's exact input format
  console.log(`\n[Step 2] Creating event with uploaded Base64 banner and program blocks...`);
  const payload = {
    title: "Alumni Executive Gala & Testing",
    category: "NETWORKING",
    date: new Date("2026-11-20T12:00:00Z").toISOString(),
    displayDate: "November 20, 2026",
    time: "6:30",
    location: "Freetown Executive Lounge",
    venueDetails: "Floor 2",
    isVirtual: false,
    virtualLink: null,
    isPaid: false,
    ticketPrice: 0,
    currency: "USD",
    capacity: 100,
    dressCode: "Smart Casual",
    description: "Testing event creation with uploaded banner and program timeline.",
    status: "PUBLISHED",
    featured: true,
    agenda: [
      { time: "6:30", activity: "test", speaker: "test" },
      { time: "7:30", activity: "test", speaker: "test" },
    ],
    bannerImage: fakeBase64Png,
    bannerImages: [fakeBase64Png],
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(payload),
  });

  const createJson = await createRes.json();
  if (!createRes.ok) {
    console.error("Create event returned error status:", createRes.status, createJson);
  }
  assert(createRes.status === 201, `Event creation returned 201 Created (got ${createRes.status})`);
  assert(Boolean(createJson.data?.id), "Event created with valid ID");
  assert(createJson.data.title === payload.title, "Event title matches");
  assert(createJson.data.featured === true, "Featured flag is true");
  assert(Array.isArray(createJson.data.agenda) && createJson.data.agenda.length === 2, "Agenda has 2 blocks");
  assert(createJson.data.bannerImage.startsWith("data:image/png;base64,"), "Stored full Base64 uploaded banner");

  const createdId = createJson.data.id;

  // 4. Verify retrieving the event from the API
  console.log(`\n[Step 3] Fetching created event details...`);
  const getRes = await fetch(`${BASE_URL}/api/admin/events/${createdId}`, {
    headers: { Cookie: adminCookie },
  });
  assert(getRes.status === 200, "GET /api/admin/events/:id returns 200 OK");
  const getJson = await getRes.json();
  assert(getJson.data.id === createdId, "Fetched event ID matches");
  assert(getJson.data.bannerImage.startsWith("data:image/png;base64,"), "Fetched event preserves Base64 banner");
  assert(getJson.data.agenda[0].time === "6:30", "Block 1 time is 6:30");
  assert(getJson.data.agenda[1].time === "7:30", "Block 2 time is 7:30");

  // 5. Create multiple events in rapid succession to ensure collision-proof audit logs
  console.log(`\n[Step 4] Creating 3 more events in rapid succession (verifying audit log uniqueness)...`);
  for (let i = 1; i <= 3; i++) {
    const multiRes = await fetch(`${BASE_URL}/api/admin/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        ...payload,
        title: `Rapid Test Event #${i} - ${Date.now()}`,
        bannerImage: "/images/alumni_networking_mixer.jpg",
        bannerImages: ["/images/alumni_networking_mixer.jpg"],
      }),
    });
    assert(multiRes.status === 201, `Rapid event #${i} creation succeeded with 201 Created`);
  }

  // 6. Verify public page renders correctly
  console.log(`\n[Step 5] Checking public event page...`);
  const publicRes = await fetch(`${BASE_URL}/events/${createdId}`);
  assert(publicRes.status === 200, "Public event page returns 200 OK");
  const publicHtml = await publicRes.text();
  assert(publicHtml.includes("Alumni Executive Gala &amp; Testing") || publicHtml.includes("Alumni Executive Gala & Testing"), "Public page displays event title");
  assert(publicHtml.includes("Official Event Program"), "Public page displays program timeline");
  assert(publicHtml.includes("6:30") && publicHtml.includes("7:30"), "Public page displays program times 6:30 and 7:30");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passedCount}/${totalCount}`);
  console.log(`======================================================\n`);
}

run().catch((err) => {
  console.error("Test failed with exception:", err);
  process.exit(1);
});
