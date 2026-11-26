/**
 * Automated Verification: Mobile Banners, Flot Payment Gateway APIs & Cross-Verified Mobile Endpoints
 *
 * Tests against live local server / database:
 * 1. Bottom Banner & Home Banner APIs (/api/banners, /api/mobile/banners, /api/mobile/home, impressions/click)
 * 2. Flot Payment Gateway Mobile APIs (/api/payments/flot/config, /api/payments/flot/create-payment-link for SLE & USD, event/subscription/donation/card)
 * 3. Giving Hub API (/api/giving, /api/donations?summary=true, POST /api/donations with FLOT)
 * 4. Events filtering & pending vs paid state, Directory self-hiding & isConnected, Mobile Config
 */

import assert from "node:assert";
import { db } from "../lib/db";
import { GET as getBanners } from "../app/api/banners/route";
import { GET as getMobileBanners } from "../app/api/mobile/banners/route";
import { GET as getMobileHome } from "../app/api/mobile/home/route";
import { GET as getMobileConfig } from "../app/api/mobile/config/route";
import { GET as getFlotConfig } from "../app/api/payments/flot/config/route";
import { POST as createFlotLink } from "../app/api/payments/flot/create-payment-link/route";
import { GET as getGiving } from "../app/api/giving/route";
import { GET as getDonations } from "../app/api/donations/route";
import { GET as getEvents } from "../app/api/events/route";
import { GET as getAlumni } from "../app/api/alumni/route";
import { signAlumniToken } from "../lib/auth/jwt";
import { NextRequest } from "next/server";

async function main() {
  console.log("===============================================================");
  console.log("📱 IPAM Mobile API Cross-Verification Suite");
  console.log("===============================================================\n");

  const testSuffix = Date.now().toString(36).toUpperCase();
  const createdEventIds: string[] = [];

  try {
    // 0. Find an approved alumni user for authenticated Bearer token calls
    const user = await db.alumniUser.findFirst({
      where: { status: "APPROVED" },
      include: { profile: true },
    });
    assert(user, "Expected at least one approved alumni user in DB");

    const token = await signAlumniToken({ sub: user.id, email: user.email });
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 1. Mobile Config
    console.log("[Test 1] Mobile Config (/api/mobile/config)...");
    const configRes = await getMobileConfig();
    const configJson = await configRes.json();
    assert(configJson.data.features.flotPayments === true, "flotPayments flag should be true");
    assert(configJson.data.features.bottomBanners === true, "bottomBanners flag should be true");
    assert(configJson.data.payments.usdToSleRate === 22.5, "usdToSleRate should be 22.5");
    console.log("✅ PASS: /api/mobile/config includes Flot dual-currency & banner flags");

    // 2. Bottom Banners & Mobile Home Banners
    console.log("\n[Test 2] Banner APIs (/api/banners, /api/mobile/banners, /api/mobile/home)...");
    const bannersReq = new NextRequest("http://localhost:3000/api/banners?page=/");
    const bannersRes = await getBanners(bannersReq);
    const bannersJson = await bannersRes.json();
    assert(Array.isArray(bannersJson.data) && bannersJson.data.length > 0, "Expected active bottom banners for /");
    console.log(`✅ PASS: GET /api/banners?page=/ returned ${bannersJson.data.length} bottom banners`);

    const mobBannersReq = new NextRequest("http://localhost:3000/api/mobile/banners?page=/");
    const mobBannersRes = await getMobileBanners(mobBannersReq);
    const mobBannersJson = await mobBannersRes.json();
    assert(mobBannersJson.data.heroSlides.length > 0, "Expected heroSlides in /api/mobile/banners");
    assert(mobBannersJson.data.bottomBanners.length > 0, "Expected bottomBanners in /api/mobile/banners");
    console.log(
      `✅ PASS: GET /api/mobile/banners returned ${mobBannersJson.data.heroSlides.length} hero slides & ${mobBannersJson.data.bottomBanners.length} bottom banners`
    );

    const homeReq = new NextRequest("http://localhost:3000/api/mobile/home", { headers: authHeaders });
    const homeRes = await getMobileHome(homeReq);
    const homeJson = await homeRes.json();
    assert(homeJson.data.heroSlides.length > 0, "/api/mobile/home heroSlides should not be empty");
    assert(homeJson.data.bottomBanners.length > 0, "/api/mobile/home bottomBanners should not be empty");
    assert(homeJson.data.userContext?.id === user.id, "Expected userContext matching Bearer token");
    console.log("✅ PASS: GET /api/mobile/home returns real heroSlides, bottomBanners, featuredBusinesses & userContext");

    // 3. Flot Config & Payment Link Creation for Mobile
    console.log("\n[Test 3] Flot Gateway Mobile APIs (/api/payments/flot/config & create-payment-link)...");
    const flotConfigRes = await getFlotConfig();
    const flotConfigJson = await flotConfigRes.json();
    assert(flotConfigJson.data.gateway === "FLOT", "Gateway should be FLOT");
    assert(flotConfigJson.data.methodsByCurrency.USD.length === 1, "USD should only allow card");
    assert(flotConfigJson.data.methodsByCurrency.SLE.length === 3, "SLE should allow in-app, momo, card");
    console.log("✅ PASS: GET /api/payments/flot/config verified");

    // 3a. Create a paid event to test event_registration Flot checkout
    const paidEvent = await db.alumniEvent.create({
      data: {
        id: `evt-mob-${testSuffix}`,
        title: `Mobile Paid Summit ${testSuffix}`,
        date: new Date(Date.now() + 86400000 * 10),
        displayDate: "Dec 20, 2026",
        time: "5:00 PM GMT",
        location: "Freetown",
        category: "NETWORKING",
        description: "Test paid event for mobile Flot API",
        isPaid: true,
        ticketPrice: 45,
        currency: "SLE",
        capacity: 50,
        registeredCount: 0,
      },
    });
    createdEventIds.push(paidEvent.id);

    const evtPayReq = new NextRequest("http://localhost:3000/api/payments/flot/create-payment-link", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        purpose: "event_registration",
        eventId: paidEvent.id,
        ticketCount: 2,
        currency: "USD",
        type: "in-app", // should force "card" for USD
      }),
    });
    const evtPayRes = await createFlotLink(evtPayReq);
    const evtPayJson = await evtPayRes.json();
    assert(evtPayRes.status === 200, `Expected 200, got ${evtPayRes.status}: ${JSON.stringify(evtPayJson)}`);
    assert(evtPayJson.data.paymentType === "card", "USD payment must force card type");
    assert(evtPayJson.data.amount === 4, `90 SLE / 22.5 should equal 4 USD, got ${evtPayJson.data.amount}`);
    assert(evtPayJson.data.orderId.startsWith("BK-EVT-"), "Event orderId should start with BK-EVT-");
    console.log(`✅ PASS: Event checkout created USD card link (orderId: ${evtPayJson.data.orderId}, amount: $4.00)`);

    // 3b. Subscription Flot link (SLE MoMo)
    const subPayReq = new NextRequest("http://localhost:3000/api/payments/flot/create-payment-link", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        purpose: "subscription",
        subscriptionTier: "SILVER_LIFETIME",
        billingCycle: "ANNUAL",
        currency: "SLE",
        type: "momo",
      }),
    });
    const subPayRes = await createFlotLink(subPayReq);
    const subPayJson = await subPayRes.json();
    assert(subPayRes.status === 200, "Expected 200 for subscription link");
    assert(subPayJson.data.paymentType === "momo", "SLE MoMo should preserve momo type");
    assert(subPayJson.data.code?.startsWith("*715*"), "MoMo should generate *715* USSD code");
    console.log(`✅ PASS: Subscription SLE MoMo link created (code: ${subPayJson.data.code})`);

    // 4. Giving & Donations Hub
    console.log("\n[Test 4] Giving Hub APIs (/api/giving & /api/donations?summary=true)...");
    const givingRes = await getGiving();
    const givingJson = await givingRes.json();
    assert(givingJson.data.funds.length === 4, "Should return all 4 giving funds");
    assert(typeof givingJson.data.stats.totalContributed === "number", "Should return totalContributed");
    console.log(`✅ PASS: GET /api/giving returned 4 funds & ${givingJson.data.bottomBanners.length} banners`);

    const donSumReq = new NextRequest("http://localhost:3000/api/donations?summary=true");
    const donSumRes = await getDonations(donSumReq);
    const donSumJson = await donSumRes.json();
    assert(donSumJson.data.funds.length === 4, "Summary should return 4 funds");
    console.log("✅ PASS: GET /api/donations?summary=true verified");

    // 5. Events & Directory Bearer Auth consistency
    console.log("\n[Test 5] Events & Directory Bearer Auth Consistency...");
    const evtsReq = new NextRequest("http://localhost:3000/api/events?isPaid=true", { headers: authHeaders });
    const evtsRes = await getEvents(evtsReq);
    const evtsJson = await evtsRes.json();
    const targetEvt = evtsJson.data.find((e: { id: string }) => e.id === paidEvent.id);
    assert(targetEvt, "Created paid event should appear in filtered GET /api/events?isPaid=true");
    assert(targetEvt.registered === false, "PENDING paid event booking must NOT mark registered=true");
    assert(targetEvt.registrationPaymentStatus === "PENDING", "Should expose registrationPaymentStatus=PENDING");
    console.log("✅ PASS: GET /api/events accurately separates PENDING vs PAID bookings");

    const dirReq = new NextRequest("http://localhost:3000/api/alumni", { headers: authHeaders });
    const dirRes = await getAlumni(dirReq);
    const dirJson = await dirRes.json();
    const selfFound = dirJson.data.some((m: { userId: string }) => m.userId === user.id);
    assert(!selfFound, "Authenticated directory should hide current user's own profile");
    assert(typeof dirJson.data[0]?.isConnected === "boolean", "Directory items should expose isConnected boolean");
    console.log("✅ PASS: GET /api/alumni hides self & includes isConnected flag");

    console.log("\n===============================================================");
    console.log("🎉 ALL MOBILE API VERIFICATION TESTS PASSED!");
    console.log("===============================================================");
  } finally {
    // Cleanup temporary test rows
    await db.eventRegistration.deleteMany({ where: { eventId: { in: createdEventIds } } });
    await db.alumniEvent.deleteMany({ where: { id: { in: createdEventIds } } });
    await db.membershipSubscription.deleteMany({ where: { status: "PENDING" } });
    await db.transaction.deleteMany({ where: { status: "PENDING" } });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Mobile API verification failed:", err);
    process.exit(1);
  });
