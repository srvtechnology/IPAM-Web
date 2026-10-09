// Test for Job Post modal validation fix (matching user screenshot)
// Verifies posting a job with:
// - experienceRequired = false (experienceLevel: null)
// - aboutCompany: null
// - location dropdowns (Sierra Leone, Western Area Urban, Freetown)
// - various salary strings and defaults

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`Testing Job Post Validation Fix on: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // 1. Authenticate as Alumni
  console.log("▶ [Step 1] Authenticating as Alumni (demo.alumni@ipam.edu)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed (${loginRes.status}): ${await loginRes.text()}`);
  }

  const cookie = loginRes.headers.get("set-cookie").match(/ipam_alumni_session=([^;]+)/)[0];
  console.log("✔ Alumni authenticated.");

  // 2. Post exact payload from user screenshot
  console.log("\n▶ [Step 2] Posting exact job from user screenshot (Test job / exaple)...");
  const screenshotPayload = {
    title: "Test job",
    company: "exaple",
    country: "Sierra Leone",
    state: "Western Area Urban",
    city: "Freetown",
    location: "Freetown, Western Area Urban, Sierra Leone",
    type: "FULL_TIME",
    workplaceType: "ON_SITE",
    category: "ENGINEERING",
    salary: "30000",
    positionsOpen: 1,
    experienceRequired: false,
    experienceLevel: null, // previously caused "Expected string, received null"
    hiringType: "TILL_DATE",
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    aboutCompany: null, // previously caused "Expected string, received null"
    description: "Exciting job opportunity at exaple for a qualified Test job.",
    requirements: ["Relevant qualifications or equivalent practical experience"],
    responsibilities: [],
    benefits: [],
  };

  const postRes1 = await fetch(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(screenshotPayload),
  });

  const postJson1 = await postRes1.json();
  if (!postRes1.ok) {
    throw new Error(`Job creation failed with ${postRes1.status}: ${JSON.stringify(postJson1)}`);
  }

  const createdJob1 = postJson1.data || postJson1;
  console.log(`✔ SUCCESS: Job created successfully! ID: ${createdJob1.id}, Title: "${createdJob1.title}", Company: "${createdJob1.company}"`);
  console.log(`   Location: ${createdJob1.location}`);
  console.log(`   Salary: ${createdJob1.salary}`);
  console.log(`   Experience Required: ${createdJob1.experienceRequired} (Level: ${createdJob1.experienceLevel})`);
  console.log(`   Hiring Type: ${createdJob1.hiringType}`);

  // 3. Test with minimal fields and optional empty values
  console.log("\n▶ [Step 3] Posting job with minimal payload and nulls...");
  const minimalPayload = {
    title: "Software Engineer Fresher",
    company: "Sierra Tech Labs",
    country: "Sierra Leone",
    salary: "SLE 25,000 / month",
    experienceRequired: false,
    experienceLevel: null,
    aboutCompany: null,
    companyLogo: null,
    workplaceType: null,
  };

  const postRes2 = await fetch(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(minimalPayload),
  });

  const postJson2 = await postRes2.json();
  if (!postRes2.ok) {
    throw new Error(`Minimal job creation failed with ${postRes2.status}: ${JSON.stringify(postJson2)}`);
  }

  const createdJob2 = postJson2.data || postJson2;
  console.log(`✔ SUCCESS: Minimal job created successfully! ID: ${createdJob2.id}, Title: "${createdJob2.title}"`);

  // 4. Verify jobs appear on public /jobs and /jobs/manage
  console.log("\n▶ [Step 4] Verifying created jobs in public API /api/jobs...");
  const listRes = await fetch(`${BASE_URL}/api/jobs`);
  if (!listRes.ok) throw new Error("Failed to fetch jobs list");
  const listJson = await listRes.json();
  const allJobs = listJson.data || listJson;
  const found1 = allJobs.find((j) => j.id === createdJob1.id);
  const found2 = allJobs.find((j) => j.id === createdJob2.id);

  if (!found1 || !found2) {
    throw new Error("Created jobs not found in public listings");
  }
  console.log(`✔ Verified both created jobs exist in public listings (${allJobs.length} total jobs).`);

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED! Job post validation fix is completely verified.`);
  console.log(`======================================================\n`);
}

runTest().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});
