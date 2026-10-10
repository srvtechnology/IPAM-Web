/**
 * Automated E2E Test Suite: Admin Create Job & View Job Details Flow
 * Target: Dockerized IPAM-Web Application
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
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
  console.log(`🚀 Starting Admin Create Job & Details Flow E2E Tests`);
  console.log(`Target: ${BASE_URL} (Docker Container)`);
  console.log(`======================================================\n`);

  // [Step 1] Admin Authentication
  console.log(`[Step 1] Authenticating as Admin (demo.admin@ipam.edu)...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(loginRes.status === 200, "Admin login returned 200 OK");
  const cookieHeader = loginRes.headers.get("set-cookie") ?? "";
  const match = cookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(match), "Captured valid ipam_admin_session cookie");
  const adminCookie = `ipam_admin_session=${match[1]}`;

  // [Step 2] Admin Creates a Job
  const timestamp = Date.now();
  const testJobTitle = `Director of Strategic Partnerships #${timestamp}`;
  const testCompany = "IPAM Foundation & University Council";
  console.log(`\n[Step 2] Admin creating job: "${testJobTitle}"...`);

  const createRes = await fetch(`${BASE_URL}/api/admin/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: testJobTitle,
      company: testCompany,
      country: "Sierra Leone",
      state: "Western Area Urban",
      city: "Freetown",
      location: "Freetown, Western Area Urban, Sierra Leone",
      workMode: "HYBRID",
      type: "FULL_TIME",
      category: "OPERATIONS",
      salary: "SLE 55,000 - 75,000 / month",
      positionsOpen: 2,
      experienceRequired: true,
      experienceLevel: "5+ Years",
      hiringType: "IMMEDIATE",
      aboutCompany: "Premier public sector university governing body driving alumni endowment expansion.",
      description: "Oversee global philanthropic partnerships, chapter alliances, and institutional fundraising initiatives.",
      requirements: [
        "Master's degree or higher in Public Administration, Business, or International Relations",
        "Minimum 5 years executive leadership in higher education or international NGO governance",
        "Demonstrated track record in cross-border donor stewardship and alumni network expansion"
      ],
      skillsRequired: [
        "Executive stakeholder management",
        "Institutional endowment governance",
        "Global alumni chapter outreach"
      ],
      benefits: [
        "Competitive executive compensation & health coverage",
        "Official travel stipend for global chapter summits",
        "Dedicated executive office at Tower Hill campus"
      ],
    }),
  });

  assert(createRes.status === 201, `Job creation returned 201 Created (got ${createRes.status})`);
  const createJson = await createRes.json();
  assert(Boolean(createJson.data?.id), "Response contains unique job ID");
  const createdJobId = createJson.data.id;
  console.log(`   Created Job ID: ${createdJobId}`);

  // [Step 3] Verify Job Details via Admin API
  console.log(`\n[Step 3] Fetching created job details from API...`);
  const listRes = await fetch(`${BASE_URL}/api/admin/jobs`, {
    headers: { Cookie: adminCookie },
  });
  assert(listRes.status === 200, "Admin jobs list returned 200 OK");
  const listJson = await listRes.json();
  const foundJob = listJson.data.find((j) => j.id === createdJobId);
  assert(Boolean(foundJob), "Created job found in admin job list");
  assert(foundJob.title === testJobTitle, "Job title matches created title");
  assert(foundJob.company === testCompany, "Job company matches created company");
  assert(foundJob.postedByType === "ADMIN", "Posted by attribution is ADMIN");
  assert(foundJob.positionsOpen === 2, "Positions open is 2");

  // [Step 4] Verify Admin Job Listings Page (/admin/jobs) renders "See Job Details" option
  console.log(`\n[Step 4] Verifying /admin/jobs page renders the job with 'See Job Details' option...`);
  const pageRes = await fetch(`${BASE_URL}/admin/jobs`, {
    headers: { Cookie: adminCookie },
  });
  assert(pageRes.status === 200, "GET /admin/jobs returned 200 OK");
  const pageHtml = await pageRes.text();
  assert(pageHtml.includes(testJobTitle), "Listing table includes created job title");
  assert(pageHtml.includes("See Job Details"), "Listing table renders 'See Job Details' button");
  assert(pageHtml.includes(`/admin/jobs/${createdJobId}`), "Listing table includes link to job details view");

  // [Step 5] Verify Admin Job Details Page (/admin/jobs/[id]) renders full specs & requirements
  console.log(`\n[Step 5] Verifying /admin/jobs/${createdJobId} renders complete job details view...`);
  const detailRes = await fetch(`${BASE_URL}/admin/jobs/${createdJobId}`, {
    headers: { Cookie: adminCookie },
  });
  assert(detailRes.status === 200, `GET /admin/jobs/${createdJobId} returned 200 OK`);
  const detailHtml = await detailRes.text();

  assert(detailHtml.includes(testJobTitle), "Job details page contains job title");
  assert(
    detailHtml.includes(testCompany) || detailHtml.includes("IPAM Foundation &amp; University Council"),
    "Job details page contains company name"
  );
  assert(detailHtml.includes("Posted by Admin"), "Job details page contains admin poster badge");
  assert(detailHtml.includes("Back to All Job Listings"), "Job details page contains breadcrumb navigation back to listings");
  assert(detailHtml.includes("Listing Status:"), "Job details page contains listing status controller");
  assert(detailHtml.includes("Candidate Applications"), "Job details page contains applicant pipeline section");
  assert(detailHtml.includes("Freetown, Western Area Urban, Sierra Leone"), "Job details page contains formatted location");
  assert(detailHtml.includes("SLE 55,000 - 75,000 / month"), "Job details page contains compensation");
  assert(detailHtml.includes("5+ Years"), "Job details page contains experience level");
  assert(detailHtml.includes("Candidate Requirements"), "Job details page contains Candidate Requirements section");
  assert(detailHtml.includes("Master&#x27;s degree") || detailHtml.includes("Master's degree"), "Job details page contains requirements bullet point");
  assert(detailHtml.includes("Key Responsibilities"), "Job details page contains Key Responsibilities section");
  assert(detailHtml.includes("Executive stakeholder management"), "Job details page contains responsibility item");
  assert(detailHtml.includes("Benefits &amp; Perks") || detailHtml.includes("Benefits & Perks"), "Job details page contains Benefits section");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED: ${passedCount}/${totalCount}`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
