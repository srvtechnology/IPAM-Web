// End-to-end verification of Donation & Giving flow with Phone Number, Guest support, and Admin records
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log(`Starting Donation & Admin Records Test against ${BASE_URL}...\n`);

  // ---------------------------------------------------------
  // TEST 1: Phone number validation required
  // ---------------------------------------------------------
  console.log("TEST 1: Verifying phone number is required in donation validation...");
  const invalidRes = await fetch(`${BASE_URL}/api/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      donorName: "Missing Phone Donor",
      donorEmail: "test.missing@example.com",
      amount: 50,
      currency: "USD",
      fund: "Undergraduate & Merit Scholarship Endowment",
    }),
  });
  const invalidJson = await invalidRes.json();
  if (invalidRes.status === 400 && invalidJson.error?.includes("Validation failed")) {
    console.log("✅ Correctly rejected donation without phone number (400 Bad Request).\n");
  } else {
    throw new Error(`Expected 400 validation failure, got ${invalidRes.status}: ${JSON.stringify(invalidJson)}`);
  }

  // ---------------------------------------------------------
  // TEST 2: Guest Donation (Without login)
  // ---------------------------------------------------------
  console.log("TEST 2: Making donation as a Guest (unauthenticated, no session cookie)...");
  const guestPayload = {
    donorName: "Aminata Kamara (Guest Donor)",
    donorEmail: "aminata.guest@example.com",
    donorPhone: "+232 76 987654",
    donorClass: "Friend of IPAM",
    amount: 175,
    currency: "USD",
    fund: "Undergraduate & Merit Scholarship Endowment",
    frequency: "ONE_TIME",
    paymentMethod: "MOMO",
    isDedication: true,
    dedicationName: "In honor of Late Dr. S.B. Sesay",
    isAnonymous: false,
  };

  const guestRes = await fetch(`${BASE_URL}/api/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(guestPayload),
  });
  const guestJson = await guestRes.json();
  if (!guestRes.ok) {
    throw new Error(`Guest donation failed (${guestRes.status}): ${JSON.stringify(guestJson)}`);
  }

  const guestDonation = guestJson.data;
  console.log("Guest Donation Response:", guestDonation);
  if (guestDonation.userId !== null && guestDonation.userId !== undefined) {
    throw new Error(`Expected guest donation to have null userId, got: ${guestDonation.userId}`);
  }
  if (guestDonation.donorPhone !== "+232 76 987654") {
    throw new Error(`Expected donorPhone '+232 76 987654', got: ${guestDonation.donorPhone}`);
  }
  if (!guestDonation.paymentRef?.startsWith("DON-")) {
    throw new Error(`Invalid paymentRef: ${guestDonation.paymentRef}`);
  }
  console.log(`✅ Guest donation succeeded! Ref: ${guestDonation.paymentRef}, Phone: ${guestDonation.donorPhone}\n`);

  // ---------------------------------------------------------
  // TEST 3: Authenticated Alumni Donation
  // ---------------------------------------------------------
  console.log("TEST 3: Logging in as Alumni (demo.alumni@ipam.edu)...");
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.alumni@ipam.edu", password: "Password123!" }),
  });
  const alumniLoginJson = await alumniLoginRes.json();
  if (!alumniLoginRes.ok) {
    throw new Error(`Alumni login failed: ${JSON.stringify(alumniLoginJson)}`);
  }
  const alumniCookie = alumniLoginRes.headers.get("set-cookie");
  console.log("Logged in alumni user:", alumniLoginJson.data?.user?.email);

  const alumniPayload = {
    donorName: "Alumni Contributor",
    donorEmail: "demo.alumni@ipam.edu",
    donorPhone: "+232 77 334455",
    donorClass: "Class of 2020",
    amount: 300,
    currency: "USD",
    fund: "Campus AI, Computing & Innovation Labs",
    frequency: "MONTHLY",
    paymentMethod: "CARD",
    isDedication: false,
    isAnonymous: false,
  };

  const alumniDonationRes = await fetch(`${BASE_URL}/api/donations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify(alumniPayload),
  });
  const alumniDonationJson = await alumniDonationRes.json();
  if (!alumniDonationRes.ok) {
    throw new Error(`Alumni donation failed (${alumniDonationRes.status}): ${JSON.stringify(alumniDonationJson)}`);
  }
  const alumniDonation = alumniDonationJson.data;
  if (!alumniDonation.userId) {
    throw new Error("Expected authenticated alumni donation to link userId");
  }
  if (alumniDonation.donorPhone !== "+232 77 334455") {
    throw new Error(`Expected donorPhone '+232 77 334455', got: ${alumniDonation.donorPhone}`);
  }
  console.log(`✅ Alumni donation succeeded! Ref: ${alumniDonation.paymentRef}, Phone: ${alumniDonation.donorPhone}, UserId: ${alumniDonation.userId}\n`);

  // ---------------------------------------------------------
  // TEST 4: Admin Records & Audit Verification
  // ---------------------------------------------------------
  console.log("TEST 4: Logging in as Admin (demo.admin@ipam.edu)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.admin@ipam.edu", password: "Password123!" }),
  });
  const adminLoginJson = await adminLoginRes.json();
  if (!adminLoginRes.ok) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginJson)}`);
  }
  const adminCookie = adminLoginRes.headers.get("set-cookie");
  console.log("Admin logged in successfully:", adminLoginJson.data?.admin?.name);

  console.log("Querying Admin Donations Registry via GET /api/admin/donations...");
  const adminDonationsRes = await fetch(`${BASE_URL}/api/admin/donations`, {
    headers: { Cookie: adminCookie },
  });
  const adminDonationsJson = await adminDonationsRes.json();
  if (!adminDonationsRes.ok) {
    throw new Error(`Admin query failed (${adminDonationsRes.status}): ${JSON.stringify(adminDonationsJson)}`);
  }

  const donationsList = adminDonationsJson.data?.donations || [];
  const stats = adminDonationsJson.data?.stats;
  console.log(`Found ${donationsList.length} total donations in Admin registry.`);
  console.log("Admin Aggregate Stats:", stats);

  const foundGuest = donationsList.find((d) => d.paymentRef === guestDonation.paymentRef);
  if (!foundGuest) {
    throw new Error(`Admin records did not contain guest donation ${guestDonation.paymentRef}`);
  }
  if (foundGuest.donorPhone !== "+232 76 987654") {
    throw new Error(`Guest phone mismatch in admin record: ${foundGuest.donorPhone}`);
  }
  if (!foundGuest.isGuest) {
    throw new Error(`Expected isGuest=true for guest donation`);
  }
  if (!foundGuest.transactionRef) {
    throw new Error(`Expected linked transactionRef in admin record`);
  }
  console.log("✅ Verified Guest Donation record in Admin Desk:");
  console.log(`   - Name: ${foundGuest.donorName}`);
  console.log(`   - Phone: ${foundGuest.donorPhone}`);
  console.log(`   - Email: ${foundGuest.donorEmail}`);
  console.log(`   - Fund: ${foundGuest.fund}`);
  console.log(`   - Is Guest: ${foundGuest.isGuest}`);
  console.log(`   - Linked Transaction: ${foundGuest.transactionRef}`);

  const foundAlumni = donationsList.find((d) => d.paymentRef === alumniDonation.paymentRef);
  if (!foundAlumni) {
    throw new Error(`Admin records did not contain alumni donation ${alumniDonation.paymentRef}`);
  }
  if (foundAlumni.donorPhone !== "+232 77 334455") {
    throw new Error(`Alumni phone mismatch in admin record: ${foundAlumni.donorPhone}`);
  }
  if (foundAlumni.isGuest) {
    throw new Error(`Expected isGuest=false for alumni donation`);
  }
  console.log("✅ Verified Alumni Donation record in Admin Desk:");
  console.log(`   - Name: ${foundAlumni.donorName}`);
  console.log(`   - Phone: ${foundAlumni.donorPhone}`);
  console.log(`   - User: ${foundAlumni.user?.email} (${foundAlumni.user?.tier})`);

  // ---------------------------------------------------------
  // TEST 5: Admin Search by Phone
  // ---------------------------------------------------------
  console.log("\nTEST 5: Testing Admin Phone Search Filter (?q=987654)...");
  const searchRes = await fetch(`${BASE_URL}/api/admin/donations?q=987654`, {
    headers: { Cookie: adminCookie },
  });
  const searchJson = await searchRes.json();
  const searchList = searchJson.data?.donations || [];
  if (searchList.length === 0 || !searchList.some((d) => d.donorPhone?.includes("987654"))) {
    throw new Error("Admin search by phone number did not find matching donation");
  }
  console.log(`✅ Admin phone search successfully matched ${searchList.length} donation(s).`);
  // ---------------------------------------------------------
  // TEST 6: Admin Guest vs Alumni Filter
  // ---------------------------------------------------------
  console.log("\nTEST 6: Testing Admin Donor Type Filter (?donorType=GUEST)...");
  const guestFilterRes = await fetch(`${BASE_URL}/api/admin/donations?donorType=GUEST`, {
    headers: { Cookie: adminCookie },
  });
  const guestFilterJson = await guestFilterRes.json();
  const onlyGuests = guestFilterJson.data?.donations || [];
  if (!onlyGuests.every((d) => d.isGuest)) {
    throw new Error("donorType=GUEST returned non-guest records");
  }
  console.log(`✅ Admin guest-only filter successfully returned ${onlyGuests.length} guest donation(s).`);

  // ---------------------------------------------------------
  // TEST 7: Dedicated /admin/giving page verification
  // ---------------------------------------------------------
  console.log("\nTEST 7: Testing Dedicated Admin Giving Desk page (/admin/giving)...");
  const givingPageRes = await fetch(`${BASE_URL}/admin/giving`, {
    headers: { Cookie: adminCookie },
  });
  if (givingPageRes.status !== 200) {
    throw new Error(`Expected /admin/giving to return 200, got ${givingPageRes.status}`);
  }
  const givingPageText = await givingPageRes.text();
  if (!givingPageText.includes("Donations") && !givingPageText.includes("Giving")) {
    throw new Error("Expected /admin/giving HTML to contain Donations & Giving content");
  }
  console.log("✅ Verified /admin/giving renders with status 200 OK.");

  // ---------------------------------------------------------
  // TEST 8: Admin Sidebar and Overview Integration
  // ---------------------------------------------------------
  console.log("\nTEST 8: Testing Admin Overview & Sidebar containing Giving Desk tab...");
  const adminOverviewRes = await fetch(`${BASE_URL}/admin`, {
    headers: { Cookie: adminCookie },
  });
  if (adminOverviewRes.status !== 200) {
    throw new Error(`Expected /admin to return 200, got ${adminOverviewRes.status}`);
  }
  const adminOverviewText = await adminOverviewRes.text();
  if (!adminOverviewText.includes("/admin/giving")) {
    throw new Error("Expected Admin Overview / Sidebar to include link to /admin/giving");
  }
  console.log("✅ Verified Admin Sidebar & Overview contains Giving Desk tab (/admin/giving).");

  console.log("\n🎉 ALL DONATION, PHONE NUMBER, GUEST & ADMIN TESTS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
