// Test suite for IPAM-Mobile required APIs
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let authToken = null;
let testEventId = null;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("=================================================");
  console.log("🚀 Testing IPAM-Mobile Required APIs");
  console.log(`Target: ${BASE_URL}`);
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`• ${name}... `);
    try {
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (err) {
      console.log("❌ FAIL");
      console.error(`  Error: ${err.message}`);
      failed++;
    }
  }

  // 1. Mobile Config
  await test("GET /api/mobile/config returns bootstrap config", async () => {
    const res = await request("/api/mobile/config");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data?.data?.appName !== "IPAM Alumni Mobile") {
      throw new Error(`Unexpected appName: ${JSON.stringify(res.data)}`);
    }
    if (!res.data?.data?.features?.virtualPass) {
      throw new Error("Missing features in mobile config");
    }
  });

  // 2. Mobile Home (Public)
  await test("GET /api/mobile/home returns aggregated public feeds", async () => {
    const res = await request("/api/mobile/home");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const { heroSlides, banners, featuredEvents, latestJobs, stats } = res.data?.data || {};
    if (!Array.isArray(heroSlides) || !Array.isArray(banners) || !Array.isArray(featuredEvents)) {
      throw new Error("Missing array fields in mobile home payload");
    }
    if (typeof stats?.totalAlumni !== "number") {
      throw new Error("Missing stats in mobile home payload");
    }
    if (featuredEvents.length > 0) {
      testEventId = featuredEvents[0].id;
    }
  });

  // 3. Forgot Password
  await test("POST /api/auth/forgot-password handles OTP dispatch", async () => {
    const res = await request("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: "demo.alumni@ipam.edu" }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!res.data?.data?.devOtp) throw new Error("Missing devOtp in response");
  });

  // 4. Reset Password
  await test("POST /api/auth/reset-password resets password with OTP", async () => {
    const res = await request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        email: "demo.alumni@ipam.edu",
        otp: "123456",
        newPassword: "Password123!",
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
  });

  // 5. Alumni Login
  await test("POST /api/auth/alumni/login retrieves JWT Bearer token", async () => {
    const res = await request("/api/auth/alumni/login", {
      method: "POST",
      body: JSON.stringify({
        email: "demo.alumni@ipam.edu",
        password: "Password123!",
      }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    authToken = res.data?.data?.token;
    if (!authToken) throw new Error("No token returned in login response");
  });

  // 6. Token Refresh
  await test("POST /api/auth/refresh issues fresh JWT session", async () => {
    const res = await request("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ token: authToken }),
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    if (!res.data?.data?.token) throw new Error("No refreshed token returned");
    authToken = res.data.data.token;
  });

  // 7. Digital Pass Alias
  await test("GET /api/alumni/digital-pass retrieves pass card and QR code", async () => {
    const res = await request("/api/alumni/digital-pass");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    const card = res.data?.data?.card;
    if (!card?.cardNumber || !card?.qrPayload) {
      throw new Error(`Missing cardNumber or qrPayload: ${JSON.stringify(card)}`);
    }
  });

  // 8. Mobile Home (Authenticated with userContext)
  await test("GET /api/mobile/home returns user context when authenticated", async () => {
    const res = await request("/api/mobile/home");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const userContext = res.data?.data?.userContext;
    if (!userContext || !userContext.email) {
      throw new Error(`Expected userContext, got: ${JSON.stringify(userContext)}`);
    }
  });

  // 9. Event RSVP
  await test("POST /api/events/rsvp registers attendee ticket", async () => {
    if (!testEventId) {
      // Find an event ID
      const eventsRes = await request("/api/events");
      const events = eventsRes.data?.data?.events || [];
      if (events.length > 0) testEventId = events[0].id;
    }
    if (!testEventId) {
      console.log(" (Skipping: No events available) ");
      return;
    }
    const res = await request("/api/events/rsvp", {
      method: "POST",
      body: JSON.stringify({
        eventId: testEventId,
        ticketCount: 1,
        attendeeName: "Mobile Demo Attendee",
        notes: "Registered via Mobile API test suite",
      }),
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`Expected 200/201, got ${res.status}: ${JSON.stringify(res.data)}`);
    }
    if (!res.data?.data?.bookingReference) {
      throw new Error("Missing bookingReference in RSVP response");
    }
  });

  // 10. Physical Card Orders (GET & POST)
  await test("GET & POST /api/alumni/orders/card manages physical card orders", async () => {
    const getRes = await request("/api/alumni/orders/card");
    if (getRes.status !== 200) throw new Error(`Expected 200, got ${getRes.status}`);

    const postRes = await request("/api/alumni/orders/card", {
      method: "POST",
      body: JSON.stringify({
        cardType: "PVC_BASIC",
        shippingAddress: {
          street: "15 Percival Street",
          city: "Freetown",
          state: "Western Area",
          postalCode: "00232",
          country: "Sierra Leone",
          phone: "+232 76 112233",
        },
      }),
    });
    if (postRes.status !== 201 && postRes.status !== 200) {
      throw new Error(`Expected 200/201, got ${postRes.status}: ${JSON.stringify(postRes.data)}`);
    }
    if (!postRes.data?.data?.trackingNumber) {
      throw new Error("Missing trackingNumber in card order response");
    }
  });

  // 11. OpenAPI Specification validation
  await test("GET /api/openapi.json exposes Mobile App endpoints and tags", async () => {
    const res = await request("/api/openapi.json");
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const paths = res.data?.paths || {};
    const requiredPaths = [
      "/api/mobile/home",
      "/api/mobile/config",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/refresh",
      "/api/alumni/digital-pass",
      "/api/events/rsvp",
      "/api/alumni/orders/card",
    ];

    for (const p of requiredPaths) {
      if (!paths[p]) throw new Error(`OpenAPI missing required path: ${p}`);
    }
  });

  console.log("\n=================================================");
  console.log(`📊 Result: ${passed} passed, ${failed} failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
