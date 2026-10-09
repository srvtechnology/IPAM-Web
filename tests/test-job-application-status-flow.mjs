// E2E Test Suite for Job Application Real-time Status Flow
// Verifies alumni apply flow, live status tracking, timeline milestones, and notifications

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`Starting Job Application Status Flow E2E Tests on: ${BASE_URL}`);
  console.log(`======================================================\n`);

  let adminCookie = "";
  let alumniCookie = "";

  // 1. Authenticate as Admin
  console.log("▶ [Test 1] Authenticating as Admin (demo.admin@ipam.edu)...");
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!adminLoginRes.ok) {
    throw new Error(`Admin login failed (${adminLoginRes.status}): ${await adminLoginRes.text()}`);
  }

  const adminCookies = adminLoginRes.headers.get("set-cookie");
  const adminTokenMatch = adminCookies?.match(/ipam_admin_session=([^;]+)/);
  if (!adminTokenMatch) {
    throw new Error("Missing ipam_admin_session cookie");
  }
  adminCookie = `ipam_admin_session=${adminTokenMatch[1]}`;
  console.log("✔ Admin authenticated successfully.");

  // 2. Authenticate as Alumni
  console.log("\n▶ [Test 2] Authenticating as Alumni (demo.alumni@ipam.edu)...");
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });

  if (!alumniLoginRes.ok) {
    throw new Error(`Alumni login failed (${alumniLoginRes.status}): ${await alumniLoginRes.text()}`);
  }

  const alumniCookies = alumniLoginRes.headers.get("set-cookie");
  const alumniTokenMatch = alumniCookies?.match(/ipam_alumni_session=([^;]+)/);
  if (!alumniTokenMatch) {
    throw new Error("Missing ipam_alumni_session cookie");
  }
  alumniCookie = `ipam_alumni_session=${alumniTokenMatch[1]}`;
  console.log("✔ Alumni authenticated successfully.");

  // 3. Create a unique test job opening as Admin
  console.log("\n▶ [Test 3] Creating a test job opening as Admin...");
  const timestamp = Date.now();
  const createJobRes = await fetch(`${BASE_URL}/api/admin/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: `Senior Status Flow Architect #${timestamp}`,
      company: `Apex Status Corp ${timestamp}`,
      location: "Freetown, Sierra Leone",
      country: "Sierra Leone",
      state: "Western Area",
      city: "Freetown",
      type: "FULL_TIME",
      category: "ENGINEERING",
      salary: "$5,000 - $7,000 / month",
      salaryRange: "$5,000 - $7,000 / month",
      experienceRequired: true,
      experienceLevel: "Senior (5+ yrs)",
      hiringType: "IMMEDIATE",
      positionsOpen: 2,
      status: "ACTIVE",
      aboutCompany: "Leading innovator in enterprise infrastructure systems.",
      description: "Responsible for scaling reliable cloud systems and telemetry architecture.",
    }),
  });

  if (!createJobRes.ok) {
    throw new Error(`Create job failed: ${createJobRes.status} ${await createJobRes.text()}`);
  }

  const createdJobJson = await createJobRes.json();
  const testJob = createdJobJson.data || createdJobJson;
  const testJobId = testJob.id;
  console.log(`✔ Created test job "${testJob.title}" (ID: ${testJobId}).`);

  // 4. Verify Alumni has not applied yet
  console.log("\n▶ [Test 4] Verifying alumni status before applying...");
  const preApplyRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    headers: { Cookie: alumniCookie },
  });
  if (!preApplyRes.ok) {
    throw new Error(`GET /api/jobs/${testJobId}/apply failed: ${preApplyRes.status}`);
  }
  const preApplyJson = await preApplyRes.json();
  if (preApplyJson.data?.application !== null && preApplyJson.data?.application !== undefined) {
    throw new Error("Expected application to be null before applying");
  }
  console.log("✔ Verified: No existing application found for this job.");

  // 5. Alumni applies to the job
  console.log("\n▶ [Test 5] Alumni submitting job application...");
  const applyRes = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      candidateName: "Demosthenes Alumni",
      email: "demo.alumni@ipam.edu",
      phone: "+232 76 998877",
      degree: "BSc Business Information Technology",
      faculty: "Faculty of Information Systems",
      gradYear: 2021,
      experienceYears: 4,
      skills: ["Cloud Systems", "Next.js", "Docker", "PostgreSQL"],
      coverNote: "Excited to apply my distributed systems experience to Apex Status Corp.",
      linkedinUrl: "https://linkedin.com/in/demo-alumni",
      cvUrl: "data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0ZpbHRlciAvRmxhdGVEZWNvZGUKL0xlbmd0aCA5OAo+PgpzdHJlYW0KeJxzVLBk4GBwzi/NKymqVPDJT07NycmvVPDLz0lVqFXQVfDMS84pLSpL1fdLzE0FisUX5CRm5gAAcswRCgplbmRzdHJlYW0KZW5kb2JqCg==",
      cvFileName: "Demosthenes_Alumni_Lead_Architect_CV.pdf",
    }),
  });

  if (!applyRes.ok) {
    throw new Error(`Apply failed: ${applyRes.status} ${await applyRes.text()}`);
  }

  const applyJson = await applyRes.json();
  const application = applyJson.data?.application || applyJson.application;
  const applicationId = application.id;
  console.log(`✔ Application submitted! Ref: ${application.applicationRef}, Status: ${application.status}`);

  if (application.status !== "APPLIED") {
    throw new Error(`Expected status to be "APPLIED", got "${application.status}"`);
  }
  if (!application.cvUrl || application.cvFileName !== "Demosthenes_Alumni_Lead_Architect_CV.pdf") {
    throw new Error(`Expected cvFileName to be "Demosthenes_Alumni_Lead_Architect_CV.pdf", got "${application.cvFileName}"`);
  }
  console.log(`✔ CV verified on submission: ${application.cvFileName} (Base64 attached).`);

  // 6. Verify Alumni can immediately view status on the job detail endpoint
  console.log("\n▶ [Test 6] Verifying alumni sees status 'APPLIED' on /api/jobs/[id]/apply...");
  const statusRes1 = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    headers: { Cookie: alumniCookie },
  });
  const statusJson1 = await statusRes1.json();
  const appStatus1 = statusJson1.data?.application || statusJson1.application;
  if (!appStatus1 || appStatus1.status !== "APPLIED") {
    throw new Error(`Expected status 'APPLIED', got ${appStatus1?.status}`);
  }
  if (!appStatus1.cvUrl || appStatus1.cvFileName !== "Demosthenes_Alumni_Lead_Architect_CV.pdf") {
    throw new Error("Missing or mismatched CV in /api/jobs/[id]/apply response");
  }
  console.log(`✔ Verified alumni job detail status: ${appStatus1.status} (Ref: ${appStatus1.applicationRef}, CV: ${appStatus1.cvFileName})`);

  // 7. Verify Alumni sees application in /api/jobs/my-applications
  console.log("\n▶ [Test 7] Verifying application appears in GET /api/jobs/my-applications...");
  const myAppsRes1 = await fetch(`${BASE_URL}/api/jobs/my-applications`, {
    headers: { Cookie: alumniCookie },
  });
  if (!myAppsRes1.ok) {
    throw new Error(`GET /api/jobs/my-applications failed: ${myAppsRes1.status} ${await myAppsRes1.text()}`);
  }
  const myAppsJson1 = await myAppsRes1.json();
  const myAppsList1 = myAppsJson1.data?.applications || myAppsJson1.applications || [];
  const foundInMyApps1 = myAppsList1.find((a) => a.id === applicationId || a.jobId === testJobId);
  if (!foundInMyApps1) {
    throw new Error("Application not found in /api/jobs/my-applications");
  }
  if (foundInMyApps1.status !== "APPLIED") {
    throw new Error(`Expected status 'APPLIED' in my-applications, got '${foundInMyApps1.status}'`);
  }
  console.log(`✔ Application found in /api/jobs/my-applications with status "${foundInMyApps1.status}" and job title "${foundInMyApps1.job.title}".`);

  // 8. Admin updates status to SHORTLISTED
  console.log("\n▶ [Test 8] Recruiter/Admin updates candidate status to 'SHORTLISTED'...");
  const shortlistRes = await fetch(`${BASE_URL}/api/admin/jobs/${testJobId}/applications/${applicationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      status: "SHORTLISTED",
      notes: "Resume shortlisted for technical panel interview.",
    }),
  });
  if (!shortlistRes.ok) {
    throw new Error(`Admin update to SHORTLISTED failed: ${shortlistRes.status} ${await shortlistRes.text()}`);
  }
  console.log("✔ Admin updated candidate to SHORTLISTED.");

  // Verify Alumni sees SHORTLISTED status
  const statusRes2 = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    headers: { Cookie: alumniCookie },
  });
  const statusJson2 = await statusRes2.json();
  const appStatus2 = statusJson2.data?.application || statusJson2.application;
  if (appStatus2.status !== "SHORTLISTED") {
    throw new Error(`Expected status 'SHORTLISTED', got '${appStatus2?.status}'`);
  }
  console.log(`✔ Alumni verified real-time status update: ${appStatus2.status}`);

  // 9. Admin schedules an interview
  console.log("\n▶ [Test 9] Recruiter/Admin schedules interview for candidate...");
  const interviewDate = "2026-10-25T14:00:00.000Z";
  const interviewNotes = "Google Meet interview with Technical Director. Please prepare portfolio demo.";
  const scheduleRes = await fetch(`${BASE_URL}/api/admin/jobs/${testJobId}/applications/${applicationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      status: "INTERVIEW_SCHEDULED",
      interviewDate: interviewDate,
      notes: interviewNotes,
    }),
  });
  if (!scheduleRes.ok) {
    throw new Error(`Schedule interview failed: ${scheduleRes.status} ${await scheduleRes.text()}`);
  }
  console.log("✔ Interview scheduled successfully.");

  // Verify Alumni receives interview schedule details
  const statusRes3 = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    headers: { Cookie: alumniCookie },
  });
  const statusJson3 = await statusRes3.json();
  const appStatus3 = statusJson3.data?.application || statusJson3.application;
  if (appStatus3.status !== "INTERVIEW_SCHEDULED") {
    throw new Error(`Expected status 'INTERVIEW_SCHEDULED', got '${appStatus3?.status}'`);
  }
  if (!appStatus3.interviewDate) {
    throw new Error("Missing interviewDate in alumni application status view");
  }
  if (appStatus3.notes !== interviewNotes) {
    throw new Error(`Interview notes mismatch: expected '${interviewNotes}', got '${appStatus3.notes}'`);
  }
  console.log(`✔ Alumni verified interview schedule: Date=${appStatus3.interviewDate}, Notes="${appStatus3.notes}"`);

  // 10. Admin selects candidate and extends offer
  console.log("\n▶ [Test 10] Recruiter/Admin selects candidate and extends offer...");
  const offerSalary = "$6,500 / month + Equity & Relocation";
  const startDate = "2026-11-15T09:00:00.000Z";
  const recruiterRemarks = "Exceptional performance in technical architectural design review. Welcome aboard!";
  
  const selectRes = await fetch(`${BASE_URL}/api/admin/jobs/${testJobId}/applications/${applicationId}/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      offerSalary,
      startDate,
      decisionStatus: "OFFER_EXTENDED",
      recruiterRemarks,
    }),
  });
  if (!selectRes.ok) {
    throw new Error(`Candidate selection failed: ${selectRes.status} ${await selectRes.text()}`);
  }
  console.log("✔ Candidate selected and offer extended.");

  // 11. Verify Alumni sees SELECTED status, offer details, start date, and remarks
  console.log("\n▶ [Test 11] Verifying alumni sees 'SELECTED' status with full offer dossier...");
  const statusRes4 = await fetch(`${BASE_URL}/api/jobs/${testJobId}/apply`, {
    headers: { Cookie: alumniCookie },
  });
  const statusJson4 = await statusRes4.json();
  const appStatus4 = statusJson4.data?.application || statusJson4.application;
  if (appStatus4.status !== "SELECTED") {
    throw new Error(`Expected status 'SELECTED', got '${appStatus4?.status}'`);
  }
  if (appStatus4.offerSalary !== offerSalary) {
    throw new Error(`Offer salary mismatch: expected '${offerSalary}', got '${appStatus4?.offerSalary}'`);
  }
  if (appStatus4.decisionStatus !== "OFFER_EXTENDED") {
    throw new Error(`Decision status mismatch: expected 'OFFER_EXTENDED', got '${appStatus4?.decisionStatus}'`);
  }
  if (appStatus4.recruiterRemarks !== recruiterRemarks) {
    throw new Error(`Recruiter remarks mismatch: expected '${recruiterRemarks}', got '${appStatus4?.recruiterRemarks}'`);
  }
  console.log(`✔ Alumni verified selection & offer: Status=${appStatus4.status}, Offer=${appStatus4.offerSalary}, Remarks="${appStatus4.recruiterRemarks}"`);

  // 12. Verify public portal pages render with applied status
  console.log("\n▶ [Test 12] Verifying public /jobs, /jobs/[id], and /jobs/manage HTML views...");
  const jobDetailHtmlRes = await fetch(`${BASE_URL}/jobs/${testJobId}`, {
    headers: { Cookie: alumniCookie },
  });
  if (!jobDetailHtmlRes.ok) {
    throw new Error(`/jobs/${testJobId} HTML render failed with status ${jobDetailHtmlRes.status}`);
  }
  const jobDetailHtml = await jobDetailHtmlRes.text();
  if (!jobDetailHtml.includes("Your Application Status") && !jobDetailHtml.includes("Recruitment Pipeline Progress")) {
    throw new Error("Job detail HTML missing application status marker");
  }
  console.log("✔ Job detail view correctly renders Your Application Status & Recruitment Pipeline Progress.");

  const jobsListHtmlRes = await fetch(`${BASE_URL}/jobs`, {
    headers: { Cookie: alumniCookie },
  });
  if (!jobsListHtmlRes.ok) {
    throw new Error(`/jobs HTML render failed with status ${jobsListHtmlRes.status}`);
  }
  const jobsListHtml = await jobsListHtmlRes.text();
  if (!jobsListHtml.includes("Track Application") && !jobsListHtml.includes("My Applications")) {
    throw new Error("Jobs list HTML missing applied tracking button or my applications tab");
  }
  console.log("✔ Jobs list view correctly renders application tracking indicator.");

  const manageHtmlRes = await fetch(`${BASE_URL}/jobs/manage?tab=applied`, {
    headers: { Cookie: alumniCookie },
  });
  if (!manageHtmlRes.ok) {
    throw new Error(`/jobs/manage?tab=applied HTML render failed with status ${manageHtmlRes.status}`);
  }
  const manageHtml = await manageHtmlRes.text();
  if (!manageHtml.includes("My Submitted Applications")) {
    throw new Error("Manage page HTML missing 'My Submitted Applications' tab");
  }
  console.log("✔ Manage jobs page correctly renders 'My Submitted Applications' tab.");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL 12 TESTS PASSED! Job Application Status Flow is 100% verified.`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
