const TARGET_URL = process.env.WEBHOOK_TARGET || "http://localhost:3000/api/payments/flot/webhook";
const USERNAME = process.env.FLOT_WEBHOOK_USERNAME || "ipam_flot_webhook";
const PASSWORD = process.env.FLOT_WEBHOOK_PASSWORD || "QqfeSwVmCKCSf82l6ku_GC1UtA4ZLVYD";

const orderId = process.argv[2] || "PVC-DEMO-ORDER";
const status = process.argv[3] || "completed"; // "completed" or "failed"
const flotRequestId = process.argv[4] || `flot-req-${Date.now()}`;

async function main() {
  console.log("============================================================");
  console.log("🔔 Simulating Incoming Flot Webhook");
  console.log("Target:", TARGET_URL);
  console.log("OrderId:", orderId);
  console.log("Status:", status);
  console.log("FlotRequestId:", flotRequestId);
  console.log("============================================================");

  const basicAuth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString("base64");
  const payload = {
    orderId,
    flotRequestId,
    status,
  };

  try {
    const res = await fetch(TARGET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify(payload),
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log("Response Body:", text);

    if (res.ok) {
      console.log("\n✅ Webhook delivered and accepted successfully!");
    } else {
      console.error("\n❌ Webhook was rejected or failed.");
    }
  } catch (err) {
    console.error("Network error delivering webhook:", err.message);
    console.log("\n💡 Note: Make sure the local dev server is running (`npm run dev`) at http://localhost:3000");
  }
}

main();
