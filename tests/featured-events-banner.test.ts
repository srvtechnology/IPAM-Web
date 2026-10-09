/**
 * Automated Test Suite: Featured Events Banner & Nearest Fallback System
 * Verifies:
 * 1. Admin login & session validation
 * 2. Multiple events can be set as featured from admin API
 * 3. Public /events top banner renders Featured Flagship Gathering badge
 * 4. Multi-featured event carousel controls (prev/next, dots, showcase selector tabs) render
 * 5. Admin 1-click toggle / PATCH updates featured flag immediately
 * 6. Fallback behavior: When NO events are featured, the top banner dynamically renders
 *    the nearest event with "Nearest Upcoming Event" badge
 * 7. Re-featuring events restores the featured banner showcase seamlessly
 */

export {};

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

let passedCount = 0;
let totalCount = 0;

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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
  console.log(`🚀 Starting Featured Events Banner & Nearest Fallback Tests`);
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

  // 2. Fetch all current events from admin API
  console.log(`\n[Test 2] Fetch current admin events list...`);
  const adminEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminEventsRes.status === 200, "Fetched admin events list");
  const adminEventsJson = await adminEventsRes.json();
  const allEvents = adminEventsJson.data as Array<{ id: string; title: string; date: string; featured: boolean }>;
  assert(Array.isArray(allEvents) && allEvents.length >= 2, `Found ${allEvents.length} events in database`);

  const event1 = allEvents[0];
  const event2 = allEvents[1];

  // 3. Mark multiple events as featured
  console.log(`\n[Test 3] Setting multiple events as featured via admin PATCH (${event1.title} and ${event2.title})...`);
  const patch1 = await fetch(`${BASE_URL}/api/admin/events/${event1.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ featured: true }),
  });
  assert(patch1.status === 200, `Set event 1 (${event1.id}) as featured`);

  const patch2 = await fetch(`${BASE_URL}/api/admin/events/${event2.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ featured: true }),
  });
  assert(patch2.status === 200, `Set event 2 (${event2.id}) as featured`);

  // Verify in admin GET
  const verifyRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  const verifyJson = await verifyRes.json();
  const featuredInAdmin = (verifyJson.data as Array<typeof event1>).filter((e) => e.featured);
  assert(featuredInAdmin.length >= 2, `Admin API confirms ${featuredInAdmin.length} events are featured`);

  // 4. Verify public /events banner with multiple featured events
  console.log(`\n[Test 4] Verifying public /events page with multiple featured events...`);
  const publicEventsRes = await fetch(`${BASE_URL}/events`, {
    headers: { "Cache-Control": "no-cache" },
  });
  assert(publicEventsRes.status === 200, "Public /events page loads successfully");
  const htmlWithFeatured = await publicEventsRes.text();

  assert(
    htmlWithFeatured.includes("Featured Flagship Gathering"),
    "Top banner renders 'Featured Flagship Gathering' badge"
  );
  assert(
    htmlWithFeatured.includes("Featured Events Showcase:"),
    "Multi-featured showcase selector bar renders when multiple events are featured"
  );
  assert(
    /Featured.*1.*of/i.test(htmlWithFeatured) || htmlWithFeatured.includes("Featured 1 of"),
    "Multi-featured index indicator ('Featured 1 of X') renders"
  );
  assert(
    htmlWithFeatured.includes(escapeHtml(event1.title)) && htmlWithFeatured.includes(escapeHtml(event2.title)),
    "Both featured event titles are present in the public page showcase"
  );

  // 5. Test fallback: Unfeature ALL events to verify nearest upcoming event fallback
  console.log(`\n[Test 5] Unfeaturing ALL events to test nearest event fallback...`);
  const freshListRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  const freshListJson = await freshListRes.json();
  const eventsToUnfeature = (freshListJson.data as Array<typeof event1>).filter((e) => e.featured);

  for (const ev of eventsToUnfeature) {
    const res = await fetch(`${BASE_URL}/api/admin/events/${ev.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({ featured: false }),
    });
    assert(res.status === 200, `Unfeatured event ${ev.id}`);
  }

  // Verify none are featured
  const checkNoneRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  const checkNoneJson = await checkNoneRes.json();
  const remainingFeatured = (checkNoneJson.data as Array<typeof event1>).filter((e) => e.featured);
  assert(remainingFeatured.length === 0, "Confirmed 0 events are featured");

  // Determine which event is the nearest upcoming
  const now = Date.now();
  const sortedNearest = [...allEvents].sort((a, b) => {
    const tA = new Date(a.date).getTime();
    const tB = new Date(b.date).getTime();
    const upA = tA >= now;
    const upB = tB >= now;
    if (upA && !upB) return -1;
    if (!upA && upB) return 1;
    if (upA && upB) return tA - tB;
    return tB - tA;
  });
  const expectedNearestEvent = sortedNearest[0];
  console.log(`Expected nearest event: "${expectedNearestEvent.title}" (${expectedNearestEvent.date})`);

  // 6. Verify public /events banner displays nearest event fallback
  console.log(`\n[Test 6] Verifying public banner displays Nearest Upcoming Event fallback...`);
  const publicFallbackRes = await fetch(`${BASE_URL}/events`, {
    headers: { "Cache-Control": "no-cache" },
  });
  assert(publicFallbackRes.status === 200, "Public /events page loads in fallback mode");
  const htmlFallback = await publicFallbackRes.text();

  assert(
    htmlFallback.includes("Nearest Upcoming Event"),
    "Top banner dynamically switches to 'Nearest Upcoming Event' badge"
  );
  assert(
    htmlFallback.includes("Next on Alumni Calendar • Official Event"),
    "Banner subtext reflects 'Next on Alumni Calendar • Official Event'"
  );
  assert(
    htmlFallback.includes(escapeHtml(expectedNearestEvent.title)),
    `Top banner presents expected nearest event: "${expectedNearestEvent.title}"`
  );
  assert(
    !htmlFallback.includes("Featured Events Showcase:"),
    "Multi-featured carousel showcase is hidden when in nearest event fallback mode"
  );

  // 7. Re-enable featured events for healthy live presentation
  console.log(`\n[Test 7] Restoring featured status on ${event1.title}...`);
  const restoreRes = await fetch(`${BASE_URL}/api/admin/events/${event1.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ featured: true }),
  });
  assert(restoreRes.status === 200, "Successfully re-featured event");

  const finalPublicRes = await fetch(`${BASE_URL}/events`, {
    headers: { "Cache-Control": "no-cache" },
  });
  const finalHtml = await finalPublicRes.text();
  assert(
    finalHtml.includes("Featured Flagship Gathering"),
    "Public banner immediately returns to 'Featured Flagship Gathering'"
  );

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passedCount}/${totalCount} assertions successful!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
