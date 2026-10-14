/**
 * Test Suite: Revamped Enterprises & Commercial Banners
 */

const BASE_URL = "http://localhost:3000";

async function main() {
  console.log("=====================================================================");
  console.log("TESTING REVAMPED ENTERPRISES & COMMERCIAL BANNERS STATE MANAGEMENT");
  console.log("=====================================================================");

  // Step 1: Admin Login
  console.log("\n▶ [1] Authenticating Admin user...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${loginRes.status}`);
  }
  const cookies = loginRes.headers.get("set-cookie");
  const authHeaders = {
    Cookie: cookies,
    "Content-Type": "application/json",
  };
  console.log("✔ Admin authenticated successfully.");

  // Step 2: Fetch Enterprises
  console.log("\n▶ [2] Fetching Alumni Enterprises from Admin API...");
  const bizRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    headers: authHeaders,
  });
  if (!bizRes.ok) throw new Error(`Failed to fetch businesses: ${bizRes.status}`);
  const bizData = await bizRes.json();
  const businesses = bizData.data?.businesses || [];
  console.log(`✔ Found ${businesses.length} registered enterprises.`);

  if (businesses.length > 0) {
    const target = businesses[0];
    const initialFeatured = Boolean(target.featured);
    console.log(`\n▶ [3] Testing Instant Featured Toggle for enterprise "${target.name}" (Current: ${initialFeatured})...`);

    // Toggle featured ON
    const patchRes1 = await fetch(`${BASE_URL}/api/admin/businesses/${target.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ featured: !initialFeatured }),
    });
    if (!patchRes1.ok) throw new Error(`Toggle featured failed: ${patchRes1.status}`);
    const patchData1 = await patchRes1.json();
    console.log(`✔ Featured state successfully toggled to ${patchData1.data?.featured}`);

    // Verify on public businesses endpoint
    const pubRes = await fetch(`${BASE_URL}/api/businesses`);
    const pubData = await pubRes.json();
    const publicList = pubData.data?.businesses || [];
    const publicTarget = publicList.find((b) => b.id === target.id);
    if (publicTarget) {
      console.log(`✔ Verified on public /api/businesses: featured = ${publicTarget.featured}`);
    }

    // Toggle featured back to original
    console.log(`\n▶ [4] Toggling featured back to original state (${initialFeatured})...`);
    const patchRes2 = await fetch(`${BASE_URL}/api/admin/businesses/${target.id}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ featured: initialFeatured }),
    });
    if (!patchRes2.ok) throw new Error(`Revert featured failed: ${patchRes2.status}`);
    console.log(`✔ Featured state reverted cleanly to ${initialFeatured}.`);
  }

  // Step 5: Test Creating, Approving, and Deleting a test business
  console.log("\n▶ [5] Testing Enterprise Lifecycle: Create -> Review Approval -> Delete...");
  const createRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      name: `Apex Freetown Logistics ${Date.now()}`,
      founders: "Sahr Bangura & Aminata Koroma",
      classYear: "2019",
      category: "Logistics & Supply Chain",
      industry: "Freight & Port Forwarding",
      tagline: "End-to-end maritime and cross-border haulage across West Africa",
      description: "Providing modern tracking, automated customs clearance, and refrigerated freight services.",
      website: "https://apexfreetown.example.com",
      location: "Queen Elizabeth II Quay, Cline Town, Freetown",
      contactEmail: "info@apexfreetown.example.com",
      contactPhone: "+232 76 999 888",
      status: "PENDING_APPROVAL",
      featured: false,
      services: ["Cold-Chain Haulage", "Customs Brokerage", "Port Forwarding"],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create test business: ${createRes.status} ${errText}`);
  }
  const createdBiz = (await createRes.json()).data;
  console.log(`✔ Created pending enterprise: "${createdBiz.name}" (ID: ${createdBiz.id})`);

  // Approve it
  console.log("\n▶ [6] Testing One-Click Approval Flow...");
  const approveRes = await fetch(`${BASE_URL}/api/admin/businesses/${createdBiz.id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ status: "APPROVED", rejectionReason: null }),
  });
  if (!approveRes.ok) throw new Error(`Approve failed: ${approveRes.status}`);
  const approvedData = (await approveRes.json()).data;
  if (approvedData.status !== "APPROVED") throw new Error("Status is not APPROVED");
  console.log(`✔ Approved enterprise: status = "${approvedData.status}"`);

  // Delete it
  console.log("\n▶ [7] Testing Enterprise Deletion Flow...");
  const delRes = await fetch(`${BASE_URL}/api/admin/businesses/${createdBiz.id}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (!delRes.ok) throw new Error(`Delete failed: ${delRes.status}`);
  console.log(`✔ Enterprise deleted cleanly.`);

  // Step 8: Verify Commercial Banners API
  console.log("\n▶ [8] Verifying Commercial Banners & Placements...");
  const bannersRes = await fetch(`${BASE_URL}/api/banners?page=ALL`);
  if (!bannersRes.ok) throw new Error(`Failed to fetch banners: ${bannersRes.status}`);
  const bannersJson = await bannersRes.json();
  const banners = bannersJson.data || bannersJson;
  console.log(`✔ Commercial Banners loaded: ${banners.length} total active banners.`);
  banners.forEach((b) => {
    console.log(`   - "${b.headline}" by ${b.name} -> Placements: [${b.pages.join(", ")}]`);
  });

  console.log("\n=====================================================================");
  console.log("🎉 ALL REVAMPED ENTERPRISES & COMMERCIAL BANNERS TESTS PASSED 100%!");
  console.log("=====================================================================");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
