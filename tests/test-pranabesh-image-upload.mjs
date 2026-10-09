// Test specifically for Pranabesh Sarkar image upload and profile save with empty bio & optional fields
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

const SAMPLE_BASE64_AVATAR = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function run() {
  console.log("=== Testing Profile Image Upload with User Data ===");

  // 1. Authenticate as demo alumni
  const loginRes = await fetch(`${BASE_URL}/api/auth/alumni/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "demo.alumni@ipam.edu",
      password: "Password123!",
    }),
  });

  const rawCookies = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = rawCookies.match(/ipam_alumni_session=([^;]+)/);
  if (!tokenMatch) {
    throw new Error("Login failed to return session cookie");
  }
  const cookieHeader = `ipam_alumni_session=${tokenMatch[1]}`;

  // 2. Submit exact payload from the user screenshot (empty bio, no required min characters, empty skills, etc.)
  const pranabeshPayload = {
    name: "Pranabesh Sarkar",
    avatar: SAMPLE_BASE64_AVATAR,
    classYear: 2026,
    degree: "B.Sc. Information Technology",
    major: "Software Developer",
    currentRole: "Founder",
    company: "SRV Tech",
    industry: "Banking & Financial Services",
    country: "india",
    location: "Freetown",
    bio: "", // Empty bio as seen in DB and screenshot
    linkedin: "", // Empty LinkedIn
    isMentor: false,
    skills: []
  };

  console.log("Submitting PATCH /api/profile with empty bio and Base64 avatar...");
  const patchRes = await fetch(`${BASE_URL}/api/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader,
    },
    body: JSON.stringify(pranabeshPayload),
  });

  const patchText = await patchRes.text();
  console.log("Response status:", patchRes.status);
  console.log("Response body:", patchText);

  if (!patchRes.ok) {
    throw new Error(`PATCH /api/profile failed with status ${patchRes.status}: ${patchText}`);
  }

  const patchJson = JSON.parse(patchText);
  const updated = patchJson.data?.profile || patchJson.data;

  if (updated.avatar !== SAMPLE_BASE64_AVATAR) {
    throw new Error("Avatar was not updated to new Base64 string!");
  }

  console.log("✔ Profile image upload and profile save SUCCEEDED with zero validation errors!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
