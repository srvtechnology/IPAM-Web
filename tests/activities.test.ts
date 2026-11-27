/**
 * Automated Verification: Activities Gallery CRUD & Public Endpoints
 */

import assert from "node:assert";
import { NextRequest } from "next/server";
import { db } from "../lib/db";
import { signAdminToken } from "../lib/auth/jwt";
import { GET as getPublicActivities } from "../app/api/activities/route";
import { GET as getAdminActivities, POST as createAdminActivity } from "../app/api/admin/activities/route";
import { PATCH as updateAdminActivity, DELETE as deleteAdminActivity } from "../app/api/admin/activities/[id]/route";

async function main() {
  console.log("===============================================================");
  console.log("📸 IPAM Activities Gallery Verification Suite");
  console.log("===============================================================\n");

  const admin = await db.adminUser.findFirst({ include: { role: true } });
  assert(admin, "Expected at least one admin user in DB");

  const adminToken = await signAdminToken({
    sub: admin.id,
    email: admin.email,
    roleId: admin.roleId,
    roleSlug: admin.role?.slug || "super_admin",
  });
  const headers = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  let createdId = "";

  try {
    // 1. Admin Create Activity
    console.log("[Test 1] Creating new Activity with multiple photos via POST /api/admin/activities...");
    const createReq = new NextRequest("http://localhost:3000/api/admin/activities", {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Test Campus Photo Walk 2026",
        description: "Multi-photo test gallery capturing student and alumni engagement on campus.",
        status: "CURRENT",
        displayDate: "November 2026",
        location: "Freetown Campus",
        category: "Campus Initiative",
        photos: [
          "/images/ipam_university_campus_1788350001937.jpg",
          "/images/alumni_networking_mixer.jpg",
        ],
        featured: false,
      }),
    });
    const createRes = await createAdminActivity(createReq);
    const createJson = await createRes.json();
    assert.strictEqual(createRes.status, 201, `Expected 201, got ${createRes.status}: ${JSON.stringify(createJson)}`);
    createdId = createJson.data.id;
    assert.strictEqual(createJson.data.photos.length, 2, "Expected 2 photos");
    console.log(`✅ PASS: Activity created (${createdId}) with 2 photos`);

    // 2. Public GET /api/activities
    console.log("\n[Test 2] Fetching public activities via GET /api/activities?status=CURRENT...");
    const pubReq = new NextRequest("http://localhost:3000/api/activities?status=CURRENT");
    const pubRes = await getPublicActivities(pubReq);
    const pubJson = await pubRes.json();
    assert(pubJson.data.some((a: { id: string }) => a.id === createdId), "Created activity must appear in public feed");
    console.log(`✅ PASS: Public API returned ${pubJson.data.length} CURRENT activities`);

    // 3. Admin Update Activity
    console.log("\n[Test 3] Updating Activity via PATCH /api/admin/activities/[id]...");
    const patchReq = new NextRequest(`http://localhost:3000/api/admin/activities/${createdId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        title: "Test Campus Photo Walk 2026 (Updated)",
        status: "PREVIOUS",
        photos: [
          "/images/ipam_university_campus_1788350001937.jpg",
          "/images/alumni_networking_mixer.jpg",
          "/images/alumni_gala_event_1788454750646.jpg",
        ],
      }),
    });
    const patchRes = await updateAdminActivity(patchReq, { params: Promise.resolve({ id: createdId }) });
    const patchJson = await patchRes.json();
    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchJson.data.status, "PREVIOUS");
    assert.strictEqual(patchJson.data.photos.length, 3);
    console.log("✅ PASS: Activity updated cleanly to PREVIOUS with 3 photos");

    // 4. Admin Delete Activity
    console.log("\n[Test 4] Deleting Activity via DELETE /api/admin/activities/[id]...");
    const delReq = new NextRequest(`http://localhost:3000/api/admin/activities/${createdId}`, {
      method: "DELETE",
      headers,
    });
    const delRes = await deleteAdminActivity(delReq, { params: Promise.resolve({ id: createdId }) });
    assert.strictEqual(delRes.status, 200);
    createdId = "";

    const adminListRes = await getAdminActivities(
      new NextRequest("http://localhost:3000/api/admin/activities", { headers })
    );
    const adminListJson = await adminListRes.json();
    assert(Array.isArray(adminListJson.data), "Expected array from admin GET");
    console.log("✅ PASS: Activity deleted cleanly");

    console.log("\n===============================================================");
    console.log("🎉 ALL ACTIVITIES GALLERY TESTS PASSED!");
    console.log("===============================================================");
  } finally {
    if (createdId) {
      await db.alumniActivity.deleteMany({ where: { id: createdId } });
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Activities test failed:", err);
    process.exit(1);
  });
