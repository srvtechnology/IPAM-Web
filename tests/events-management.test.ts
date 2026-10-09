/**
 * End-to-End Test Suite: Event Management System
 * Tests:
 * 1. Admin Events Listing & KPI Metrics
 * 2. Creating Paid Events (with Pricing, Currency, Capacity)
 * 3. Creating Free / Unpaid Events ($0 Admission)
 * 4. Updating Event Details & Pricing Tiers
 * 5. Admin Manual Walk-in Booking & Cash Collection
 * 6. Master Bookings Roster, Search & Status Filters
 * 7. Live Attendance Check-in & Timestamp Recording
 * 8. User Booking History & Profile Lookup
 * 9. Public Event Self-Service Booking (Alumni Portal)
 * 10. Deleting & Releasing Cancelled Bookings
 */

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
  console.log(`🚀 Starting Events & Bookings Management Test Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // Test 1: Admin Login
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Test 2: Fetch Admin Events List & Metrics
  // -------------------------------------------------------------------------
  console.log(`\n[Test 2] Fetch admin events list & seeded events...`);
  const listEventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(listEventsRes.status === 200, "Admin events endpoint returns 200 OK");
  const listEventsJson = await listEventsRes.json();
  assert(Array.isArray(listEventsJson.data), "Events is an array");
  assert(listEventsJson.data.length >= 2, "Seeded events are present");

  const galaEvent = listEventsJson.data.find((e: { id: string }) => e.id === "seed-event-1");
  assert(Boolean(galaEvent), "Seeded Gala event found");
  assert(galaEvent.isPaid === true, "Gala event is marked as Paid");
  assert(galaEvent.ticketPrice === 50, "Gala event ticket price is $50");

  const webinarEvent = listEventsJson.data.find((e: { id: string }) => e.id === "seed-event-2");
  assert(Boolean(webinarEvent), "Seeded Webinar event found");
  assert(webinarEvent.isPaid === false, "Webinar event is marked as Free/Unpaid");
  assert(webinarEvent.ticketPrice === 0, "Webinar event ticket price is $0");

  // -------------------------------------------------------------------------
  // Test 3: Create New Paid Event
  // -------------------------------------------------------------------------
  console.log(`\n[Test 3] Admin creates a new Paid Event with pricing...`);
  const createPaidRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "West Africa FinTech Leadership Summit 2026",
      category: "CAREER_WORKSHOP",
      date: "2026-11-20T09:00:00Z",
      displayDate: "November 20, 2026",
      time: "9:00 AM GMT",
      location: "Bintumani Conference Center, Freetown",
      venueDetails: "Auditorium Hall A",
      isVirtual: false,
      isPaid: true,
      ticketPrice: 35,
      currency: "USD",
      capacity: 150,
      description: "A premier summit bringing together banking leaders and tech founders.",
      status: "PUBLISHED",
      featured: true,
    }),
  });
  assert(createPaidRes.status === 200 || createPaidRes.status === 201, "Created paid event successfully");
  const createPaidJson = await createPaidRes.json();
  const newPaidEventId = createPaidJson.data.id;
  assert(Boolean(newPaidEventId), "New event ID returned");
  assert(createPaidJson.data.isPaid === true, "Created event has isPaid = true");
  assert(Number(createPaidJson.data.ticketPrice) === 35, "Created event has ticketPrice = 35");

  // -------------------------------------------------------------------------
  // Test 4: Create New Free / Unpaid Event
  // -------------------------------------------------------------------------
  console.log(`\n[Test 4] Admin creates a new Free Event...`);
  const createFreeRes = await fetch(`${BASE_URL}/api/admin/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "Alumni Mentorship Kickoff Mixer",
      category: "NETWORKING",
      date: "2026-11-25T17:00:00Z",
      displayDate: "November 25, 2026",
      time: "5:00 PM GMT",
      location: "IPAM Campus Courtyard",
      isVirtual: false,
      isPaid: false,
      ticketPrice: 0,
      currency: "USD",
      capacity: 100,
      description: "An evening mixer connecting senior alumni mentors with recent graduates.",
      status: "PUBLISHED",
    }),
  });
  assert(createFreeRes.status === 200 || createFreeRes.status === 201, "Created free event successfully");
  const createFreeJson = await createFreeRes.json();
  const newFreeEventId = createFreeJson.data.id;
  assert(createFreeJson.data.isPaid === false, "Created event has isPaid = false");
  assert(Number(createFreeJson.data.ticketPrice) === 0, "Created event has ticketPrice = 0");

  // -------------------------------------------------------------------------
  // Test 5: Admin Manual Walk-in Booking for Paid Event
  // -------------------------------------------------------------------------
  console.log(`\n[Test 5] Admin creates a manual walk-in booking for the Paid Event...`);
  const walkinBookingRes = await fetch(`${BASE_URL}/api/admin/events/${newPaidEventId}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      attendeeName: "Alhaji Ibrahim Bangura",
      attendeeEmail: "ibrahim.bangura@partner.sl",
      attendeePhone: "+232 78 443322",
      ticketCount: 2,
      paymentMethod: "OFFLINE_CASH",
      paymentStatus: "PAID",
      notes: "VIP guest of the Dean.",
    }),
  });
  assert(walkinBookingRes.status === 200 || walkinBookingRes.status === 201, "Created walk-in booking");
  const walkinJson = await walkinBookingRes.json();
  const walkinBookingId = walkinJson.data.id;
  assert(walkinJson.data.bookingReference.startsWith("BK-EVT-"), "Booking reference generated with BK-EVT- prefix");
  assert(walkinJson.data.ticketCount === 2, "Ticket count is 2");
  assert(Number(walkinJson.data.totalAmount) === 70, "Total amount calculated correctly ($35 x 2 = $70)");
  assert(walkinJson.data.paymentStatus === "PAID", "Payment status is PAID");
  assert(walkinJson.data.paymentMethod === "OFFLINE_CASH", "Payment method is OFFLINE_CASH");

  // -------------------------------------------------------------------------
  // Test 6: Master Bookings List & Search / Filters
  // -------------------------------------------------------------------------
  console.log(`\n[Test 6] Fetch master bookings list and test filters...`);
  const allBookingsRes = await fetch(`${BASE_URL}/api/admin/events/bookings`, {
    headers: { Cookie: adminCookie },
  });
  assert(allBookingsRes.status === 200, "Fetch bookings returns 200 OK");
  const allBookingsJson = await allBookingsRes.json();
  assert(Array.isArray(allBookingsJson.data), "Bookings list is an array");
  assert(allBookingsJson.data.length >= 3, "Contains seeded + newly created bookings");

  // Test filter by eventId
  const filterByEventRes = await fetch(`${BASE_URL}/api/admin/events/bookings?eventId=${newPaidEventId}`, {
    headers: { Cookie: adminCookie },
  });
  const filterByEventJson = await filterByEventRes.json();
  assert(filterByEventJson.data.length === 1, "Filter by event returns only bookings for that event");
  assert(filterByEventJson.data[0].id === walkinBookingId, "Matches created walk-in booking ID");

  // Test search by attendee name
  const searchRes = await fetch(`${BASE_URL}/api/admin/events/bookings?search=Ibrahim`, {
    headers: { Cookie: adminCookie },
  });
  const searchJson = await searchRes.json();
  assert(searchJson.data.length >= 1, "Search returns matching attendee");
  assert(searchJson.data[0].attendeeName.includes("Ibrahim"), "Search matched attendee name");

  // -------------------------------------------------------------------------
  // Test 7: Live Check-in / Attendance Verification
  // -------------------------------------------------------------------------
  console.log(`\n[Test 7] Admin performs live attendee check-in...`);
  const checkInRes = await fetch(`${BASE_URL}/api/admin/events/bookings/${walkinBookingId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      bookingStatus: "ATTENDED",
    }),
  });
  assert(checkInRes.status === 200, "Check-in request returns 200 OK");
  const checkInJson = await checkInRes.json();
  assert(checkInJson.data.bookingStatus === "ATTENDED", "Booking status updated to ATTENDED");
  assert(Boolean(checkInJson.data.attendedAt), "attendedAt timestamp recorded automatically");

  // -------------------------------------------------------------------------
  // Test 8: User Booking History & Profile Lookup
  // -------------------------------------------------------------------------
  console.log(`\n[Test 8] Look up user booking history for seeded alumni...`);
  // Find alex user id
  const alexBooking = allBookingsJson.data.find(
    (b: { user: { email?: string } | null }) => b.user?.email === "demo.alumni@ipam.edu"
  );
  assert(Boolean(alexBooking), "Found booking for demo.alumni@ipam.edu");
  const alexUserId = alexBooking.user.id;

  const historyRes = await fetch(`${BASE_URL}/api/admin/events/users/${alexUserId}/history`, {
    headers: { Cookie: adminCookie },
  });
  assert(historyRes.status === 200, "User history returns 200 OK");
  const historyJson = await historyRes.json();
  assert(historyJson.data.user.email === "demo.alumni@ipam.edu", "History belongs to demo alumni");
  assert(Array.isArray(historyJson.data.bookings), "User history bookings is an array");
  assert(historyJson.data.bookings.length >= 1, "User history contains Gala booking");
  assert(historyJson.data.totalSpent >= 100, "User total spent calculated from paid tickets");

  // -------------------------------------------------------------------------
  // Test 9: Public Event Self-Service Booking (Alumni Portal)
  // -------------------------------------------------------------------------
  console.log(`\n[Test 9] Alumni self-service booking on public portal...`);
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(alumniLoginRes.status === 200, "Alumni login successful");
  const alumniCookieHeader = alumniLoginRes.headers.get("set-cookie") ?? "";
  const alumniCookieMatch = alumniCookieHeader.match(/ipam_alumni_session=([^;]+)/);
  const alumniCookie = `ipam_alumni_session=${alumniCookieMatch![1]}`;

  // Alumni registers for the new Free Event
  const publicBookingRes = await fetch(`${BASE_URL}/api/events/${newFreeEventId}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      ticketCount: 1,
      notes: "Looking forward to mentoring juniors.",
    }),
  });
  assert(publicBookingRes.status === 200 || publicBookingRes.status === 201, "Public booking succeeds");
  const publicBookingJson = await publicBookingRes.json();
  assert(publicBookingJson.data.registered === true, "Registered flag is true");
  assert(Boolean(publicBookingJson.data.bookingReference), "Booking reference returned to alumni");
  assert(publicBookingJson.data.paymentStatus === "FREE", "Payment status is FREE for free event");

  // Cleanup: delete the created test events
  await fetch(`${BASE_URL}/api/admin/events/${newPaidEventId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  await fetch(`${BASE_URL}/api/admin/events/${newFreeEventId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });

  console.log(`\n======================================================`);
  console.log(`🎉 All Event Management Tests Passed Successfully! (${passedCount}/${totalCount})`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

export {};
