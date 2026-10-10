import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function login(email, password, type = "alumni") {
  const endpoint = type === "admin" ? "/api/auth/admin/login" : "/api/auth/alumni/login";
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json().catch(() => null);
  assert.equal(res.status, 200, `Login failed for ${email}: ${JSON.stringify(body)}`);

  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie, `No set-cookie returned for ${email}`);
  const cookie = setCookie.split(";")[0];
  return { cookie, user: body.data };
}

async function run() {
  console.log("=====================================================================");
  console.log("TESTING STATE MANAGEMENT: BANNER UPLOAD & AFTER-CREATE LIST LIFECYCLE");
  console.log("=====================================================================");
  console.log(`Connecting to: ${BASE_URL}\n`);

  // Step 1: Login
  console.log("▶ [Step 1] Authenticating Alumni & Admin...");
  const alumni = await login("demo.alumni@ipam.edu", "Password123!", "alumni");
  const admin = await login("demo.admin@ipam.edu", "Password123!", "admin");
  console.log("✔ Authentication successful.\n");

  // Step 2: Uploading Banner 1 & Submitting Business
  console.log("▶ [Step 2] Testing Initial Banner Image Upload & Creation State...");
  const banner1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const initialPayload = {
    name: "State Management Venture " + Date.now(),
    founders: "Mariatu Kamara",
    classYear: "2020",
    category: "Technology & Consulting",
    industry: "Information Technology",
    tagline: "First-generation banner upload",
    description: "Testing state management for enterprise creation with banner image.",
    website: "https://statemanagement.example.com",
    location: "Freetown, Sierra Leone",
    contactEmail: "mariatu@statemanagement.example.com",
    contactPhone: "+232 77 999888",
    bannerImage: banner1,
    services: ["Strategy", "IT Architecture"],
  };

  const createRes = await fetch(`${BASE_URL}/api/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify(initialPayload),
  });

  assert.equal(createRes.status, 201, "Expected 201 Created");
  const created = (await createRes.json()).data;
  assert.ok(created.id, "Expected created.id");
  assert.equal(created.status, "PENDING_APPROVAL", "State must be PENDING_APPROVAL");
  assert.equal(created.submittedByType, "ALUMNI", "State must record submittedByType as ALUMNI");
  assert.equal(created.bannerImage, banner1, "State must persist banner image 1");
  console.log("✔ Business created with banner image 1. ID:", created.id);

  // Step 3: Checking List Business State After Create (Alumni View vs Public View)
  console.log("\n▶ [Step 3] Verifying List State Immediately After Creation...");
  // 3a. Public Directory State
  const publicRes1 = await fetch(`${BASE_URL}/api/businesses`);
  const publicList1 = (await publicRes1.json()).data;
  const inPublic1 = publicList1.find((b) => b.id === created.id);
  assert.equal(inPublic1, undefined, "Unapproved business must NOT exist in public directory state");
  console.log("✔ Public directory correctly hides the pending listing.");

  // 3b. Alumni Submissions State (mine=true)
  const mineRes1 = await fetch(`${BASE_URL}/api/businesses?mine=true`, {
    headers: { Cookie: alumni.cookie },
  });
  const mineList1 = (await mineRes1.json()).data;
  const myItem1 = mineList1.find((b) => b.id === created.id);
  assert.ok(myItem1, "Alumni submissions list MUST contain the newly created business");
  assert.equal(myItem1.status, "PENDING_APPROVAL", "Item status in list state must be PENDING_APPROVAL");
  assert.equal(myItem1.bannerImage, banner1, "Item in list state must have banner image 1");
  console.log("✔ Alumni's submissions list immediately contains the pending enterprise with banner image.");

  // Step 4: Editing and Uploading a Replacement Banner Image
  console.log("\n▶ [Step 4] Testing Banner Replacement & State Update in Edit Mode...");
  const banner2 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M/wHwMDAwMDkAcABykC/V6aBaoAAAAASUVORK5CYII=";
  const updateRes = await fetch(`${BASE_URL}/api/businesses/${created.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      tagline: "Updated Tagline - High Definition Banner 2",
      bannerImage: banner2,
      services: ["Strategy", "IT Architecture", "Cloud Native Migration"],
    }),
  });

  assert.equal(updateRes.status, 200, "Expected 200 OK for edit");
  const updated = (await updateRes.json()).data;
  assert.equal(updated.tagline, "Updated Tagline - High Definition Banner 2");
  assert.equal(updated.bannerImage, banner2, "State must now hold replacement banner 2");
  assert.equal(updated.status, "PENDING_APPROVAL", "Status must stay PENDING_APPROVAL");
  console.log("✔ Banner image and metadata updated successfully in state.");

  // Step 5: Admin Listing State Management
  console.log("\n▶ [Step 5] Checking Admin Listing & Counters State...");
  const adminRes1 = await fetch(`${BASE_URL}/api/admin/businesses`, {
    headers: { Cookie: admin.cookie },
  });
  const adminData1 = (await adminRes1.json()).data;
  assert.ok(adminData1.counts.pending >= 1, "Admin pending count state must be >= 1");
  const adminItem1 = adminData1.businesses.find((b) => b.id === created.id);
  assert.ok(adminItem1, "Admin list state must include the pending business");
  assert.equal(adminItem1.bannerImage, banner2, "Admin list item must hold replacement banner 2");
  console.log("✔ Admin desk list state reflects the pending enterprise and updated banner.");

  // Step 6: Admin Approval State Transition
  console.log("\n▶ [Step 6] Testing Admin Approval State Transition...");
  const approveRes = await fetch(`${BASE_URL}/api/admin/businesses/${created.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert.equal(approveRes.status, 200);
  const approvedData = (await approveRes.json()).data;
  assert.equal(approvedData.status, "APPROVED", "Status must transition to APPROVED");
  console.log("✔ Admin approved the business listing.");

  // Step 7: Public Directory List State After Approval
  console.log("\n▶ [Step 7] Checking Public Directory State After Approval...");
  const publicRes2 = await fetch(`${BASE_URL}/api/businesses`);
  const publicList2 = (await publicRes2.json()).data;
  const inPublic2 = publicList2.find((b) => b.id === created.id);
  assert.ok(inPublic2, "Approved business MUST now be present in public directory state");
  assert.equal(inPublic2.bannerImage, banner2, "Public directory card must display replacement banner 2");
  assert.equal(inPublic2.tagline, "Updated Tagline - High Definition Banner 2");
  console.log("✔ Public directory list state immediately reflects the approved enterprise and banner.");

  // Step 8: Admin Creation State (Instant Approval)
  console.log("\n▶ [Step 8] Testing Admin Direct Creation State (No Approval Needed)...");
  const adminDirectPayload = {
    name: "Admin Fast Track Venture " + Date.now(),
    founders: "IPAM Commercial Office",
    classYear: "2016",
    category: "Financial Services & FinTech",
    industry: "Financial Services",
    tagline: "Admin verified directly",
    description: "Enterprise created by administrator.",
    website: "https://adminfasttrack.example.com",
    location: "Freetown",
    contactEmail: "adminfasttrack@ipam.edu",
    bannerImage: banner1,
  };
  const adminCreateRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify(adminDirectPayload),
  });
  assert.equal(adminCreateRes.status, 201);
  const adminCreated = (await adminCreateRes.json()).data;
  assert.equal(adminCreated.status, "APPROVED", "Admin created business state must be APPROVED immediately");
  assert.equal(adminCreated.submittedByType, "ADMIN", "submittedByType must be ADMIN");
  console.log("✔ Admin created enterprise is APPROVED immediately without approval gate.");

  // Verify it appears in public list immediately
  const publicRes3 = await fetch(`${BASE_URL}/api/businesses`);
  const publicList3 = (await publicRes3.json()).data;
  assert.ok(publicList3.find((b) => b.id === adminCreated.id), "Admin created business must appear in public list state immediately");
  console.log("✔ Admin created enterprise immediately appears in public list state.");

  // Step 9: Testing Rejection and Automatic Resubmission State Cycle
  console.log("\n▶ [Step 9] Testing Rejection and Automatic Resubmission State Flow...");
  const bizForRejectionRes = await fetch(`${BASE_URL}/api/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      ...initialPayload,
      name: "Rejection Lifecycle Test " + Date.now(),
    }),
  });
  const bizForRejection = (await bizForRejectionRes.json()).data;
  assert.equal(bizForRejection.status, "PENDING_APPROVAL");

  // Admin rejects with reason
  const rejectRes = await fetch(`${BASE_URL}/api/admin/businesses/${bizForRejection.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify({
      status: "REJECTED",
      rejectionReason: "Banner image must be clear and logo must be provided.",
    }),
  });
  const rejected = (await rejectRes.json()).data;
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.rejectionReason, "Banner image must be clear and logo must be provided.");
  console.log("✔ Business state transitioned to REJECTED with rejectionReason recorded.");

  // Alumni edits the rejected business -> state must auto-transition back to PENDING_APPROVAL
  const resubmitRes = await fetch(`${BASE_URL}/api/businesses/${bizForRejection.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      bannerImage: banner2,
      description: "Updated with full information and crisp banner.",
    }),
  });
  const resubmitted = (await resubmitRes.json()).data;
  assert.equal(resubmitted.status, "PENDING_APPROVAL", "Editing rejected business must transition state to PENDING_APPROVAL");
  assert.equal(resubmitted.rejectionReason, null, "Rejection reason must be cleared in state");
  console.log("✔ Alumni edit automatically transitioned rejected business back to PENDING_APPROVAL with cleared reason.");

  // Clean up fixtures
  console.log("\n▶ [Step 10] Cleaning Up Test Records...");
  await fetch(`${BASE_URL}/api/admin/businesses/${created.id}`, { method: "DELETE", headers: { Cookie: admin.cookie } });
  await fetch(`${BASE_URL}/api/admin/businesses/${adminCreated.id}`, { method: "DELETE", headers: { Cookie: admin.cookie } });
  await fetch(`${BASE_URL}/api/admin/businesses/${bizForRejection.id}`, { method: "DELETE", headers: { Cookie: admin.cookie } });
  console.log("✔ Cleaned up temporary test records.");

  console.log("\n✨ ALL STATE MANAGEMENT AND BANNER UPLOADING FLOW TESTS PASSED SUCCESSFULLY! ✨");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
