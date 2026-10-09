// Test for Saved Jobs functionality on route http://localhost:3000/jobs?saved=true
// Verifies:
// 1. Unauthenticated redirect to /login?redirect=/jobs?saved=true
// 2. Unauthenticated GET /api/jobs?saved=true returns 401
// 3. Authenticated Alumni session
// 4. Clean initial state & empty state rendering on /jobs?saved=true
// 5. Saving a job via POST /api/jobs/:id/save
// 6. Accessing /jobs?saved=true shows the saved job and excludes non-saved jobs
// 7. GET /api/jobs?saved=true returns only the saved jobs
// 8. Header dropdown link points to /jobs?saved=true
// 9. Toggling / unsaving jobs updates state properly and restores empty state

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`Testing Saved Jobs Flow on: ${BASE_URL}/jobs?saved=true`);
  console.log(`======================================================\n`);

  // Step 1: Test unauthenticated access to /jobs?saved=true
  console.log("▶ [Step 1] Checking unauthenticated redirect on /jobs?saved=true...");
  const unauthRes = await fetch(`${BASE_URL}/jobs?saved=true`, {
    redirect: "manual",
  });

  const locationHeader = unauthRes.headers.get("location");
  console.log(`   Status: ${unauthRes.status}, Location: ${locationHeader}`);
  if (unauthRes.status !== 307 && unauthRes.status !== 302 && unauthRes.status !== 308) {
    throw new Error(`Expected redirect (302/307/308) for unauthenticated /jobs?saved=true, got ${unauthRes.status}`);
  }
  if (!locationHeader || !locationHeader.includes("/login")) {
    throw new Error(`Expected redirect to include /login, got: ${locationHeader}`);
  }
  console.log("✔ Unauthenticated request correctly redirected to login with return redirect.\n");

  // Step 2: Test unauthenticated API request to /api/jobs?saved=true
  console.log("▶ [Step 2] Checking unauthenticated API access on /api/jobs?saved=true...");
  const unauthApiRes = await fetch(`${BASE_URL}/api/jobs?saved=true`);
  console.log(`   Status: ${unauthApiRes.status}`);
  if (unauthApiRes.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated /api/jobs?saved=true, got ${unauthApiRes.status}`);
  }
  console.log("✔ Unauthenticated API correctly returned 401.\n");

  // Step 3: Authenticate as Alumni
  console.log("▶ [Step 3] Authenticating as Alumni (demo.alumni@ipam.edu)...");
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
  console.log("✔ Alumni authenticated with session cookie.\n");

  // Step 4: Fetch existing jobs or ensure at least two active jobs exist
  console.log("▶ [Step 4] Ensuring at least two distinct active jobs exist...");
  let allJobsRes = await fetch(`${BASE_URL}/api/jobs`);
  let allJobsData = await allJobsRes.json();
  let jobs = allJobsData.data || [];

  if (jobs.length < 2) {
    console.log("   Creating test jobs...");
    const jobA = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        title: `Software Engineer Alpha ${Date.now()}`,
        company: "Alpha Tech IPAM",
        location: "Freetown, Sierra Leone",
        country: "Sierra Leone",
        city: "Freetown",
        type: "FULL_TIME",
        category: "ENGINEERING",
        salary: "SLE 40,000 / month",
        description: "Full stack engineering position for IPAM alumni.",
        requirements: ["Proficiency in Next.js and TypeScript"],
      }),
    });
    const jobB = await fetch(`${BASE_URL}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        title: `Financial Analyst Beta ${Date.now()}`,
        company: "Beta Banking Corp",
        location: "Freetown, Sierra Leone",
        country: "Sierra Leone",
        city: "Freetown",
        type: "FULL_TIME",
        category: "FINANCE_BANKING",
        salary: "SLE 35,000 / month",
        description: "Financial modeling and portfolio analysis.",
        requirements: ["Degree in Banking or Finance"],
      }),
    });
    allJobsRes = await fetch(`${BASE_URL}/api/jobs`);
    allJobsData = await allJobsRes.json();
    jobs = allJobsData.data || [];
  }

  const job1 = jobs[0];
  const job2 = jobs[1];
  console.log(`✔ Available test jobs:`);
  console.log(`   Job 1: "${job1.title}" (${job1.id})`);
  console.log(`   Job 2: "${job2.title}" (${job2.id})\n`);

  // Step 5: Reset saved jobs for alumni so we test cleanly
  console.log("▶ [Step 5] Cleaning any pre-existing saved jobs for clean test baseline...");
  const initialSavedApi = await fetch(`${BASE_URL}/api/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  const initialSavedData = await initialSavedApi.json();
  for (const sj of initialSavedData.data || []) {
    await fetch(`${BASE_URL}/api/jobs/${sj.id}/save`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  }
  console.log("✔ Saved jobs reset to 0.\n");

  // Step 6: Test /jobs?saved=true with 0 saved jobs (Empty state verification)
  console.log("▶ [Step 6] Testing /jobs?saved=true with 0 saved jobs...");
  const emptyRes = await fetch(`${BASE_URL}/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  if (emptyRes.status !== 200) {
    throw new Error(`Expected 200 on /jobs?saved=true, got ${emptyRes.status}`);
  }
  const emptyHtml = await emptyRes.text();
  if (!emptyHtml.includes("No saved job opportunities yet") && !emptyHtml.includes("saved any job listings yet")) {
    throw new Error(`Expected empty state message on /jobs?saved=true when 0 saved jobs`);
  }
  console.log("✔ Empty state correctly rendered on /jobs?saved=true.\n");

  // Step 7: Save Job 1
  console.log(`▶ [Step 7] Saving Job 1 ("${job1.title}")...`);
  const saveRes1 = await fetch(`${BASE_URL}/api/jobs/${job1.id}/save`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const saveJson1 = await saveRes1.json();
  if (!saveRes1.ok || !saveJson1.data?.saved) {
    throw new Error(`Failed to save job 1: ${JSON.stringify(saveJson1)}`);
  }
  console.log("✔ Job 1 saved successfully.\n");

  // Step 8: Verify /jobs?saved=true includes Job 1 and excludes Job 2
  console.log("▶ [Step 8] Verifying /jobs?saved=true renders only Job 1...");
  const savedViewRes1 = await fetch(`${BASE_URL}/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  const savedHtml1 = await savedViewRes1.text();

  if (!savedHtml1.includes(job1.title)) {
    throw new Error(`Expected saved job "${job1.title}" to appear on /jobs?saved=true`);
  }
  if (savedHtml1.includes(job2.title)) {
    throw new Error(`Expected unsaved job "${job2.title}" to be excluded on /jobs?saved=true`);
  }
  console.log(`✔ Verified: Job 1 is present, Job 2 is excluded on /jobs?saved=true.`);

  // Also verify GET /api/jobs?saved=true
  const apiSavedRes1 = await fetch(`${BASE_URL}/api/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  const apiSavedData1 = await apiSavedRes1.json();
  const apiJobIds1 = (apiSavedData1.data || []).map((j) => j.id);
  if (!apiJobIds1.includes(job1.id) || apiJobIds1.includes(job2.id)) {
    throw new Error(`API /api/jobs?saved=true returned unexpected jobs: ${JSON.stringify(apiJobIds1)}`);
  }
  console.log(`✔ Verified: GET /api/jobs?saved=true returned Job 1 only.\n`);

  // Step 9: Save Job 2 as well
  console.log(`▶ [Step 9] Saving Job 2 ("${job2.title}")...`);
  const saveRes2 = await fetch(`${BASE_URL}/api/jobs/${job2.id}/save`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const saveJson2 = await saveRes2.json();
  if (!saveRes2.ok || !saveJson2.data?.saved) {
    throw new Error(`Failed to save job 2: ${JSON.stringify(saveJson2)}`);
  }
  console.log("✔ Job 2 saved successfully.\n");

  // Step 10: Verify /jobs?saved=true renders both Job 1 and Job 2
  console.log("▶ [Step 10] Verifying /jobs?saved=true renders both Job 1 and Job 2...");
  const savedViewRes2 = await fetch(`${BASE_URL}/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  const savedHtml2 = await savedViewRes2.text();

  if (!savedHtml2.includes(job1.title)) {
    throw new Error(`Expected saved job "${job1.title}" to appear on /jobs?saved=true`);
  }
  if (!savedHtml2.includes(job2.title)) {
    throw new Error(`Expected saved job "${job2.title}" to appear on /jobs?saved=true`);
  }
  console.log(`✔ Verified: Both Job 1 and Job 2 appear on /jobs?saved=true.\n`);

  // Step 11: Unsave Job 1
  console.log(`▶ [Step 11] Unsaving Job 1 ("${job1.title}")...`);
  const unsaveRes1 = await fetch(`${BASE_URL}/api/jobs/${job1.id}/save`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const unsaveJson1 = await unsaveRes1.json();
  if (!unsaveRes1.ok || unsaveJson1.data?.saved !== false) {
    throw new Error(`Failed to unsave job 1: ${JSON.stringify(unsaveJson1)}`);
  }
  console.log("✔ Job 1 unsaved successfully.\n");

  // Step 12: Verify /jobs?saved=true now renders Job 2 and excludes Job 1
  console.log("▶ [Step 12] Verifying /jobs?saved=true renders Job 2 and excludes Job 1...");
  const savedViewRes3 = await fetch(`${BASE_URL}/jobs?saved=true`, {
    headers: { Cookie: cookie },
  });
  const savedHtml3 = await savedViewRes3.text();

  if (savedHtml3.includes(job1.title)) {
    throw new Error(`Expected unsaved job "${job1.title}" to be excluded on /jobs?saved=true`);
  }
  if (!savedHtml3.includes(job2.title)) {
    throw new Error(`Expected saved job "${job2.title}" to remain on /jobs?saved=true`);
  }
  console.log(`✔ Verified: Job 2 remains, Job 1 is excluded on /jobs?saved=true.\n`);

  // Step 13: Unsave Job 2
  console.log(`▶ [Step 13] Unsaving Job 2 ("${job2.title}")...`);
  const unsaveRes2 = await fetch(`${BASE_URL}/api/jobs/${job2.id}/save`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const unsaveJson2 = await unsaveRes2.json();
  if (!unsaveRes2.ok || unsaveJson2.data?.saved !== false) {
    throw new Error(`Failed to unsave job 2: ${JSON.stringify(unsaveJson2)}`);
  }
  console.log("✔ Job 2 unsaved successfully.\n");

  // Step 14: Verify normal /jobs listing renders all jobs
  console.log("▶ [Step 14] Verifying default /jobs renders all active jobs...");
  const allJobsPageRes = await fetch(`${BASE_URL}/jobs`, {
    headers: { Cookie: cookie },
  });
  const allJobsHtml = await allJobsPageRes.text();
  if (!allJobsHtml.includes(job1.title) || !allJobsHtml.includes(job2.title)) {
    throw new Error(`Expected both active jobs to appear on default /jobs listing`);
  }
  console.log(`✔ Verified: Default /jobs listing renders all active jobs.\n`);

  // Step 15: Verify Header & Careers navigation includes /jobs?saved=true
  console.log("▶ [Step 15] Verifying navigation links include /jobs?saved=true...");
  if (!allJobsHtml.includes("/jobs?saved=true")) {
    throw new Error(`Expected Careers page navigation to include href="/jobs?saved=true"`);
  }
  const fs = await import("fs");
  const headerContent = fs.readFileSync("components/public/Header.tsx", "utf-8");
  if (!headerContent.includes('href="/jobs?saved=true"')) {
    throw new Error(`Expected Header.tsx user dropdown to link to href="/jobs?saved=true"`);
  }
  console.log(`✔ Verified: Navigation links correctly point to /jobs?saved=true in page and Header.\n`);

  console.log(`======================================================`);
  console.log(`🎉 ALL SAVED JOBS FLOW TESTS PASSED SUCCESSFULLY!`);
  console.log(`======================================================\n`);
}

runTest().catch((err) => {
  console.error("\n❌ Test Failed:", err);
  process.exit(1);
});
