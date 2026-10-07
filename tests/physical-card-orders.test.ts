/**
 * End-to-End Test Suite: Physical Card Orders, Dynamic Admin Pricing,
 * Cash on Delivery (COD), Stripe Payment Gateway, and Admin Settlement.
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
  console.log(`🚀 Starting Physical Card Orders & Pricing Workflow Tests`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // Test 1: Public Card Pricing API
  // -------------------------------------------------------------------------
  console.log(`[Test 1] Fetch public card pricing...`);
  const res1 = await fetch(`${BASE_URL}/api/physical-card-orders/pricing`);
  assert(res1.status === 200, "Pricing endpoint returns 200 OK");
  const json1 = await res1.json();
  assert(!!json1.data, "Response has data object");
  assert(!!json1.data.tiers.STANDARD_PVC, "Standard PVC tier is present");
  assert(!!json1.data.tiers.GOLD_RFID_SMART, "Gold RFID Smart tier is present");
  assert(!!json1.data.tiers.EXECUTIVE_TITANIUM, "Executive Titanium tier is present");
  assert(json1.data.codEnabled === true, "Cash on Delivery is enabled by default");
  assert(json1.data.stripeEnabled === true, "Stripe payment is enabled by default");

  // -------------------------------------------------------------------------
  // Test 2: Admin Login & Price Configuration
  // -------------------------------------------------------------------------
  console.log(`\n[Test 2] Admin authentication and pricing update...`);
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
  assert(Boolean(adminCookieMatch), "Admin session cookie ipam_admin_session set");
  const adminCookie = `ipam_admin_session=${adminCookieMatch![1]}`;

  // Update PVC price to 18 and Gold to 40
  const patchPricingRes = await fetch(`${BASE_URL}/api/admin/settings/card-pricing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      currency: "USD",
      shippingFee: 5,
      codEnabled: true,
      stripeEnabled: true,
      tiers: {
        ...json1.data.tiers,
        STANDARD_PVC: {
          ...json1.data.tiers.STANDARD_PVC,
          price: 18,
        },
        GOLD_RFID_SMART: {
          ...json1.data.tiers.GOLD_RFID_SMART,
          price: 40,
        },
      },
    }),
  });
  assert(patchPricingRes.status === 200, "Admin update card pricing returns 200");
  const patchedJson = await patchPricingRes.json();
  assert(patchedJson.data.tiers.STANDARD_PVC.price === 18, "PVC price updated to 18");
  assert(patchedJson.data.tiers.GOLD_RFID_SMART.price === 40, "Gold price updated to 40");
  assert(patchedJson.data.shippingFee === 5, "Shipping fee updated to 5");

  // Verify public pricing reflects the update
  const verifyPricingRes = await fetch(`${BASE_URL}/api/physical-card-orders/pricing`);
  const verifyPricingJson = await verifyPricingRes.json();
  assert(verifyPricingJson.data.tiers.STANDARD_PVC.price === 18, "Public pricing reflects updated PVC price");
  assert(verifyPricingJson.data.shippingFee === 5, "Public pricing reflects updated shipping fee");

  // -------------------------------------------------------------------------
  // Test 3: Alumni Login
  // -------------------------------------------------------------------------
  console.log(`\n[Test 3] Alumni authentication...`);
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
  assert(Boolean(alumniCookieMatch), "Alumni session cookie ipam_alumni_session set");
  const alumniCookie = `ipam_alumni_session=${alumniCookieMatch![1]}`;

  // -------------------------------------------------------------------------
  // Test 4: Stripe Payment Intent & Order Placement
  // -------------------------------------------------------------------------
  console.log(`\n[Test 4] Initialize Stripe PaymentIntent & Place Stripe Card Order...`);
  const intentRes = await fetch(`${BASE_URL}/api/payments/stripe/create-payment-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      cardTier: "STANDARD_PVC",
      recipientName: "Demo Alumni Alumnus",
    }),
  });
  assert(intentRes.status === 200, "Stripe PaymentIntent created successfully");
  const intentJson = await intentRes.json();
  assert(!!intentJson.data.id, "PaymentIntent ID returned");
  assert(intentJson.data.amount === 23, "Calculated total matches tier price (18) + shipping (5)");

  // Submit order with Stripe
  const stripeOrderRes = await fetch(`${BASE_URL}/api/physical-card-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      cardTier: "STANDARD_PVC",
      recipientName: "Demo Alumni",
      recipientPhone: "+232 76 998877",
      deliveryAddress: "15 George Street, Central Freetown, Sierra Leone",
      paymentMethod: "STRIPE",
      paymentRef: intentJson.data.id,
    }),
  });
  assert(stripeOrderRes.status === 201, "Stripe card order created with 201 Created");
  const stripeOrderJson = await stripeOrderRes.json();
  assert(stripeOrderJson.data.paymentMethod === "STRIPE", "Order paymentMethod is STRIPE");
  assert(stripeOrderJson.data.paymentStatus === "PAID", "Order paymentStatus is immediately PAID");
  assert(stripeOrderJson.data.status === "IN_PRINT_PRESS", "Order status is IN_PRINT_PRESS");
  assert(stripeOrderJson.data.orderNumber.startsWith("PVC-"), "Order number generated with PVC- prefix");

  // -------------------------------------------------------------------------
  // Test 5: Cash on Delivery (COD) Order Placement
  // -------------------------------------------------------------------------
  console.log(`\n[Test 5] Place Cash on Delivery (COD) Card Order...`);
  const codOrderRes = await fetch(`${BASE_URL}/api/physical-card-orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      cardTier: "GOLD_RFID_SMART",
      recipientName: "Demo Alumni",
      recipientPhone: "+232 88 112233",
      deliveryAddress: "Tower Hill Campus Residences, Block C, Room 14",
      paymentMethod: "COD",
    }),
  });
  assert(codOrderRes.status === 201, "COD card order created with 201 Created");
  const codOrderJson = await codOrderRes.json();
  assert(codOrderJson.data.paymentMethod === "COD", "Order paymentMethod is COD");
  assert(codOrderJson.data.paymentStatus === "PENDING_COD", "Order paymentStatus is PENDING_COD");
  assert(Number(codOrderJson.data.amount) === 45, "Calculated total matches Gold tier (40) + shipping (5)");
  const codOrderId = codOrderJson.data.id;

  // -------------------------------------------------------------------------
  // Test 6: Admin Inspects and Marks COD Order Paid / Collected
  // -------------------------------------------------------------------------
  console.log(`\n[Test 6] Admin marks COD payment as settled upon courier delivery...`);
  const patchCodRes = await fetch(`${BASE_URL}/api/admin/physical-card-orders/${codOrderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      paymentStatus: "PAID",
      status: "DELIVERED",
      trackingCode: "COD-USL-9921",
    }),
  });
  assert(patchCodRes.status === 200, "Admin update physical card order returns 200 OK");
  const patchCodJson = await patchCodRes.json();
  assert(patchCodJson.data.paymentStatus === "PAID", "COD order paymentStatus successfully transitioned to PAID");
  assert(patchCodJson.data.status === "DELIVERED", "Order status updated to DELIVERED");
  assert(patchCodJson.data.trackingCode === "COD-USL-9921", "Tracking code saved");

  // -------------------------------------------------------------------------
  // Test 7: Verify Alumni Order History
  // -------------------------------------------------------------------------
  console.log(`\n[Test 7] Verify alumni can retrieve their card orders...`);
  const alumniOrdersRes = await fetch(`${BASE_URL}/api/physical-card-orders`, {
    headers: { Cookie: alumniCookie },
  });
  assert(alumniOrdersRes.status === 200, "Fetch alumni orders returns 200 OK");
  const alumniOrdersJson = await alumniOrdersRes.json();
  assert(Array.isArray(alumniOrdersJson.data), "Orders is an array");
  assert(alumniOrdersJson.data.length >= 2, "Alumni orders list contains both placed orders");

  // -------------------------------------------------------------------------
  // Test 8: Verify Admin ID Card Issuance Desk Dynamic Ingestion of Alumni Requests
  // -------------------------------------------------------------------------
  console.log(`\n[Test 8] Verify Admin Issuance Desk dynamic feed includes alumni portal orders...`);
  const adminDeskRes = await fetch(`${BASE_URL}/api/admin/id-cards`, {
    headers: {
      Cookie: adminCookie,
      "Cache-Control": "no-cache",
    },
  });
  assert(adminDeskRes.status === 200, "Admin ID card desk API returns 200 OK");
  const adminDeskJson = await adminDeskRes.json();
  assert(Array.isArray(adminDeskJson.data), "Admin ID card desk orders is an array");
  
  const foundStripeOrder = adminDeskJson.data.find(
    (o: { orderNumber: string }) => o.orderNumber === stripeOrderJson.data.orderNumber
  );
  assert(Boolean(foundStripeOrder), "Stripe alumni order dynamically appears in Admin ID Card Desk");
  assert(foundStripeOrder.sourceType === "ALUMNI_PORTAL", "Stripe order identified as ALUMNI_PORTAL sourceType");
  assert(foundStripeOrder.paymentStatus === "PAID", "Stripe order paymentStatus is PAID in admin desk");
  assert(foundStripeOrder.cardTier === "STANDARD_PVC", "Stripe order tier is STANDARD_PVC");

  const foundCodOrder = adminDeskJson.data.find(
    (o: { orderNumber: string }) => o.orderNumber === codOrderJson.data.orderNumber
  );
  assert(Boolean(foundCodOrder), "COD alumni order dynamically appears in Admin ID Card Desk");
  assert(foundCodOrder.sourceType === "ALUMNI_PORTAL", "COD order identified as ALUMNI_PORTAL sourceType");
  assert(foundCodOrder.status === "DELIVERED", "COD order reflects DELIVERED status in admin desk");
  assert(foundCodOrder.trackingCode === "COD-USL-9921", "COD order reflects updated tracking code in admin desk");

  // -------------------------------------------------------------------------
  // Test 9: Verify Dynamic Payment Gateway and Price Options Toggle
  // -------------------------------------------------------------------------
  console.log(`\n[Test 9] Verify dynamic payment gateway toggling and pricing agility...`);
  // Admin temporarily disables COD
  const toggleCodRes = await fetch(`${BASE_URL}/api/admin/settings/card-pricing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      codEnabled: false,
    }),
  });
  assert(toggleCodRes.status === 200, "Admin disabled COD gateway successfully");

  // Verify public pricing immediately reflects COD disabled without restart
  const publicPricingDisabledRes = await fetch(`${BASE_URL}/api/physical-card-orders/pricing`, {
    headers: { "Cache-Control": "no-cache" },
  });
  const publicPricingDisabledJson = await publicPricingDisabledRes.json();
  assert(publicPricingDisabledJson.data.codEnabled === false, "Public pricing immediately reflects COD disabled");

  // Re-enable COD
  const reEnableCodRes = await fetch(`${BASE_URL}/api/admin/settings/card-pricing`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      codEnabled: true,
    }),
  });
  assert(reEnableCodRes.status === 200, "Admin re-enabled COD gateway successfully");

  const publicPricingEnabledRes = await fetch(`${BASE_URL}/api/physical-card-orders/pricing`, {
    headers: { "Cache-Control": "no-cache" },
  });
  const publicPricingEnabledJson = await publicPricingEnabledRes.json();
  assert(publicPricingEnabledJson.data.codEnabled === true, "Public pricing immediately reflects COD re-enabled");

  console.log(`\n======================================================`);
  console.log(`🎉 All tests passed successfully! (${passedCount}/${totalCount})`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

export {};
