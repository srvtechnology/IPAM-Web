/**
 * Verification Test Suite: Seeded Events, Bookings, Pricing & User Details
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
  console.log(`🚀 Starting Seeded Events & Bookings Verification Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // Step 1: Admin Authentication
  // -------------------------------------------------------------------------
  console.log(`[Step 1] Admin authentication...`);
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login successful (200 OK)");
  const adminCookieHeader = adminLoginRes.headers.get("set-cookie") ?? "";
  const adminCookieMatch = adminCookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(adminCookieMatch), "ipam_admin_session cookie captured");
  const adminCookie = `ipam_admin_session=${adminCookieMatch![1]}`;

  // -------------------------------------------------------------------------
  // Step 2: Verify All 6 Seeded Events with Pricing & Formats
  // -------------------------------------------------------------------------
  console.log(`\n[Step 2] Fetching events list & verifying all 6 seeded events...`);
  const eventsRes = await fetch(`${BASE_URL}/api/admin/events`, {
    headers: { Cookie: adminCookie },
  });
  assert(eventsRes.status === 200, "Events endpoint returns 200 OK");
  const eventsJson = await eventsRes.json();
  const events: any[] = eventsJson.data;

  assert(Array.isArray(events), "Events returned is an array");
  assert(events.length >= 6, `At least 6 events seeded (found: ${events.length})`);

  // 1. Annual Gala
  const gala = events.find((e) => e.id === "seed-event-1");
  assert(Boolean(gala), "Event 1 (Annual Gala) found");
  assert(gala.isPaid === true, "Gala is Paid");
  assert(gala.ticketPrice === 50, "Gala ticket price is $50.00");
  assert(gala.currency === "USD", "Gala currency is USD");
  assert(gala.category === "GALA", "Gala category is GALA");
  assert(gala.capacity === 300, "Gala capacity is 300");
  assert(gala.featured === true, "Gala is featured");

  // 2. Career Webinar
  const webinar = events.find((e) => e.id === "seed-event-2");
  assert(Boolean(webinar), "Event 2 (Career Growth Webinar) found");
  assert(webinar.isPaid === false, "Webinar is Free/Unpaid");
  assert(webinar.ticketPrice === 0, "Webinar ticket price is $0.00");
  assert(webinar.isVirtual === true, "Webinar is virtual");
  assert(webinar.category === "WEBINAR", "Webinar category is WEBINAR");
  assert(webinar.capacity === 500, "Webinar capacity is 500");

  // 3. Young Alumni Mixer
  const mixer = events.find((e) => e.id === "seed-event-3");
  assert(Boolean(mixer), "Event 3 (Young Alumni Mixer) found");
  assert(mixer.isPaid === true, "Mixer is Paid");
  assert(mixer.ticketPrice === 15, "Mixer ticket price is $15.00");
  assert(mixer.category === "NETWORKING", "Mixer category is NETWORKING");
  assert(mixer.capacity === 80, "Mixer capacity is 80");
  assert(mixer.featured === true, "Mixer is featured");

  // 4. Fintech Masterclass
  const masterclass = events.find((e) => e.id === "seed-event-4");
  assert(Boolean(masterclass), "Event 4 (Fintech Masterclass) found");
  assert(masterclass.isPaid === true, "Masterclass is Paid");
  assert(masterclass.ticketPrice === 25, "Masterclass ticket price is $25.00");
  assert(masterclass.category === "CAREER_WORKSHOP", "Masterclass category is CAREER_WORKSHOP");
  assert(masterclass.capacity === 120, "Masterclass capacity is 120");

  // 5. UK Winter Reception
  const ukReception = events.find((e) => e.id === "seed-event-5");
  assert(Boolean(ukReception), "Event 5 (UK Winter Reception) found");
  assert(ukReception.isPaid === true, "UK Reception is Paid");
  assert(ukReception.ticketPrice === 40, "UK Reception ticket price is $40.00");
  assert(ukReception.category === "REGIONAL_MEETUP", "UK Reception category is REGIONAL_MEETUP");
  assert(ukReception.capacity === 150, "UK Reception capacity is 150");

  // 6. Mentorship Network Orientation
  const mentorOrientation = events.find((e) => e.id === "seed-event-6");
  assert(Boolean(mentorOrientation), "Event 6 (Mentorship Orientation) found");
  assert(mentorOrientation.isPaid === false, "Mentorship orientation is Free/Unpaid");
  assert(mentorOrientation.ticketPrice === 0, "Mentorship orientation price is $0.00");
  assert(mentorOrientation.isVirtual === true, "Mentorship orientation is virtual");
  assert(mentorOrientation.capacity === 250, "Mentorship orientation capacity is 250");

  // Verify Metrics Aggregations
  console.log(`\n[Step 3] Verifying KPI metrics aggregations...`);
  const totalEvents = events.length;
  const paidEvents = events.filter((e) => e.isPaid).length;
  const freeEvents = events.filter((e) => !e.isPaid).length;
  const grossRevenue = events.reduce((sum, e) => sum + (e.totalRevenue || 0), 0);
  const totalBookedSeats = events.reduce((sum, e) => sum + (e.totalBookedSeats || 0), 0);

  assert(totalEvents >= 6, `Total events >= 6 (got ${totalEvents})`);
  assert(paidEvents >= 4, `Paid events >= 4 (got ${paidEvents})`);
  assert(freeEvents >= 2, `Free events >= 2 (got ${freeEvents})`);
  assert(grossRevenue > 0, `Gross revenue > 0 (got $${grossRevenue})`);
  assert(totalBookedSeats > 0, `Total booked seats > 0 (got ${totalBookedSeats})`);

  // -------------------------------------------------------------------------
  // Step 4: Verify Master Bookings Roster & Diverse Attendees
  // -------------------------------------------------------------------------
  console.log(`\n[Step 4] Fetching all bookings and verifying attendee details...`);
  const bookingsRes = await fetch(`${BASE_URL}/api/admin/events/bookings`, {
    headers: { Cookie: adminCookie },
  });
  assert(bookingsRes.status === 200, "Bookings endpoint returns 200 OK");
  const bookingsJson = await bookingsRes.json();
  const bookings: any[] = bookingsJson.data;
  assert(Array.isArray(bookings), "Bookings is an array");
  assert(bookings.length >= 9, `At least 9 seeded bookings found (got ${bookings.length})`);

  // Verify Booking 1: Alex Sesay Gala (Stripe, Paid, 2 tickets, $100)
  const galaBooking = bookings.find((b) => b.bookingReference === "BK-EVT-GALA-001");
  assert(Boolean(galaBooking), "Booking BK-EVT-GALA-001 found");
  assert(galaBooking.attendeeName === "Alex Sesay", "Attendee name is Alex Sesay");
  assert(galaBooking.ticketCount === 2, "Ticket count is 2");
  assert(galaBooking.unitPrice === 50, "Unit price is $50.00");
  assert(galaBooking.totalAmount === 100, "Total amount is $100.00");
  assert(galaBooking.paymentStatus === "PAID", "Payment status is PAID");
  assert(galaBooking.paymentMethod === "STRIPE", "Payment method is STRIPE");
  assert(galaBooking.bookingStatus === "CONFIRMED", "Booking status is CONFIRMED");
  assert(Boolean(galaBooking.user), "Linked user account exists");
  assert(galaBooking.user.studentId === "IPAM-2015-0042", "Student ID is IPAM-2015-0042");

  // Verify Booking 2: Alex Sesay Young Alumni Mixer (Stripe, Paid, Attended)
  const mixerBooking = bookings.find((b) => b.bookingReference === "BK-EVT-NETW-003");
  assert(Boolean(mixerBooking), "Booking BK-EVT-NETW-003 found");
  assert(mixerBooking.bookingStatus === "ATTENDED", "Mixer booking status is ATTENDED");
  assert(Boolean(mixerBooking.attendedAt), "Attended timestamp is recorded");

  // Verify Booking 3: David Koroma Cash Walk-In (Admin Desk, Offline Cash)
  const davidCashBooking = bookings.find((b) => b.bookingReference === "BK-EVT-FINTECH-005");
  assert(Boolean(davidCashBooking), "Booking BK-EVT-FINTECH-005 found");
  assert(davidCashBooking.paymentMethod === "OFFLINE_CASH", "Payment method is OFFLINE_CASH");
  assert(davidCashBooking.source === "ADMIN_DESK", "Source is ADMIN_DESK (Registrar walk-in desk)");
  assert(davidCashBooking.bookingStatus === "ATTENDED", "Booking status is ATTENDED");

  // Verify Booking 4: Mariama Jalloh Complimentary Council Pass
  const mariamaCompBooking = bookings.find((b) => b.bookingReference === "BK-EVT-GALA-006");
  assert(Boolean(mariamaCompBooking), "Booking BK-EVT-GALA-006 found");
  assert(mariamaCompBooking.paymentMethod === "COMPLIMENTARY", "Payment method is COMPLIMENTARY");
  assert(mariamaCompBooking.paymentStatus === "PAID", "Complimentary ticket paymentStatus is PAID");
  assert(mariamaCompBooking.source === "ADMIN_DESK", "Source is ADMIN_DESK");

  // Verify Booking 5: Samuel Browne (Guest Walk-in without prior user account)
  const guestBooking = bookings.find((b) => b.bookingReference === "BK-EVT-NETW-008");
  assert(Boolean(guestBooking), "Booking BK-EVT-NETW-008 (Guest Walk-in) found");
  assert(guestBooking.user === null, "Guest booking has user = null (guest without account)");
  assert(guestBooking.attendeeName === "Samuel Browne", "Guest attendee name is Samuel Browne");
  assert(guestBooking.attendeeEmail === "samuel.browne@guest.sl", "Guest attendee email matches");
  assert(guestBooking.paymentMethod === "OFFLINE_CASH", "Guest payment method is OFFLINE_CASH");
  assert(guestBooking.ticketCount === 2, "Guest booked 2 tickets");
  assert(guestBooking.totalAmount === 30, "Guest total amount is $30.00");

  // Verify Booking 6: Cancelled & Refunded ticket
  const cancelledBooking = bookings.find((b) => b.bookingReference === "BK-EVT-GALA-009");
  assert(Boolean(cancelledBooking), "Booking BK-EVT-GALA-009 (Cancelled) found");
  assert(cancelledBooking.bookingStatus === "CANCELLED", "Booking status is CANCELLED");
  assert(cancelledBooking.paymentStatus === "REFUNDED", "Payment status is REFUNDED");

  // -------------------------------------------------------------------------
  // Step 5: Test Multi-Filter Queries
  // -------------------------------------------------------------------------
  console.log(`\n[Step 5] Testing search & multi-criteria filters on bookings...`);

  // Filter by eventId = seed-event-1 (Gala)
  const galaFilterRes = await fetch(`${BASE_URL}/api/admin/events/bookings?eventId=seed-event-1`, {
    headers: { Cookie: adminCookie },
  });
  const galaFilterJson = await galaFilterRes.json();
  assert(galaFilterJson.data.every((b: any) => b.eventId === "seed-event-1"), "Event filter returns only Gala bookings");
  assert(galaFilterJson.data.length >= 4, "Gala has at least 4 bookings");

  // Filter by paymentStatus = PAID
  const paidFilterRes = await fetch(`${BASE_URL}/api/admin/events/bookings?paymentStatus=PAID`, {
    headers: { Cookie: adminCookie },
  });
  const paidFilterJson = await paidFilterRes.json();
  assert(paidFilterJson.data.every((b: any) => b.paymentStatus === "PAID"), "PaymentStatus filter returns only PAID bookings");

  // Filter by bookingStatus = ATTENDED
  const attendedFilterRes = await fetch(`${BASE_URL}/api/admin/events/bookings?bookingStatus=ATTENDED`, {
    headers: { Cookie: adminCookie },
  });
  const attendedFilterJson = await attendedFilterRes.json();
  assert(attendedFilterJson.data.every((b: any) => b.bookingStatus === "ATTENDED"), "BookingStatus filter returns only ATTENDED bookings");

  // Search by keyword "Browne"
  const searchBrowneRes = await fetch(`${BASE_URL}/api/admin/events/bookings?search=Browne`, {
    headers: { Cookie: adminCookie },
  });
  const searchBrowneJson = await searchBrowneRes.json();
  assert(searchBrowneJson.data.length >= 1, "Search 'Browne' found at least 1 record");
  assert(searchBrowneJson.data[0].attendeeName.includes("Browne"), "Matched attendee is Samuel Browne");

  // -------------------------------------------------------------------------
  // Step 6: Verify User Booking History for Seeded Alumni
  // -------------------------------------------------------------------------
  console.log(`\n[Step 6] Testing User Booking History per alumni...`);

  // Lookup Alex Sesay's userId
  const alexUserId = galaBooking.user.id;
  const alexHistoryRes = await fetch(`${BASE_URL}/api/admin/events/users/${alexUserId}/history`, {
    headers: { Cookie: adminCookie },
  });
  assert(alexHistoryRes.status === 200, "User history endpoint returns 200 OK for Alex Sesay");
  const alexHistoryJson = await alexHistoryRes.json();
  assert(Boolean(alexHistoryJson.data.user.name), "History user name is present");
  assert(alexHistoryJson.data.user.email === "demo.alumni@ipam.edu", "History user email is demo.alumni@ipam.edu");
  assert(alexHistoryJson.data.bookingsCount >= 2, "Alex Sesay has at least 2 bookings");
  assert(alexHistoryJson.data.totalSpent >= 115, "Alex Sesay total spent is at least $115.00 ($100 Gala + $15 Mixer)");
  assert(alexHistoryJson.data.totalTickets >= 3, "Alex Sesay total tickets is at least 3");

  // Lookup Dr. Fatmata Kamara's userId
  const fatmataBooking = bookings.find((b) => b.bookingReference === "BK-EVT-GALA-002");
  const fatmataUserId = fatmataBooking.user.id;
  const fatmataHistoryRes = await fetch(`${BASE_URL}/api/admin/events/users/${fatmataUserId}/history`, {
    headers: { Cookie: adminCookie },
  });
  assert(fatmataHistoryRes.status === 200, "User history endpoint returns 200 OK for Dr. Fatmata Kamara");
  const fatmataHistoryJson = await fatmataHistoryRes.json();
  assert(fatmataHistoryJson.data.user.name === "Dr. Fatmata Kamara", "History user name is Dr. Fatmata Kamara");
  assert(fatmataHistoryJson.data.totalSpent >= 100, "Dr. Fatmata Kamara total spent is at least $100.00 ($50 Gala + $50 Fintech)");

  // -------------------------------------------------------------------------
  // Step 7: Live Check-in & Status Transition on Guest Booking
  // -------------------------------------------------------------------------
  console.log(`\n[Step 7] Testing live attendee check-in on walk-in guest booking...`);
  const checkinRes = await fetch(`${BASE_URL}/api/admin/events/bookings/${guestBooking.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      bookingStatus: "ATTENDED",
    }),
  });
  assert(checkinRes.status === 200, "Guest check-in request returns 200 OK");
  const checkinJson = await checkinRes.json();
  assert(checkinJson.data.bookingStatus === "ATTENDED", "Guest booking status transitioned to ATTENDED");
  assert(Boolean(checkinJson.data.attendedAt), "Guest attendedAt timestamp recorded");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL ${passedCount}/${totalCount} SEEDED EVENTS & BOOKINGS VERIFIED!`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
