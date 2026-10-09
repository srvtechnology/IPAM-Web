/**
 * End-to-End Test Suite: Job Creation & Hire Management System
 * 
 * Verifies:
 * 1. Admin & Alumni authentication
 * 2. Admin creates a job with all 11 required fields (Location Country/State/City, Experience, Hiring timeline, etc.)
 * 3. Alumni creates a job with all required fields
 * 4. Public Jobs API returns all 11 required fields clearly
 * 5. Poster attribution: Admin jobs vs Alumni jobs (postedByType, postedByName, postedByTitle)
 * 6. Access Control & Isolation:
 *    - Admin sees ALL jobs across the platform
 *    - Alumni sees ONLY their own posted jobs via /api/jobs/manage
 *    - Alumni is blocked (403) from viewing/managing candidates of other users' jobs
 * 7. Candidate Application submission with rich profile & matchScore calculation
 * 8. Hire Management Candidate Pipeline:
 *    - Shortlisting candidates with notes
 *    - Interview scheduling with date & recruiter remarks
 *    - Final selection & offer extension (offerSalary, startDate, decisionStatus)
 * 9. Job Status management (ACTIVE -> INTERVIEWING -> CLOSED)
 * 10. Admin universal candidate dossier visibility
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
  console.log(`🚀 Starting Job Creation & Hire Management Test Suite`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`======================================================\n`);

  // -------------------------------------------------------------------------
  // Step 1: Admin Authentication
  // -------------------------------------------------------------------------
  console.log(`[Step 1] Authenticating Admin user...`);
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.admin@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(adminLoginRes.status === 200, "Admin login returned 200 OK");
  const adminCookieHeader = adminLoginRes.headers.get("set-cookie") || "";
  const adminCookieMatch = adminCookieHeader.match(/ipam_admin_session=([^;]+)/);
  assert(Boolean(adminCookieMatch), "Admin session cookie captured");
  const adminCookie = `ipam_admin_session=${adminCookieMatch![1]}`;

  // -------------------------------------------------------------------------
  // Step 2: Alumni Authentication
  // -------------------------------------------------------------------------
  console.log(`\n[Step 2] Authenticating Alumni user (Job Poster & Applicant)...`);
  const alumniLoginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });
  assert(alumniLoginRes.status === 200, "Alumni login returned 200 OK");
  const alumniCookieHeader = alumniLoginRes.headers.get("set-cookie") || "";
  const alumniCookieMatch = alumniCookieHeader.match(/ipam_alumni_session=([^;]+)/);
  assert(Boolean(alumniCookieMatch), "Alumni session cookie captured");
  const alumniCookie = `ipam_alumni_session=${alumniCookieMatch![1]}`;

  // -------------------------------------------------------------------------
  // Step 3: Admin Creates a Job with all 11 fields
  // -------------------------------------------------------------------------
  console.log(`\n[Step 3] Admin creates an institutional job opening...`);
  const adminJobPayload = {
    title: "Senior Risk & Audit Analyst",
    company: "Bank of Sierra Leone",
    country: "Sierra Leone",
    state: "Western Area Urban",
    city: "Freetown",
    type: "FULL_TIME",
    workplaceType: "HYBRID",
    salaryMin: 45000,
    salaryMax: 65000,
    currency: "SLE",
    category: "FINANCE_BANKING",
    experienceRequired: true,
    experienceLevel: "MID",
    hiringType: "TILL_DATE",
    positionsOpen: 2,
    status: "ACTIVE",
    deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
    aboutCompany: "The central monetary authority of Sierra Leone fostering economic stability.",
    description: "Lead risk governance and regulatory audit for financial institutions across Sierra Leone.",
    requirements: ["Degree in Banking, Accounting, or Economics from IPAM", "3+ years audit experience"],
    skillsRequired: ["Internal Audit", "Risk Governance", "IFRS Compliance"],
    benefits: ["Central Bank Pension", "Comprehensive Health Cover", "Professional Certification Subsidy"],
  };

  const adminCreateRes = await fetch(`${BASE_URL}/api/admin/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify(adminJobPayload),
  });
  const adminCreateStatus = adminCreateRes.status;
  const adminCreateText = await adminCreateRes.text();
  if (adminCreateStatus !== 201) {
    console.error("Admin create failed:", adminCreateStatus, adminCreateText);
  }
  assert(adminCreateStatus === 201, "Admin job creation returned 201 Created");
  const adminJobData = JSON.parse(adminCreateText);
  const adminJob = adminJobData.data || adminJobData.job;
  assert(Boolean(adminJob && adminJob.id), "Admin job created with valid ID");
  assert(adminJob.postedByType === "ADMIN", "Job correctly attributed to ADMIN");
  assert(adminJob.country === "Sierra Leone" && adminJob.city === "Freetown", "Location fields stored correctly");
  assert(adminJob.experienceRequired === true, "Experience required flag stored");
  assert(adminJob.hiringType === "TILL_DATE", "Hiring type stored");
  assert(adminJob.positionsOpen === 2, "Number of positions open stored");

  // -------------------------------------------------------------------------
  // Step 4: Alumni Creates a Job Opening with all 11 fields
  // -------------------------------------------------------------------------
  console.log(`\n[Step 4] Alumni creates an alumni-sponsored job opening...`);
  const alumniJobPayload = {
    title: "Full-Stack Software Engineer",
    company: "LeoneTech Innovations",
    country: "Sierra Leone",
    state: "Western Area Urban",
    city: "Freetown",
    type: "FULL_TIME",
    workplaceType: "REMOTE",
    salaryMin: 30000,
    salaryMax: 50000,
    currency: "SLE",
    category: "ENGINEERING",
    experienceRequired: false,
    experienceLevel: "ENTRY",
    hiringType: "IMMEDIATE",
    positionsOpen: 3,
    aboutCompany: "Fast-growing FinTech startup founded by IPAM alumni.",
    description: "Building next-generation digital banking solutions for West Africa.",
    requirements: ["Degree in Computer Science or Information Systems from IPAM / USL"],
    skills: ["TypeScript", "Next.js", "PostgreSQL", "Tailwind CSS"],
    benefits: ["Remote work flexibility", "Annual Tech Equipment Allowance", "Stock Options"],
  };

  const alumniCreateRes = await fetch(`${BASE_URL}/api/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify(alumniJobPayload),
  });
  const alumniCreateStatus = alumniCreateRes.status;
  const alumniCreateText = await alumniCreateRes.text();
  if (alumniCreateStatus !== 201) {
    console.error("Alumni create failed:", alumniCreateStatus, alumniCreateText);
  }
  assert(alumniCreateStatus === 201, "Alumni job creation returned 201 Created");
  const alumniJobData = JSON.parse(alumniCreateText);
  const alumniJob = alumniJobData.data || alumniJobData.job;
  assert(Boolean(alumniJob && alumniJob.id), "Alumni job created with valid ID");
  assert(alumniJob.postedByType === "ALUMNI", "Job correctly attributed to ALUMNI");
  assert(alumniJob.hiringType === "IMMEDIATE", "Immediate hiring flag stored");
  assert(alumniJob.experienceRequired === false, "Experience not required flag stored");
  assert(alumniJob.positionsOpen === 3, "Positions open count is 3");

  // -------------------------------------------------------------------------
  // Step 5: Public Jobs Listing & Verification of All 11 Fields
  // -------------------------------------------------------------------------
  console.log(`\n[Step 5] Verify public jobs listing includes all 11 required fields...`);
  const publicListRes = await fetch(`${BASE_URL}/api/jobs`);
  assert(publicListRes.status === 200, "Public jobs endpoint returned 200 OK");
  const publicData = await publicListRes.json();
  const jobsList: any[] = publicData.data?.jobs || publicData.jobs || publicData.data || [];
  assert(Array.isArray(jobsList), "Jobs returned as array");
  
  const foundAdminJob = jobsList.find((j: any) => j.id === adminJob.id);
  const foundAlumniJob = jobsList.find((j: any) => j.id === alumniJob.id);
  assert(Boolean(foundAdminJob), "Admin job present in public listings");
  assert(Boolean(foundAlumniJob), "Alumni job present in public listings");

  // Verify all 11 fields on the public listing
  assert(foundAdminJob.title === "Senior Risk & Audit Analyst", "1. Job title displayed clearly");
  assert(Boolean(foundAdminJob.description), "2. Job description present");
  assert(foundAdminJob.company === "Bank of Sierra Leone", "3. Employer/company displayed clearly");
  assert(Boolean(foundAdminJob.salary), "4. Salary range displayed clearly");
  assert(foundAdminJob.experienceRequired === true, "5. Experience requirement displayed clearly");
  assert(foundAdminJob.hiringType === "TILL_DATE", "6. Hiring till date / immediate hiring displayed clearly");
  assert(Boolean(foundAdminJob.aboutCompany), "7. About hiring company displayed clearly");
  assert(foundAdminJob.positionsOpen === 2, "8. Number of positions open displayed clearly");
  assert(foundAdminJob.postedByType === "ADMIN", "9. Job posted attribution (ADMIN) displayed clearly");
  assert(Boolean(foundAdminJob.postedDate), "10. Job posted date displayed clearly");
  assert(foundAdminJob.country === "Sierra Leone" && foundAdminJob.city === "Freetown", "11. Location Country/State/City dropdown fields displayed clearly");

  // -------------------------------------------------------------------------
  // Step 6: Isolation & Access Control
  // Admin sees ALL jobs; Alumni sees ONLY their own posted jobs on /manage
  // -------------------------------------------------------------------------
  console.log(`\n[Step 6] Testing permissions & hire management isolation...`);
  
  // Admin fetch all jobs
  const adminListRes = await fetch(`${BASE_URL}/api/admin/jobs`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminListRes.status === 200, "Admin jobs API returned 200 OK");
  const adminListData = await adminListRes.json();
  const allAdminJobs: any[] = adminListData.data?.jobs || adminListData.jobs || adminListData.data || [];
  const adminSawAlumniJob = allAdminJobs.some((j: any) => j.id === alumniJob.id);
  const adminSawAdminJob = allAdminJobs.some((j: any) => j.id === adminJob.id);
  assert(adminSawAlumniJob && adminSawAdminJob, "Admin can see ALL jobs posted by any user (Admin & Alumni)");

  // Alumni fetch their managed jobs
  const alumniManageRes = await fetch(`${BASE_URL}/api/jobs/manage`, {
    headers: { Cookie: alumniCookie },
  });
  assert(alumniManageRes.status === 200, "Alumni /manage returned 200 OK");
  const alumniManageData = await alumniManageRes.json();
  const alumniManagedJobs: any[] = alumniManageData.data?.jobs || alumniManageData.jobs || alumniManageData.data || [];
  const alumniManagedJobIds = alumniManagedJobs.map((j: any) => j.id);
  assert(alumniManagedJobIds.includes(alumniJob.id), "Alumni sees their own posted job");
  assert(!alumniManagedJobIds.includes(adminJob.id), "Alumni DOES NOT see other users' / Admin's posted jobs in hire management");

  // -------------------------------------------------------------------------
  // Step 7: Candidate Application Submission
  // -------------------------------------------------------------------------
  console.log(`\n[Step 7] Alumni submits candidate application to the alumni-posted job...`);
  const applyPayload = {
    candidateName: "Amara Kamara",
    email: "amara.kamara@alumni.ipam.edu",
    phone: "+232 76 998877",
    degree: "B.Sc. Information Technology",
    faculty: "Faculty of Information Systems",
    gradYear: 2023,
    experienceYears: 2,
    skills: ["TypeScript", "React", "Next.js", "REST APIs"],
    linkedinUrl: "https://linkedin.com/in/amara-kamara-dev",
    coverNote: "Passionate IPAM graduate excited to contribute to LeoneTech Innovations.",
  };

  const applyRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}/apply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify(applyPayload),
  });
  assert(applyRes.status === 201, "Candidate application submitted with 201 Created");
  const applyData = await applyRes.json();
  const application = applyData.data?.application || applyData.application || applyData.data;
  assert(Boolean(application && application.id), "Application created with ID");
  assert(application.candidateName === "Amara Kamara", "Candidate name recorded");
  assert(application.status === "PENDING" || application.status === "APPLIED", "Candidate initial status recorded");
  assert(application.matchScore >= 75, `Match score computed accurately: ${application.matchScore}%`);

  // -------------------------------------------------------------------------
  // Step 8: Candidate List & Status Transitions by Job Poster (Alumni)
  // -------------------------------------------------------------------------
  console.log(`\n[Step 8] Alumni managing candidate pipeline for their job...`);
  
  // 8a. Alumni views candidate list for their job
  const listCandidatesRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}/applications`, {
    headers: { Cookie: alumniCookie },
  });
  assert(listCandidatesRes.status === 200, "Alumni can retrieve candidates for their own job");
  const candidatesData = await listCandidatesRes.json();
  const candList: any[] = candidatesData.data?.applications || candidatesData.applications || candidatesData.data || [];
  const candInList = candList.find((a: any) => a.id === application.id);
  assert(Boolean(candInList), "Submitted candidate appears in poster's candidate list");

  // 8b. Alumni is blocked from viewing candidates of Admin's job
  const forbiddenCandidatesRes = await fetch(`${BASE_URL}/api/jobs/${adminJob.id}/applications`, {
    headers: { Cookie: alumniCookie },
  });
  assert(forbiddenCandidatesRes.status === 403, "Alumni is FORBIDDEN (403) from viewing candidates for another user's job");

  // 8c. Shortlist candidate
  console.log(`[Step 8c] Shortlisting candidate...`);
  const shortlistRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}/applications/${application.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      status: "SHORTLISTED",
      notes: "Strong frontend skills and relevant IPAM CS degree.",
    }),
  });
  assert(shortlistRes.status === 200, "Candidate updated to SHORTLISTED status");
  const shortlistedData = await shortlistRes.json();
  const shortlistedApp = shortlistedData.data?.application || shortlistedData.application || shortlistedData.data;
  assert(shortlistedApp.status === "SHORTLISTED", "Status confirmed as SHORTLISTED");

  // 8d. Schedule Interview
  console.log(`[Step 8d] Scheduling interview with candidate...`);
  const interviewDate = new Date(Date.now() + 3 * 86400000).toISOString();
  const interviewRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}/applications/${application.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      status: "INTERVIEW_SCHEDULED",
      interviewDate: interviewDate,
      notes: "Technical interview round 1 scheduled via Google Meet.",
    }),
  });
  assert(interviewRes.status === 200, "Candidate updated to INTERVIEW_SCHEDULED status");
  const interviewData = await interviewRes.json();
  const interviewedApp = interviewData.data?.application || interviewData.application || interviewData.data;
  assert(interviewedApp.status === "INTERVIEW_SCHEDULED", "Status confirmed as INTERVIEW_SCHEDULED");
  assert(Boolean(interviewedApp.interviewDate), "Interview date recorded");

  // 8e. Select Candidate & Extend Job Offer
  console.log(`[Step 8e] Selecting candidate and recording offer details...`);
  const selectRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}/applications/${application.id}/select`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      decisionStatus: "OFFER_EXTENDED",
      offerSalary: "SLE 45,000 / month",
      startDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      recruiterRemarks: "Selected as top candidate following technical round. Formal offer extended.",
    }),
  });
  assert(selectRes.status === 200, "Candidate selected and offer recorded successfully");
  const selectData = await selectRes.json();
  const selectedApp = selectData.data?.application || selectData.application || selectData.data;
  assert(selectedApp.status === "SELECTED", "Application status transitioned to SELECTED");
  assert(selectedApp.offerSalary === "SLE 45,000 / month", "Offer salary recorded");
  assert(Boolean(selectedApp.selectedDate), "Selection date recorded");

  // -------------------------------------------------------------------------
  // Step 9: Job Status Management
  // -------------------------------------------------------------------------
  console.log(`\n[Step 9] Updating job status (e.g. from ACTIVE to INTERVIEWING)...`);
  const updateJobRes = await fetch(`${BASE_URL}/api/jobs/${alumniJob.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumniCookie,
    },
    body: JSON.stringify({
      status: "INTERVIEWING",
    }),
  });
  assert(updateJobRes.status === 200, "Job status update returned 200 OK");
  const updatedJobData = await updateJobRes.json();
  const updatedJob = updatedJobData.data?.job || updatedJobData.job || updatedJobData.data;
  assert(updatedJob.status === "INTERVIEWING", "Job status is now INTERVIEWING");

  // -------------------------------------------------------------------------
  // Step 10: Admin Complete Visibility over All Candidates
  // -------------------------------------------------------------------------
  console.log(`\n[Step 10] Admin inspecting candidate dossier for the alumni job...`);
  const adminGetJobRes = await fetch(`${BASE_URL}/api/admin/jobs/${alumniJob.id}`, {
    headers: { Cookie: adminCookie },
  });
  assert(adminGetJobRes.status === 200, "Admin can retrieve details and candidate roster for any user's job");
  const adminJobDetailData = await adminGetJobRes.json();
  const adminJobDetail = adminJobDetailData.data?.job || adminJobDetailData.job || adminJobDetailData.data;
  assert(adminJobDetail.applications.length > 0, "Admin sees candidate applications for alumni job");
  const adminSeenCandidate = adminJobDetail.applications.find((a: any) => a.id === application.id);
  assert(Boolean(adminSeenCandidate), "Admin sees the candidate applied for alumni job");
  assert(adminSeenCandidate.status === "SELECTED", "Admin sees current candidate status as SELECTED");

  console.log(`\n======================================================`);
  console.log(`🎉 ALL TESTS PASSED! (${passedCount}/${totalCount})`);
  console.log(`======================================================\n`);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
