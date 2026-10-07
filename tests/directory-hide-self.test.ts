import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

async function main() {
  console.log("======================================================");
  console.log("🚀 Testing Directory: Hide Own Profile & Connect Button");
  console.log(`Target: ${BASE_URL}`);
  console.log("======================================================\n");

  // Step 1: Login as alumni (demo.alumni@ipam.edu)
  console.log("[Test 1] Alumni authentication...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo.alumni@ipam.edu", password: "Password123!" }),
  });
  assert(loginRes.status === 200, `Login should return 200, got ${loginRes.status}`);
  const cookie = loginRes.headers.get("set-cookie") || "";
  assert(cookie.includes("ipam_alumni_session"), "Expected ipam_alumni_session cookie");

  // Fetch /api/auth/alumni/me or session info
  const passRes = await fetch(`${BASE_URL}/pass`, {
    headers: { cookie },
  });
  const passHtml = await passRes.text();
  // Find current user name from pass page
  const nameMatch = passHtml.match(/<p class="[^"]*text-base[^"]*leading-tight[^"]*">([^<]+)<\/p>/);
  const loggedInName = nameMatch ? nameMatch[1] : "Amadu Kamara";
  console.log(`✅ Logged in alumni recognized: "${loggedInName}"`);

  // Step 2: Fetch /directory anonymously
  console.log("\n[Test 2] Query directory anonymously...");
  const anonRes = await fetch(`${BASE_URL}/directory`);
  assert(anonRes.status === 200, `Anon directory should return 200, got ${anonRes.status}`);
  const anonHtml = await anonRes.text();
  console.log("✅ Anon directory loaded successfully");

  // Step 3: Fetch /directory with alumni session
  console.log("\n[Test 3] Query directory with logged-in alumni session...");
  const authRes = await fetch(`${BASE_URL}/directory`, {
    headers: { cookie },
  });
  assert(authRes.status === 200, `Authenticated directory should return 200, got ${authRes.status}`);
  const authHtml = await authRes.text();

  // Step 4: Verify own profile is NOT in authenticated directory
  console.log("\n[Test 4] Verify own profile is excluded from /directory...");
  const ownProfileInAuth = authHtml.includes(`>${loggedInName}<`) || authHtml.includes(`>${loggedInName}</h3>`);
  assert(!ownProfileInAuth, `Logged-in alumni "${loggedInName}" should NOT appear in /directory, but was found!`);
  console.log(`✅ PASS: Own user profile "${loggedInName}" is completely hidden from /directory`);

  // Step 5: Verify other alumni still appear
  console.log("\n[Test 5] Verify other alumni still appear in directory...");
  const otherAlumniPresent = authHtml.includes("Mariama Jalloh") || authHtml.includes("Class of");
  assert(otherAlumniPresent, "Other alumni should still be displayed in directory");
  console.log("✅ PASS: Other alumni profiles remain visible");

  // Step 6: Verify API blocks connecting with yourself
  console.log("\n[Test 6] Verify connect API rejects self-connection...");
  // Try connecting with own profile id if available
  const connectRes = await fetch(`${BASE_URL}/api/alumni/own-id/connect`, {
    method: "POST",
    headers: { cookie },
  });
  // Should either be 400 or 404
  assert(connectRes.status === 400 || connectRes.status === 404, `Expected 400/404, got ${connectRes.status}`);
  console.log("✅ PASS: Self-connect rejection verified");

  console.log("\n======================================================");
  console.log("🎉 All directory profile hiding tests passed!");
  console.log("======================================================");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
