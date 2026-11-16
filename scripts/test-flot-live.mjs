import fs from "fs";
import path from "path";
import crypto from "crypto";

const MERCHANT_ID = process.env.FLOT_MERCHANT_ID || "68ba690f-7499-404a-a2bf-c0d5b2cda7be";
const BASE_URL = process.env.FLOT_API_BASE_URL || "https://api.app.flotme.ai";
const privateKeyPath = path.resolve(process.cwd(), process.env.FLOT_PRIVATE_KEY_PATH || "keys/flot/private_key.pem");

if (!fs.existsSync(privateKeyPath)) {
  console.error("❌ RSA-4096 Private key not found at:", privateKeyPath);
  console.log("Run: npm run generate:flot-keys to create one.");
  process.exit(1);
}

const privateKey = fs.readFileSync(privateKeyPath, "utf8");

function signFlotPayload(payloadString, pKey) {
  const signer = crypto.createSign("RSA-SHA512");
  signer.update(payloadString);
  return signer.sign(
    {
      key: pKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
    },
    "base64"
  );
}

async function testPaymentLinkGeneration() {
  console.log("\n------------------------------------------------------------");
  console.log("1️⃣  TEST: Generating Payment Link with Live Flot Production API");
  console.log("------------------------------------------------------------");

  const testOrderId = `PVC-TEST-${Date.now().toString(36).toUpperCase()}`;
  const requestBody = {
    merchantId: MERCHANT_ID,
    type: "in-app",
    payload: {
      orderId: testOrderId,
      currency: "SLE",
      amount: "25",
    },
  };

  const bodyString = JSON.stringify(requestBody);
  const signature = signFlotPayload(bodyString, privateKey);

  console.log(`Endpoint:   POST ${BASE_URL}/merchants/private/v1/payment-links`);
  console.log(`Merchant:   ${MERCHANT_ID}`);
  console.log(`Order ID:   ${testOrderId}`);
  console.log(`Amount:     25 SLE`);
  console.log(`Signature:  ${signature.slice(0, 40)}... (${signature.length} bytes RSA-4096-PSS)`);

  const res = await fetch(`${BASE_URL}/merchants/private/v1/payment-links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Flot-Merchant-Signature": signature,
    },
    body: bodyString,
  });

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    json = null;
  }

  if (res.status === 200 && json?.data) {
    console.log("\n✅ SUCCESS: Payment Link Generated Successfully!");
    console.log(`Payment Attempt ID: ${json.data.id}`);
    console.log(`Payment Deep Link:  ${json.data.link}`);
    return { success: true, orderId: testOrderId, attemptId: json.data.id, link: json.data.link };
  } else {
    console.error(`\n❌ FAILED with Status ${res.status}:`, rawText);
    return { success: false, error: rawText };
  }
}

async function testStatusTracking(orderId, attemptId) {
  console.log("\n------------------------------------------------------------");
  console.log("2️⃣  TEST: Tracking Order Status via Flot Status API (GET)");
  console.log("------------------------------------------------------------");

  const endpointPath = `/merchants/private/v1/external-orders/${encodeURIComponent(orderId)}/payment-attempts/${encodeURIComponent(attemptId)}`;
  const canonical = `GET\n${endpointPath}`;
  const signature = signFlotPayload(canonical, privateKey);

  console.log(`Endpoint:   GET ${BASE_URL}${endpointPath}`);
  console.log(`Canonical:  ${canonical.replace(/\n/g, " \\n ")}`);

  const res = await fetch(`${BASE_URL}${endpointPath}`, {
    method: "GET",
    headers: {
      "X-Flot-Merchant-Signature": signature,
      "X-Flot-Merchant-Id": MERCHANT_ID,
    },
  });

  const rawText = await res.text();
  let json;
  try {
    json = JSON.parse(rawText);
  } catch {
    json = null;
  }

  if (res.status === 200 && json?.data) {
    console.log("\n✅ SUCCESS: Order Status Retrieved Successfully!");
    console.log(`Order ID:      ${json.data.externalId}`);
    console.log(`Attempt ID:    ${json.data.id}`);
    console.log(`Status:        ${json.data.status}`);
    console.log(`Payment Type:  ${json.data.paymentType}`);
    console.log(`Amount:        ${json.data.amount} ${json.data.currency}`);
    console.log(`Created At:    ${json.data.createdAt}`);
    return { success: true, data: json.data };
  } else {
    console.error(`\n❌ FAILED Status Check with HTTP ${res.status}:`, rawText);
    return { success: false, error: rawText };
  }
}

async function main() {
  console.log("============================================================");
  console.log("🚀 Flot Live Payment Gateway Verification");
  console.log(`Base URL:     ${BASE_URL}`);
  console.log(`Merchant ID:  ${MERCHANT_ID}`);
  console.log("============================================================");

  const linkResult = await testPaymentLinkGeneration();
  if (linkResult.success && linkResult.attemptId) {
    await testStatusTracking(linkResult.orderId, linkResult.attemptId);
  }

  console.log("\n============================================================");
  console.log("✨ All Live Verification Steps Completed!");
  console.log("============================================================");
}

main().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
