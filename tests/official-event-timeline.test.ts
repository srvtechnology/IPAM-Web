/**
 * End-to-End Test Suite: Official Event Program & Timeline Dynamic Builder
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
  console.log(`🚀 Starting Official Event Program & Timeline Tests`);
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

  // 2. Fetch existing event (seed-event-3)
  console.log(`\n[Test 2] Fetching existing event 'seed-event-3'...`);
  const eventRes = await fetch(`${BASE_URL}/api/admin/events/seed-event-3`, {
    headers: { Cookie: adminCookie },
  });
  assert(eventRes.status === 200, "Event seed-event-3 fetched successfully");
  const eventJson = await eventRes.json();
  assert(eventJson.data.title === "Freetown Young Alumni Networking Mixer", "Event title matches Mixer");

  // 3. Admin dynamically sets a 4-block Official Event Program & Timeline
  console.log(`\n[Test 3] Admin dynamically saves 4-block Official Event Program & Timeline...`);
  const updatedAgenda = [
    { time: "6:30 PM", activity: "Arrival & Red Carpet Cocktails", speaker: "Hostess Mariatu Sesay" },
    { time: "7:15 PM", activity: "Speed Mentorship Circles", speaker: "Alex Sesay, UNDP" },
    { time: "8:15 PM", activity: "Executive Keynote: Career Navigation", speaker: "Dr. Fatmata Kamara" },
    { time: "9:00 PM", activity: "Open Socializing & Alumni Networking", speaker: "All Attendees" },
  ];

  const updateRes = await fetch(`${BASE_URL}/api/admin/events/seed-event-3`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      agenda: updatedAgenda,
    }),
  });
  assert(updateRes.status === 200, "PATCH event agenda returns 200 OK");
  const updateJson = await updateRes.json();
  assert(Array.isArray(updateJson.data.agenda), "Updated event has agenda array");
  assert(updateJson.data.agenda.length === 4, "Updated agenda contains 4 scheduled blocks");
  assert(updateJson.data.agenda[0].time === "6:30 PM", "Block 1 time is 6:30 PM");
  assert(updateJson.data.agenda[0].activity === "Arrival & Red Carpet Cocktails", "Block 1 activity matches");
  assert(updateJson.data.agenda[0].speaker === "Hostess Mariatu Sesay", "Block 1 speaker matches");
  assert(updateJson.data.agenda[2].time === "8:15 PM", "Block 3 time is 8:15 PM");
  assert(updateJson.data.agenda[2].speaker === "Dr. Fatmata Kamara", "Block 3 speaker matches");

  // 4. Verify public event details page returns the dynamic timeline
  console.log(`\n[Test 4] Querying public event page to verify dynamic timeline reflection...`);
  const publicPageRes = await fetch(`${BASE_URL}/events/seed-event-3`);
  assert(publicPageRes.status === 200, "Public event page returns 200 OK");
  const html = await publicPageRes.text();
  assert(html.includes("Official Event Program"), "Public page renders 'Official Event Program' section");
  assert(html.includes("Arrival &amp; Red Carpet Cocktails") || html.includes("Arrival & Red Carpet Cocktails"), "Public page contains Block 1 activity");
  assert(html.includes("Speed Mentorship Circles"), "Public page contains Block 2 activity");
  assert(html.includes("Dr. Fatmata Kamara"), "Public page contains Block 3 speaker");
  assert(html.includes("Scheduled Blocks") && /4(<!-- -->)?\s*Scheduled Blocks/.test(html), "Public page displays '4 Scheduled Blocks' pill badge");

  // 5. Admin modifies timeline (removes 1 block, reorders)
  console.log(`\n[Test 5] Admin modifies timeline dynamically (removes a block, updates times)...`);
  const revisedAgenda = [
    { time: "6:30 PM", activity: "Arrival & Welcome", speaker: "" },
    { time: "7:00 PM", activity: "Panel Discussion & Keynote", speaker: "Alex Sesay" },
    { time: "8:00 PM", activity: "Closing Social", speaker: "" },
  ];

  const patch2Res = await fetch(`${BASE_URL}/api/admin/events/seed-event-3`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      agenda: revisedAgenda,
    }),
  });
  assert(patch2Res.status === 200, "Second PATCH returns 200 OK");
  const patch2Json = await patch2Res.json();
  assert(patch2Json.data.agenda.length === 3, "Revised agenda has 3 blocks");

  // 6. Verify public page dynamically updates to 3 blocks
  const publicPage2Res = await fetch(`${BASE_URL}/events/seed-event-3`);
  const html2 = await publicPage2Res.text();
  assert(html2.includes("Scheduled Blocks") && /3(<!-- -->)?\s*Scheduled Blocks/.test(html2), "Public page updated to '3 Scheduled Blocks'");
  assert(html2.includes("Panel Discussion &amp; Keynote") || html2.includes("Panel Discussion & Keynote"), "Public page reflects revised activities");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedCount}/${totalCount} OFFICIAL TIMELINE TESTS PASSED!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
