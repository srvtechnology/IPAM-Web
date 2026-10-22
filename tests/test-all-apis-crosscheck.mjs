/**
 * Comprehensive API Test Suite & Cross-Check for Flutter Mobile App & Swagger
 * Tests 13 distinct API domains with Bearer authentication, request/response validation,
 * data persistence cross-checks, and error state handling.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let authToken = "";
let currentUserId = "";
let currentStudentId = "";
let testEventId = "";
let testJobId = "";
let testTargetAlumniId = "";
let testBusinessId = "";
let testCardOrderId = "";
let testBookingRef = "";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failedTests++;
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  }
  passedTests++;
  console.log(`  ✓ ${message}`);
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type") || "";
  let data = null;
  if (contentType.includes("application/json")) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  return { status: res.status, headers: res.headers, data };
}

async function runSuite() {
  console.log("=======================================================================");
  console.log("  IPAM Alumni Unified — Full API Test Suite & Cross-Check (Flutter App)");
  console.log("=======================================================================\n");

  // =========================================================================
  // DOMAIN 1: SWAGGER & OPENAPI DOCUMENTATION
  // =========================================================================
  console.log("▶ [DOMAIN 1] Swagger & OpenAPI Specification");
  {
    const res = await request("/api/openapi.json");
    assert(res.status === 200, "GET /api/openapi.json returns HTTP 200");
    assert(res.data?.openapi === "3.0.3", "OpenAPI version is 3.0.3");
    assert(res.data?.info?.title === "IPAM Alumni Unified REST API", "OpenAPI title matches");
    assert(Array.isArray(res.data?.tags) && res.data.tags.length >= 10, `OpenAPI includes >= 10 tags (found ${res.data?.tags?.length})`);
    assert(Object.keys(res.data?.paths || {}).length >= 20, `OpenAPI includes >= 20 endpoint paths (found ${Object.keys(res.data?.paths || {}).length})`);
    assert(res.data?.components?.securitySchemes?.BearerAuth?.scheme === "bearer", "OpenAPI defines BearerAuth scheme");

    const docsRes = await request("/api-docs");
    assert(docsRes.status === 200, "GET /api-docs returns HTTP 200");
    assert(typeof docsRes.data === "string" && docsRes.data.includes("swagger-ui"), "GET /api-docs renders Swagger UI container");
    assert(typeof docsRes.data === "string" && docsRes.data.includes("IPAM Alumni Unified"), "GET /api-docs contains IPAM Alumni branding");

    const aliasRes = await request("/api/docs");
    assert(aliasRes.status === 200, "GET /api/docs (alias) returns HTTP 200");
    assert(aliasRes.data?.openapi === "3.0.3", "GET /api/docs returns valid OpenAPI JSON");

    const swaggerRedirect = await fetch(`${BASE_URL}/swagger`, { redirect: "manual" });
    assert(swaggerRedirect.status === 308, "GET /swagger returns 308 Permanent Redirect");
    const location = swaggerRedirect.headers.get("location") || "";
    assert(location.includes("/api-docs"), `GET /swagger redirects to /api-docs (got ${location})`);
  }

  // =========================================================================
  // DOMAIN 2: AUTHENTICATION & BEARER TOKEN
  // =========================================================================
  console.log("\n▶ [DOMAIN 2] Authentication & Bearer Token Lifecycle");
  {
    // Test invalid login credentials
    const badLogin = await request("/api/auth/alumni/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo.alumni@ipam.edu", password: "WrongPassword999!" }),
    });
    assert(badLogin.status === 401, "POST /api/auth/alumni/login with invalid password returns 401");

    // Test valid alumni login
    const loginRes = await request("/api/auth/alumni/login", {
      method: "POST",
      body: JSON.stringify({
        email: "demo.alumni@ipam.edu",
        password: "Password123!",
        rememberMe: true,
      }),
    });
    assert(loginRes.status === 200, "POST /api/auth/alumni/login returns HTTP 200");
    const user = loginRes.data?.data;
    assert(typeof user?.token === "string" && user.token.length > 20, "Alumni login returns signed JWT token for Flutter");
    assert(user?.email === "demo.alumni@ipam.edu", "Login returns matching user email");
    assert(typeof user?.id === "string", "Login returns user CUID");
    assert(typeof user?.studentId === "string", "Login returns user studentId / regNo");
    assert(user?.status === "APPROVED", "Demo user is in APPROVED status");

    authToken = user.token;
    currentUserId = user.id;
    currentStudentId = user.studentId;

    // Test /api/auth/alumni/me with Bearer token
    const meRes = await request("/api/auth/alumni/me");
    assert(meRes.status === 200, "GET /api/auth/alumni/me with Bearer token returns HTTP 200");
    assert(meRes.data?.data?.id === currentUserId, "Session user ID matches logged-in user ID");

    // Test unauthenticated access
    const unauthRes = await fetch(`${BASE_URL}/api/auth/alumni/me`);
    assert(unauthRes.status === 401, "GET /api/auth/alumni/me without Authorization header returns 401");

    // Test password change cycle
    const badCurrent = await request("/api/auth/alumni/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "IncorrectOldPassword", newPassword: "NewSecretPassword123!" }),
    });
    assert(badCurrent.status === 400, "POST /api/auth/alumni/change-password with bad old password returns 400");

    const shortNew = await request("/api/auth/alumni/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "Password123!", newPassword: "short" }),
    });
    assert(shortNew.status === 400, "POST /api/auth/alumni/change-password with < 8 chars returns 400 validation error");

    const validChange = await request("/api/auth/alumni/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "Password123!", newPassword: "NewStrongPass123!" }),
    });
    assert(validChange.status === 200, "POST /api/auth/alumni/change-password successfully changes password");

    // Cross-check: login with new password
    const loginWithNew = await request("/api/auth/alumni/login", {
      method: "POST",
      body: JSON.stringify({ email: "demo.alumni@ipam.edu", password: "NewStrongPass123!" }),
    });
    assert(loginWithNew.status === 200, "Cross-check: Alumni login succeeds with new password");

    // Revert back so standard test credentials stay consistent
    const revertChange = await request("/api/auth/alumni/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "NewStrongPass123!", newPassword: "Password123!" }),
    });
    assert(revertChange.status === 200, "Reverted demo user password back to Password123!");

    // Test Alumni Registration validation checks
    const badOtpReg = await request("/api/auth/alumni/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Test User",
        email: "unique.test@ipam.edu",
        studentId: "IPAM-2026-9999",
        password: "Password123!",
        otp: "000000",
        classYear: 2024,
        degree: "BSc",
        major: "Accounting",
      }),
    });
    assert(badOtpReg.status === 400, "POST /api/auth/alumni/register with invalid OTP returns 400");

    const duplicateReg = await request("/api/auth/alumni/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Alex Sesay",
        email: "demo.alumni@ipam.edu",
        studentId: "IPAM-2015-0042",
        password: "Password123!",
        otp: "123456",
        classYear: 2015,
        degree: "BSc",
        major: "Applied Accounting",
      }),
    });
    assert(duplicateReg.status === 409, "POST /api/auth/alumni/register with existing approved email returns 409 Conflict");

    // Test Admin Login with Bearer Token
    const adminLoginRes = await request("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({
        email: "demo.admin@ipam.edu",
        password: "Password123!",
      }),
    });
    assert(adminLoginRes.status === 200, "POST /api/auth/admin/login returns HTTP 200");
    const adminToken = adminLoginRes.data?.data?.token;
    assert(typeof adminToken === "string" && adminToken.length > 20, "Admin login returns signed JWT token");

    // Test Admin endpoint with Admin Bearer Token
    const adminMeRes = await fetch(`${BASE_URL}/api/auth/admin/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminMeRes.status === 200, "GET /api/auth/admin/me with Bearer token returns HTTP 200");
    const adminMeData = await adminMeRes.json();
    assert(adminMeData.data?.admin?.email === "demo.admin@ipam.edu", "Admin email matches authenticated user");

    const adminBizRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminBizRes.status === 200, "GET /api/admin/businesses with Admin Bearer token returns HTTP 200");
  }

  // =========================================================================
  // DOMAIN 3: ALUMNI VIRTUAL ID PASS & QR SCANNER VALIDATION
  // =========================================================================
  console.log("\n▶ [DOMAIN 3] Virtual ID Pass & QR Code Verification");
  {
    const passRes = await request("/api/alumni/pass");
    assert(passRes.status === 200, "GET /api/alumni/pass returns HTTP 200");
    const pass = passRes.data?.data;
    assert(pass?.id === currentUserId, "Virtual pass ID matches authenticated user");
    assert(pass?.studentId === currentStudentId, "Virtual pass contains studentId / regNo");
    assert(typeof pass?.qrPayload === "string" && pass.qrPayload.length > 10, "Virtual pass returns JSON qrPayload for QrImageView");

    // Parse qrPayload and cross-check payload integrity
    const qrData = JSON.parse(pass.qrPayload);
    assert(qrData.schema === "IPAM_PASS_V1", "qrPayload contains valid schema version");
    assert(qrData.id === currentUserId, "qrPayload contains matching user ID");
    assert(qrData.studentId === currentStudentId, "qrPayload contains matching studentId");

    // Cross-check: Verify pass using user ID (CUID)
    const verifyById = await request(`/api/alumni/pass/verify/${currentUserId}`);
    assert(verifyById.status === 200, `GET /api/alumni/pass/verify/${currentUserId} returns HTTP 200`);
    assert(verifyById.data?.data?.valid === true, "Verification by user ID returns valid: true");
    assert(verifyById.data?.data?.status === "APPROVED", "Verification returns APPROVED status");

    // Cross-check: Verify pass using student registration ID
    const verifyByStudentId = await request(`/api/alumni/pass/verify/${currentStudentId}`);
    assert(verifyByStudentId.status === 200, `GET /api/alumni/pass/verify/${currentStudentId} returns HTTP 200`);
    assert(verifyByStudentId.data?.data?.valid === true, "Verification by student registration ID returns valid: true");

    // Cross-check: Shortcut alias /api/alumni/verify/[id]
    const aliasVerify = await request(`/api/alumni/verify/${currentStudentId}`);
    assert(aliasVerify.status === 200, `GET /api/alumni/verify/${currentStudentId} (alias) returns HTTP 200`);
    assert(aliasVerify.data?.data?.valid === true, "Alias verification returns valid: true");

    // Negative check: Invalid student ID
    const invalidVerify = await request("/api/alumni/pass/verify/NON-EXISTENT-ID-9999");
    assert(invalidVerify.status === 404, "Verification of non-existent ID returns 404");
  }

  // =========================================================================
  // DOMAIN 4: PROFILE MANAGEMENT
  // =========================================================================
  console.log("\n▶ [DOMAIN 4] Profile & Skills Management");
  {
    const profileRes = await request("/api/profile");
    assert(profileRes.status === 200, "GET /api/profile returns HTTP 200");
    const profile = profileRes.data?.data?.profile;
    assert(profile && typeof profile.name === "string", "Profile returns member name");

    // Update profile with test bio & skills
    const testLocation = "Freetown Central, SL";
    const updateRes = await request("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        name: profile.name,
        location: testLocation,
        skills: ["Flutter", "Dart", "TypeScript", "Docker"],
      }),
    });
    assert(updateRes.status === 200, "PATCH /api/profile updates location and skills");

    // Cross-check: verify changes persisted
    const verifyProfile = await request("/api/profile");
    assert(verifyProfile.data?.data?.profile?.location === testLocation, "Cross-check: Updated location persisted in database");
  }

  // =========================================================================
  // DOMAIN 5: EVENTS & TICKET REGISTRATIONS
  // =========================================================================
  console.log("\n▶ [DOMAIN 5] Events, Bookings & Cancellations");
  {
    const eventsRes = await request("/api/events");
    assert(eventsRes.status === 200, "GET /api/events returns HTTP 200");
    const events = eventsRes.data?.data || [];
    assert(Array.isArray(events) && events.length > 0, `Events list returned ${events.length} events`);
    const upcoming = events.find((e) => new Date(e.date) > new Date()) || events[0];
    testEventId = upcoming.id;

    // View specific event detail
    const eventDetail = await request(`/api/events/${testEventId}`);
    assert(eventDetail.status === 200, `GET /api/events/${testEventId} returns HTTP 200`);
    assert(eventDetail.data?.data?.id === testEventId, "Event detail ID matches requested event");

    // Register / RSVP for event
    const regRes = await request(`/api/events/${testEventId}/register`, {
      method: "POST",
      body: JSON.stringify({
        ticketCount: 1,
        attendeeName: "Alex Sesay Test",
        attendeeEmail: "demo.alumni@ipam.edu",
      }),
    });
    assert(regRes.status === 200 || regRes.status === 201, "POST /api/events/[id]/register returns 200/201");
    testBookingRef = regRes.data?.data?.bookingReference;
    assert(typeof testBookingRef === "string" && testBookingRef.startsWith("BK-EVT-"), `Registration generated booking reference: ${testBookingRef}`);

    // Cross-check: View my registrations list
    const myRegs = await request("/api/events/my-registrations");
    assert(myRegs.status === 200, "GET /api/events/my-registrations returns HTTP 200");
    const bookings = myRegs.data?.data || [];
    const foundBooking = bookings.find((b) => b.bookingReference === testBookingRef);
    assert(!!foundBooking, "Cross-check: Newly registered ticket appears in my-registrations list");

    // Cross-check: View single booking ticket detail
    const ticketDetail = await request(`/api/events/my-registrations/${testBookingRef}`);
    assert(ticketDetail.status === 200, `GET /api/events/my-registrations/${testBookingRef} returns ticket detail`);
    assert(ticketDetail.data?.data?.bookingReference === testBookingRef, "Ticket detail bookingReference matches");

    // Cancel ticket booking
    const cancelRes = await request(`/api/events/my-registrations/${testBookingRef}`, {
      method: "DELETE",
    });
    assert(cancelRes.status === 200, `DELETE /api/events/my-registrations/${testBookingRef} cancels ticket registration`);

    // Cross-check: Verify ticket status is CANCELLED
    const cancelledTicket = await request(`/api/events/my-registrations/${testBookingRef}`);
    assert(cancelledTicket.data?.data?.bookingStatus === "CANCELLED", "Cross-check: Ticket status changed to CANCELLED in database");

    // Submit event proposal
    const proposalRes = await request("/api/event-proposals", {
      method: "POST",
      body: JSON.stringify({
        title: "Mobile App Hackathon 2026",
        category: "CAREER_WORKSHOP",
        format: "HYBRID",
        location: "IPAM Innovation Hub",
        description: "A 2-day hackathon building Flutter mobile apps for civic tech.",
        organizerEmail: "demo.alumni@ipam.edu",
      }),
    });
    assert(proposalRes.status === 200 || proposalRes.status === 201, "POST /api/event-proposals submits new proposal");
  }

  // =========================================================================
  // DOMAIN 6: JOBS & CAREERS
  // =========================================================================
  console.log("\n▶ [DOMAIN 6] Jobs Directory, Bookmarks & Applications");
  {
    const jobsRes = await request("/api/jobs");
    assert(jobsRes.status === 200, "GET /api/jobs returns HTTP 200");
    const jobs = jobsRes.data?.data || [];
    assert(Array.isArray(jobs) && jobs.length > 0, `Jobs list returned ${jobs.length} openings`);
    testJobId = jobs[0].id;

    // View job detail
    const jobDetail = await request(`/api/jobs/${testJobId}`);
    assert(jobDetail.status === 200, `GET /api/jobs/${testJobId} returns HTTP 200`);

    // Bookmark / Save job
    const saveJob = await request(`/api/jobs/${testJobId}/save`, { method: "POST" });
    assert(saveJob.status === 200, "POST /api/jobs/[id]/save toggles save status");
    const isSaved = saveJob.data?.data?.saved;

    // If it was already saved, save again to ensure isSaved = true
    if (!isSaved) {
      const reSave = await request(`/api/jobs/${testJobId}/save`, { method: "POST" });
      assert(reSave.data?.data?.saved === true, "Toggled save to true");
    }

    // Cross-check: Verify job appears in /api/jobs/saved
    const savedJobs = await request("/api/jobs/saved");
    assert(savedJobs.status === 200, "GET /api/jobs/saved returns HTTP 200");
    const savedList = savedJobs.data?.data || [];
    assert(savedList.some((s) => s.job?.id === testJobId), "Cross-check: Saved job is listed in /api/jobs/saved");

    // Unsave job and cross-check removal
    await request(`/api/jobs/${testJobId}/save`, { method: "POST" });
    const afterUnsave = await request("/api/jobs/saved");
    assert(!afterUnsave.data?.data?.some((s) => s.job?.id === testJobId), "Cross-check: Unsaved job is removed from /api/jobs/saved");

    // Apply to job opening
    const applyRes = await request(`/api/jobs/${testJobId}/apply`, {
      method: "POST",
      body: JSON.stringify({
        candidateName: "Alex Sesay Test",
        email: "demo.alumni@ipam.edu",
        phone: "+232 76 112233",
        coverNote: "Excited to apply for this position through the mobile app.",
        experienceYears: 4,
        skills: ["Flutter", "TypeScript"],
      }),
    });
    assert(applyRes.status === 200 || applyRes.status === 201, "POST /api/jobs/[id]/apply submits job application");

    // Cross-check: Verify application status on job
    const appStatusRes = await request(`/api/jobs/${testJobId}/apply`);
    assert(appStatusRes.status === 200, "GET /api/jobs/[id]/apply returns application status");
    assert(!!appStatusRes.data?.data?.application, "Application record exists for this job");

    // Cross-check: My applications list contains this application
    const myApps = await request("/api/jobs/my-applications");
    assert(myApps.status === 200, "GET /api/jobs/my-applications returns HTTP 200");
    const appList = myApps.data?.data?.applications || myApps.data?.data || [];
    assert(Array.isArray(appList) && appList.some((a) => a.jobId === testJobId), "Cross-check: Applied job is listed in my-applications");
  }

  // =========================================================================
  // DOMAIN 7: ALUMNI DIRECTORY & NETWORKING
  // =========================================================================
  console.log("\n▶ [DOMAIN 7] Alumni Directory, Bookmarks & Notifications");
  {
    const alumniRes = await request("/api/alumni");
    assert(alumniRes.status === 200, "GET /api/alumni returns HTTP 200");
    const alumniList = alumniRes.data?.data || [];
    assert(Array.isArray(alumniList) && alumniList.length > 0, `Alumni directory returned ${alumniList.length} members`);

    // Find someone other than ourselves
    const otherAlumni = alumniList.find((a) => a.email !== "demo.alumni@ipam.edu");
    assert(!!otherAlumni, "Found other alumni member in directory");
    testTargetAlumniId = otherAlumni.id;

    // View public profile
    const memberDetail = await request(`/api/alumni/${testTargetAlumniId}`);
    assert(memberDetail.status === 200, `GET /api/alumni/${testTargetAlumniId} returns HTTP 200`);

    // Connect / Bookmark alumni
    const connectRes = await request(`/api/alumni/${testTargetAlumniId}/connect`, { method: "POST" });
    assert(connectRes.status === 200 || connectRes.status === 201, "POST /api/alumni/[id]/connect connects alumni");

    // Cross-check: Verify connection in /api/alumni/bookmarks
    const bookmarksRes = await request("/api/alumni/bookmarks");
    assert(bookmarksRes.status === 200, "GET /api/alumni/bookmarks returns HTTP 200");
    const bookmarks = bookmarksRes.data?.data || [];
    assert(bookmarks.some((b) => b.alumniId === testTargetAlumniId), "Cross-check: Connected alumni is present in bookmarks");

    // Disconnect alumni
    const disconnectRes = await request(`/api/alumni/${testTargetAlumniId}/connect`, { method: "DELETE" });
    assert(disconnectRes.status === 200, "DELETE /api/alumni/[id]/connect disconnects alumni");

    // Cross-check: Verify removal from bookmarks
    const afterDisconnect = await request("/api/alumni/bookmarks");
    assert(!afterDisconnect.data?.data?.some((b) => b.alumniId === testTargetAlumniId), "Cross-check: Disconnected alumni is removed from bookmarks");

    // Broadcast notifications
    const notifs = await request("/api/alumni/notifications");
    assert(notifs.status === 200, "GET /api/alumni/notifications returns HTTP 200");
    assert(typeof notifs.data?.data?.total === "number", "Notifications payload returns total count");
  }

  // =========================================================================
  // DOMAIN 8: BUSINESSES & MARKETPLACE
  // =========================================================================
  console.log("\n▶ [DOMAIN 8] Alumni Businesses & Marketplace");
  {
    const bizList = await request("/api/businesses");
    assert(bizList.status === 200, "GET /api/businesses returns HTTP 200");

    // Create test business listing
    const createBiz = await request("/api/businesses", {
      method: "POST",
      body: JSON.stringify({
        name: `Automated Test Enterprises ${Date.now()}`,
        tagline: "Building scalable technology solutions",
        industry: "Information Technology",
        category: "Technology",
        location: "Freetown, Sierra Leone",
        description: "Pioneering Flutter mobile and cloud software systems.",
        founders: "Alex Sesay (Class of '15)",
        classYear: "2015",
        contactEmail: "biz@testenterprises.sl",
        website: "https://testenterprises.sl",
      }),
    });
    assert(createBiz.status === 201, "POST /api/businesses creates new business listing");
    testBusinessId = createBiz.data?.data?.id;
    assert(typeof testBusinessId === "string", "Created business has valid ID");

    // Cross-check: Fetch single business
    const fetchBiz = await request(`/api/businesses/${testBusinessId}`);
    assert(fetchBiz.status === 200, `GET /api/businesses/${testBusinessId} returns business details`);

    // Update business
    const updateBiz = await request(`/api/businesses/${testBusinessId}`, {
      method: "PATCH",
      body: JSON.stringify({ tagline: "Updated Enterprise Tagline" }),
    });
    assert(updateBiz.status === 200, "PATCH /api/businesses/[id] updates business listing");

    // Clean up test business
    const deleteBiz = await request(`/api/businesses/${testBusinessId}`, { method: "DELETE" });
    assert(deleteBiz.status === 200, "DELETE /api/businesses/[id] deletes business listing");
  }

  // =========================================================================
  // DOMAIN 9: PHYSICAL SMART ID CARDS
  // =========================================================================
  console.log("\n▶ [DOMAIN 9] Physical Smart ID Card Orders");
  {
    // Pricing configuration
    const pricingRes = await request("/api/physical-card-orders/pricing");
    assert(pricingRes.status === 200, "GET /api/physical-card-orders/pricing returns HTTP 200");
    const pricing = pricingRes.data?.data;
    assert(pricing?.tiers?.STANDARD_PVC && pricing?.tiers?.GOLD_RFID_SMART, "Pricing contains card tier configurations");

    // Place a Cash on Delivery (COD) physical card order
    const orderRes = await request("/api/physical-card-orders", {
      method: "POST",
      body: JSON.stringify({
        cardTier: "GOLD_RFID_SMART",
        recipientName: "Alex Sesay",
        recipientPhone: "+232 76 112233",
        deliveryAddress: "14 Pademba Road, Freetown",
        paymentMethod: "COD",
      }),
    });
    assert(orderRes.status === 201, "POST /api/physical-card-orders creates physical card order");
    testCardOrderId = orderRes.data?.data?.id;
    const orderNumber = orderRes.data?.data?.orderNumber;
    assert(typeof orderNumber === "string" && orderNumber.startsWith("PVC-"), "Order has valid PVC- order number");

    // Cross-check: View my card orders list
    const myOrders = await request("/api/physical-card-orders");
    assert(myOrders.status === 200, "GET /api/physical-card-orders returns HTTP 200");
    const foundOrder = (myOrders.data?.data || []).find((o) => o.id === testCardOrderId);
    assert(!!foundOrder, "Cross-check: Newly placed card order is in my orders list");

    // Cross-check: Track specific card order
    const trackOrder = await request(`/api/physical-card-orders/${testCardOrderId}`);
    assert(trackOrder.status === 200, `GET /api/physical-card-orders/${testCardOrderId} tracks order status`);
    assert(trackOrder.data?.data?.status === "IN_PRINT_PRESS", "Order status is IN_PRINT_PRESS");
  }

  // =========================================================================
  // DOMAIN 10: DONATIONS & GIVING
  // =========================================================================
  console.log("\n▶ [DOMAIN 10] Donations & Online Giving");
  {
    const donationsRes = await request("/api/donations");
    assert(donationsRes.status === 200, "GET /api/donations returns HTTP 200");

    // Make donation
    const donateRes = await request("/api/donations", {
      method: "POST",
      body: JSON.stringify({
        donorName: "Alex Sesay",
        donorEmail: "demo.alumni@ipam.edu",
        donorPhone: "+232 76 112233",
        amount: 25,
        currency: "USD",
        fund: "STEM Laboratory Fund",
        isAnonymous: false,
        message: "Automated test gift for faculty advancement.",
      }),
    });
    assert(donateRes.status === 201, "POST /api/donations records new donation");

    // Cross-check: My giving history
    const myGiving = await request("/api/donations?mine=true");
    assert(myGiving.status === 200, "GET /api/donations?mine=true returns user giving history");
    assert(Array.isArray(myGiving.data?.data) && myGiving.data.data.length > 0, "Giving history contains recorded donations");
  }

  // =========================================================================
  // DOMAIN 11: MEMBERSHIP & SUBSCRIPTIONS
  // =========================================================================
  console.log("\n▶ [DOMAIN 11] Membership & Subscriptions");
  {
    const subRes = await request("/api/subscription");
    assert(subRes.status === 200, "GET /api/subscription returns HTTP 200");
    const subData = subRes.data?.data;
    assert(typeof subData?.currentTier === "string", "Subscription returns currentTier");
    assert(subData?.availableTiers?.STANDARD, "Subscription returns available dynamic tiers");

    // Toggle auto-renew
    const toggleRes = await request("/api/subscription", {
      method: "PATCH",
      body: JSON.stringify({ autoRenew: false }),
    });
    assert(toggleRes.status === 200, "PATCH /api/subscription toggles auto-renew");

    // Revert auto-renew to true
    await request("/api/subscription", {
      method: "PATCH",
      body: JSON.stringify({ autoRenew: true }),
    });
  }

  // =========================================================================
  // DOMAIN 12: CONTENT, DISCOVERY & LEADERSHIP
  // =========================================================================
  console.log("\n▶ [DOMAIN 12] Content Discovery, Leadership & Banners");
  {
    const leadersRes = await request("/api/leadership");
    assert(leadersRes.status === 200, "GET /api/leadership returns HTTP 200");
    assert(Array.isArray(leadersRes.data?.data) && leadersRes.data.data.length > 0, "Leadership returns council members");

    const heroRes = await request("/api/hero-slides");
    assert(heroRes.status === 200, "GET /api/hero-slides returns HTTP 200");
    assert(Array.isArray(heroRes.data?.data), "Hero slides returns array");

    const bannersRes = await request("/api/banners");
    assert(bannersRes.status === 200, "GET /api/banners returns HTTP 200");

    const trackImpression = await request("/api/banners/impressions", {
      method: "POST",
      body: JSON.stringify({ bannerIds: [] }),
    });
    assert(trackImpression.status === 200, "POST /api/banners/impressions records view metrics");
  }

  // =========================================================================
  // DOMAIN 13: FILE & MEDIA UPLOADS
  // =========================================================================
  console.log("\n▶ [DOMAIN 13] File & Media Uploads");
  {
    // Test base64 image upload
    const uploadRes = await request("/api/upload", {
      method: "POST",
      body: JSON.stringify({
        file: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        filename: "test_crosscheck_avatar.png",
      }),
    });
    assert(uploadRes.status === 201, "POST /api/upload returns HTTP 201 with stored file info");
    const uploadedUrl = uploadRes.data?.data?.url;
    assert(typeof uploadedUrl === "string" && uploadedUrl.startsWith("/uploads/"), `Uploaded asset has public path: ${uploadedUrl}`);

    // Cross-check: Retrieve the uploaded asset via static route
    const assetRes = await fetch(`${BASE_URL}${uploadedUrl}`);
    assert(assetRes.status === 200, `GET ${uploadedUrl} serves uploaded asset with HTTP 200`);
    const mimeType = assetRes.headers.get("content-type") || "";
    assert(mimeType.includes("image/png"), `Asset returned correct Content-Type (got ${mimeType})`);

    // Negative test: invalid file type
    const invalidUpload = await request("/api/upload", {
      method: "POST",
      body: JSON.stringify({
        file: "data:text/plain;base64,SGVsbG8gV29ybGQ=",
        filename: "malicious.sh",
      }),
    });
    assert(invalidUpload.status === 400, "POST /api/upload rejects disallowed MIME types with 400");
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n=======================================================================");
  console.log(`  🎉 Test Suite Finished: ${passedTests}/${totalTests} Passed (0 Failed)`);
  console.log("=======================================================================\n");
}

runSuite().catch((err) => {
  console.error("\n❌ Test Suite Aborted with Error:", err);
  process.exit(1);
});
