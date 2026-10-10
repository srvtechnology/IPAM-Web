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
  console.log("=== Testing Alumni Business Management & Approval Governance ===");
  console.log(`Connecting to: ${BASE_URL}`);

  // 1. Authenticate alumni and admin
  console.log("1. Authenticating users...");
  const alumni = await login("demo.alumni@ipam.edu", "Password123!", "alumni");
  console.log("   Alumni logged in successfully:", alumni.user.email);

  const admin = await login("demo.admin@ipam.edu", "Password123!", "admin");
  console.log("   Admin logged in successfully:", admin.user.email);

  // 2. Alumni submits a new business with a banner image
  console.log("2. Alumni submitting a business listing with banner image...");
  const bannerImageBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const alumniBizPayload = {
    name: "Alumni Test Tech " + Date.now(),
    founders: "Aminata Sesay & David Koroma",
    classYear: "2019",
    category: "SaaS & Software",
    industry: "Information Technology",
    tagline: "Innovative cloud applications for West Africa",
    description: "Enterprise software tailored for Sierra Leonean organizations and digital workflow automation.",
    website: "https://alumnitesttech.example.com",
    location: "Freetown, Sierra Leone",
    contactEmail: "contact@alumnitesttech.example.com",
    contactPhone: "+232 76 123456",
    bannerImage: bannerImageBase64,
    services: ["Cloud Integration", "Custom Web Apps"],
  };

  const createRes = await fetch(`${BASE_URL}/api/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify(alumniBizPayload),
  });

  const createBody = await createRes.json();
  assert.equal(createRes.status, 201, `Business creation failed: ${JSON.stringify(createBody)}`);
  const createdBiz = createBody.data;
  console.log("   Created business ID:", createdBiz.id);
  assert.equal(createdBiz.status, "PENDING_APPROVAL", "Alumni-created business must be PENDING_APPROVAL");
  assert.equal(createdBiz.submittedByType, "ALUMNI", "submittedByType must be ALUMNI");
  assert.equal(createdBiz.bannerImage, bannerImageBase64, "bannerImage must match submitted image");

  // 3. Public directory should NOT show the unapproved business
  console.log("3. Verifying unapproved business does NOT appear in public directory...");
  const publicRes = await fetch(`${BASE_URL}/api/businesses`);
  const publicBody = await publicRes.json();
  assert.equal(publicRes.status, 200);
  const foundInPublic = publicBody.data.find((b) => b.id === createdBiz.id);
  assert.equal(foundInPublic, undefined, "Pending business must not appear in public approved directory");
  console.log("   Verified: Unapproved business is hidden from public directory.");

  // 4. Alumni can retrieve their own submitted businesses
  console.log("4. Alumni fetching their own submitted businesses (mine=true)...");
  const mineRes = await fetch(`${BASE_URL}/api/businesses?mine=true`, {
    headers: { Cookie: alumni.cookie },
  });
  const mineBody = await mineRes.json();
  assert.equal(mineRes.status, 200);
  const myBiz = mineBody.data.find((b) => b.id === createdBiz.id);
  assert.ok(myBiz, "Alumni must see their own submitted business in mine=true");
  assert.equal(myBiz.status, "PENDING_APPROVAL");
  console.log("   Verified: Alumni can list their submitted business.");

  // 5. Alumni edits their business (changes tagline and banner)
  console.log("5. Alumni editing their business and banner image...");
  const updatedBanner = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M/wHwMDAwMDkAcABykC/V6aBaoAAAAASUVORK5CYII=";
  const updateRes = await fetch(`${BASE_URL}/api/businesses/${createdBiz.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      tagline: "Updated Tagline - Sierra Leone Cloud Pioneer",
      bannerImage: updatedBanner,
    }),
  });
  const updateBody = await updateRes.json();
  assert.equal(updateRes.status, 200, `Update failed: ${JSON.stringify(updateBody)}`);
  assert.equal(updateBody.data.tagline, "Updated Tagline - Sierra Leone Cloud Pioneer");
  assert.equal(updateBody.data.bannerImage, updatedBanner);
  assert.equal(updateBody.data.status, "PENDING_APPROVAL", "Status must remain PENDING_APPROVAL");
  console.log("   Verified: Alumni edited listing and banner image successfully.");

  // 6. Admin lists businesses and sees pending approval
  console.log("6. Admin listing businesses and checking pending count...");
  const adminListRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    headers: { Cookie: admin.cookie },
  });
  const adminListBody = await adminListRes.json();
  assert.equal(adminListRes.status, 200);
  assert.ok(adminListBody.data.counts.pending >= 1, "Pending count should be >= 1");
  const adminFoundBiz = adminListBody.data.businesses.find((b) => b.id === createdBiz.id);
  assert.ok(adminFoundBiz, "Admin must see pending business in admin list");
  console.log("   Verified: Admin sees pending business.");

  // 7. Admin approves the business
  console.log("7. Admin approving the alumni business...");
  const approveRes = await fetch(`${BASE_URL}/api/admin/businesses/${createdBiz.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify({ status: "APPROVED" }),
  });
  const approveBody = await approveRes.json();
  assert.equal(approveRes.status, 200);
  assert.equal(approveBody.data.status, "APPROVED");
  console.log("   Verified: Business status updated to APPROVED by Admin.");

  // 8. Approved business is now live in public directory
  console.log("8. Verifying approved business is live in public directory...");
  const publicApprovedRes = await fetch(`${BASE_URL}/api/businesses`);
  const publicApprovedBody = await publicApprovedRes.json();
  const liveBiz = publicApprovedBody.data.find((b) => b.id === createdBiz.id);
  assert.ok(liveBiz, "Approved business must now be visible in public directory");
  assert.equal(liveBiz.tagline, "Updated Tagline - Sierra Leone Cloud Pioneer");
  console.log("   Verified: Business is now live in public directory!");

  // 9. Admin adds a business directly (does NOT need approval)
  console.log("9. Admin creating an institutional business listing directly...");
  const adminBizPayload = {
    name: "Admin Institutional Enterprise " + Date.now(),
    founders: "IPAM Commercial Bureau",
    classYear: "2015",
    category: "Financial Services & FinTech",
    industry: "Banking & Financial Services",
    tagline: "Directly Published by Administration",
    description: "Official institutional incubator venture funded by alumni endowment.",
    website: "https://ipamenterprise.example.com",
    location: "Tower Hill, Freetown",
    contactEmail: "bureau@ipam.edu",
    bannerImage: bannerImageBase64,
  };

  const adminCreateRes = await fetch(`${BASE_URL}/api/admin/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify(adminBizPayload),
  });
  const adminCreateBody = await adminCreateRes.json();
  assert.equal(adminCreateRes.status, 201, `Admin creation failed: ${JSON.stringify(adminCreateBody)}`);
  const adminCreatedBiz = adminCreateBody.data;
  assert.equal(adminCreatedBiz.status, "APPROVED", "Admin added business must be APPROVED immediately");
  assert.equal(adminCreatedBiz.submittedByType, "ADMIN", "submittedByType must be ADMIN");
  console.log("   Verified: Admin added business is APPROVED immediately without approval gate.");

  // 10. Admin added business is immediately visible in public directory
  console.log("10. Verifying Admin added business is immediately visible publicly...");
  const publicAdminCheckRes = await fetch(`${BASE_URL}/api/businesses`);
  const publicAdminCheckBody = await publicAdminCheckRes.json();
  const foundAdminBiz = publicAdminCheckBody.data.find((b) => b.id === adminCreatedBiz.id);
  assert.ok(foundAdminBiz, "Admin added business must appear immediately in public directory");
  console.log("   Verified: Admin business is immediately live publicly.");

  // 11. Admin rejection & Alumni resubmission flow
  console.log("11. Testing Rejection and Resubmission cycle...");
  const subBizRes = await fetch(`${BASE_URL}/api/businesses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      ...alumniBizPayload,
      name: "To-Be-Rejected Venture " + Date.now(),
    }),
  });
  const subBiz = (await subBizRes.json()).data;
  assert.equal(subBiz.status, "PENDING_APPROVAL");

  // Admin rejects with reason
  const rejectRes = await fetch(`${BASE_URL}/api/admin/businesses/${subBiz.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: admin.cookie,
    },
    body: JSON.stringify({
      status: "REJECTED",
      rejectionReason: "Please provide complete Sierra Leone registration info.",
    }),
  });
  const rejectedBiz = (await rejectRes.json()).data;
  assert.equal(rejectedBiz.status, "REJECTED");
  assert.equal(rejectedBiz.rejectionReason, "Please provide complete Sierra Leone registration info.");
  console.log("   Verified: Admin rejection recorded reason.");

  // Alumni edits the rejected business -> automatically transitions to PENDING_APPROVAL for re-review
  const resubmitRes = await fetch(`${BASE_URL}/api/businesses/${subBiz.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: alumni.cookie,
    },
    body: JSON.stringify({
      description: "Updated with full Sierra Leone registration details and certified accreditation.",
    }),
  });
  const resubmittedBiz = (await resubmitRes.json()).data;
  assert.equal(resubmittedBiz.status, "PENDING_APPROVAL", "Editing rejected business must re-submit to PENDING_APPROVAL");
  assert.equal(resubmittedBiz.rejectionReason, null, "Rejection reason must be cleared upon resubmission");
  console.log("   Verified: Alumni edit automatically transitioned rejected business back to PENDING_APPROVAL.");

  // Cleanup test businesses
  console.log("12. Cleaning up test fixtures...");
  await fetch(`${BASE_URL}/api/admin/businesses/${createdBiz.id}`, {
    method: "DELETE",
    headers: { Cookie: admin.cookie },
  });
  await fetch(`${BASE_URL}/api/admin/businesses/${adminCreatedBiz.id}`, {
    method: "DELETE",
    headers: { Cookie: admin.cookie },
  });
  await fetch(`${BASE_URL}/api/admin/businesses/${subBiz.id}`, {
    method: "DELETE",
    headers: { Cookie: admin.cookie },
  });
  console.log("   Cleaned up test businesses.");

  console.log("\nAll 12 test assertions PASSED flawlessly! ✨");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
