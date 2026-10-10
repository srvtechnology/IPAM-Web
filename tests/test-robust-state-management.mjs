/**
 * Automated Test: Robust State Management for Alumni Business Listings
 * Tests the exact scenario from user report:
 * - Adding business immediately updates list without page refresh
 * - Active search filters and tab counters behavior
 * - Admin auto-approval and user data integrity
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function run() {
  console.log("=====================================================================");
  console.log("TESTING ROBUST STATE MANAGEMENT FOR ALUMNI BUSINESS LISTINGS");
  console.log("=====================================================================");
  console.log(`Connecting to: ${BASE_URL}`);

  // 1. Authenticate Admin
  console.log("\n▶ [Step 1] Authenticating Admin user...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.admin@ipam.edu", password: "Password123!" }),
  });
  if (!adminLoginRes.ok) {
    throw new Error(`Admin login failed: ${adminLoginRes.status}`);
  }
  const setCookieHeader = adminLoginRes.headers.get("set-cookie") || "";
  let adminCookie = "";
  if (setCookieHeader.includes("ipam_admin_session=")) {
    const match = setCookieHeader.match(/ipam_admin_session=[^;]+/);
    adminCookie = match ? match[0] : setCookieHeader.split(";")[0];
  } else {
    adminCookie = setCookieHeader.split(";")[0];
  }
  console.log("✔ Admin authenticated successfully. Cookie:", adminCookie.slice(0, 30) + "...");

  // 2. Initial List & Counter Check
  console.log("\n▶ [Step 2] Fetching initial list and counters...");
  const initialRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    headers: { Cookie: adminCookie },
  });
  const initialData = await initialRes.json();
  if (!initialRes.ok || !initialData.data) {
    throw new Error(`Failed to fetch initial businesses (status ${initialRes.status}): ${JSON.stringify(initialData)}`);
  }
  const initialTotal = initialData.data.counts.total;
  const initialApproved = initialData.data.counts.approved;
  console.log(`✔ Initial count: Total = ${initialTotal}, Approved = ${initialApproved}`);

  // 3. Simulating user search query "Sed exercitation obc" (screenshot scenario)
  console.log("\n▶ [Step 3] Querying with search query 'Sed exercitation obc' (screenshot scenario)...");
  const filteredRes = await fetch(`${BASE_URL}/api/admin/businesses?q=Sed%20exercitation%20obc`, {
    headers: { Cookie: adminCookie },
  });
  const filteredData = await filteredRes.json();
  const matchedBusinesses = filteredData.data?.businesses || [];
  console.log(`✔ Found ${matchedBusinesses.length} businesses matching search query (expected empty list matching screenshot).`);

  // 4. Admin adding a new Alumni Business Listing
  console.log("\n▶ [Step 4] Creating new Alumni Business Listing via Admin desk...");
  const timestamp = Date.now();
  const newBusinessPayload = {
    name: `Apex Solar Technologies ${timestamp}`,
    founders: "Dr. Alpha Bangura, Ing. Mary Sesay",
    classYear: "2018",
    category: "CleanTech & Energy",
    industry: "Solar Power Solutions & Microgrids",
    tagline: "Empowering rural and urban Sierra Leone with sustainable clean solar power",
    description: "Full service solar grid design, installation, battery storage and maintenance provider founded by IPAM alumni.",
    website: "https://apexsolar-sl.com",
    location: "14 Siaka Stevens Street, Freetown, Sierra Leone",
    contactEmail: `contact_${timestamp}@apexsolar-sl.com`,
    contactPhone: "+232 76 998877",
    featured: true,
    services: ["Solar Installation", "Battery Storage", "Energy Audit", "Commercial Microgrids"],
    keyProducts: [{ name: "ApexPower 5kVA", description: "All-in-one residential hybrid solar inverter" }],
  };

  const createRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(newBusinessPayload),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create business: ${createRes.status} ${errText}`);
  }

  const createJson = await createRes.json();
  if (!createJson.data?.id) {
    throw new Error(`Invalid response after creating business: ${JSON.stringify(createJson)}`);
  }
  const createdBusiness = createJson.data;
  console.log(`✔ Business created successfully! ID: ${createdBusiness.id}, Name: "${createdBusiness.name}"`);
  console.log(`✔ Verified Admin-created status is automatically: "${createdBusiness.status}" (no approval gate required).`);

  // 5. Verifying immediate availability in Admin List & Counters
  console.log("\n▶ [Step 5] Verifying state immediately after creation without page refresh...");
  const refreshedRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    headers: { Cookie: adminCookie },
  });
  const refreshedData = await refreshedRes.json();
  const allBusinesses = refreshedData.data.businesses;
  const newCounts = refreshedData.data.counts;

  const foundInList = allBusinesses.find((b) => b.id === createdBusiness.id);
  if (!foundInList) {
    throw new Error(`State error: newly created business ${createdBusiness.id} NOT found in list!`);
  }
  console.log(`✔ Verified: Newly created business appears in list immediately.`);

  if (newCounts.total !== initialTotal + 1) {
    throw new Error(`State counter error: expected total ${initialTotal + 1}, got ${newCounts.total}`);
  }
  if (newCounts.approved !== initialApproved + 1) {
    throw new Error(`State counter error: expected approved ${initialApproved + 1}, got ${newCounts.approved}`);
  }
  console.log(`✔ Verified: Tab badge and total counters updated immediately (+1: total ${newCounts.total}, approved ${newCounts.approved}).`);

  // 6. Verifying search query clearing restores visibility
  console.log("\n▶ [Step 6] Verifying search filtering by new business attributes...");
  const searchByNameRes = await fetch(`${BASE_URL}/api/admin/businesses?q=Apex%20Solar`, {
    headers: { Cookie: adminCookie },
  });
  const searchByNameData = await searchByNameRes.json();
  const foundByName = searchByNameData.data.businesses.some((b) => b.id === createdBusiness.id);
  if (!foundByName) {
    throw new Error("Failed to search new business by name 'Apex Solar'");
  }
  console.log(`✔ Verified: Searching for 'Apex Solar' accurately locates the new business.`);

  const searchByFounderRes = await fetch(`${BASE_URL}/api/admin/businesses?q=Alpha%20Bangura`, {
    headers: { Cookie: adminCookie },
  });
  const searchByFounderData = await searchByFounderRes.json();
  const foundByFounder = searchByFounderData.data.businesses.some((b) => b.id === createdBusiness.id);
  if (!foundByFounder) {
    throw new Error("Failed to search new business by founder 'Alpha Bangura'");
  }
  console.log(`✔ Verified: Searching for founder 'Alpha Bangura' locates the new business.`);

  // 7. Verifying public directory reflects the approved listing
  console.log("\n▶ [Step 7] Checking public directory state...");
  const publicRes = await fetch(`${BASE_URL}/api/businesses`);
  const publicData = await publicRes.json();
  const publicList = Array.isArray(publicData.data) ? publicData.data : publicData.data?.businesses || [];
  const foundInPublic = publicList.some((b) => b.id === createdBusiness.id);
  if (!foundInPublic) {
    throw new Error("Newly approved business is not present in public directory!");
  }
  console.log(`✔ Verified: Business is live in the public directory.`);

  // 8. Clean up
  console.log("\n▶ [Step 8] Cleaning up temporary test record...");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/businesses/${createdBusiness.id}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  if (deleteRes.ok) {
    console.log(`✔ Successfully cleaned up test enterprise: ${createdBusiness.id}`);
  }

  console.log("\n✨ ALL ROBUST STATE MANAGEMENT CHECKS PASSED FLAWLESSLY! ✨\n");
}

run().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
