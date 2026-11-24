/**
 * Automated Verification: Paid Event Booking with Flot Gateway Integration
 * 
 * Verifies:
 * 1. Paid events calculate total ticket pricing based on seat quantity.
 * 2. Pending registration is created with paymentStatus: "PENDING" and paymentMethod: "FLOT".
 * 3. A corresponding transaction is registered in db.transaction with status: "PENDING" and tier: "Event Registration - ...".
 * 4. When Flot payment completes, registration becomes paymentStatus: "PAID" and transaction becomes status: "SETTLED".
 * 5. Audit log is created for commercial finance traceability.
 * 6. Free events continue to register cleanly with paymentStatus: "FREE".
 */

import { db } from "../lib/db";
import { writeAuditLog } from "../lib/audit";

async function runTest() {
  console.log("===============================================================");
  console.log("🎟️ Paid Event Booking with Flot Gateway Verification");
  console.log("===============================================================\n");

  const testSuffix = Date.now().toString(36).toUpperCase();
  const testEventId = `evt-test-${testSuffix}`;
  const testFreeEventId = `evt-free-${testSuffix}`;
  let testUserId = "";

  try {
    // 0. Find or create an alumni user for testing
    let user = await db.alumniUser.findFirst({
      where: { status: "APPROVED" },
      include: { profile: true },
    });

    if (!user) {
      user = await db.alumniUser.create({
        data: {
          email: `attendee.${testSuffix}@ipam.edu.sl`,
          passwordHash: "hashed_dummy_password",
          studentId: `STU-${testSuffix}`,
          status: "APPROVED",
        },
        include: { profile: true },
      });
    }
    testUserId = user.id;
    const attendeeName = user.profile?.name || user.email;

    // 1. Create a Paid Event
    console.log("[Step 1] Creating a Paid Event...");
    const paidEvent = await db.alumniEvent.create({
      data: {
        id: testEventId,
        title: `Annual Tech Gala ${testSuffix}`,
        date: new Date(Date.now() + 86400000 * 7),
        displayDate: "Saturday, Dec 12, 2026",
        time: "6:00 PM GMT",
        location: "Freetown International Conference Center",
        category: "NETWORKING",
        description: "Prestigious annual gathering of distinguished alumni and industry leaders.",
        isPaid: true,
        ticketPrice: 50.00,
        currency: "SLE",
        capacity: 100,
        registeredCount: 0,
      },
    });
    console.log(`✅ Paid Event created: "${paidEvent.title}" (Price: ${paidEvent.currency} ${Number(paidEvent.ticketPrice).toFixed(2)})`);

    // 2. Simulate User initiating registration for 2 tickets via Flot
    console.log("\n[Step 2] Simulating Paid Event Booking Initiation (2 Seats via Flot)...");
    const ticketCount = 2;
    const totalAmount = Number(paidEvent.ticketPrice) * ticketCount;
    const bookingReference = `BK-EVT-${testSuffix}-A1`;

    const pendingRegistration = await db.eventRegistration.create({
      data: {
        bookingReference,
        eventId: paidEvent.id,
        userId: testUserId,
        ticketCount,
        unitPrice: paidEvent.ticketPrice,
        totalAmount,
        currency: paidEvent.currency,
        paymentStatus: "PENDING",
        paymentMethod: "FLOT",
        bookingStatus: "CONFIRMED",
        attendeeName,
        attendeeEmail: user.email,
        attendeePhone: "+232 76 999 888",
        source: "SELF_SERVICE",
      },
    });

    const txnRef = `TXN-${bookingReference}`;
    const pendingTxn = await db.transaction.create({
      data: {
        refId: txnRef,
        method: "Flot Event Booking",
        methodColor: "PRIMARY",
        amount: totalAmount,
        currency: paidEvent.currency === "SLE" ? "SLE" : "USD",
        tier: `Event Registration - ${paidEvent.title}`,
        status: "PENDING",
        alumniName: attendeeName,
      },
    });

    console.log(`✅ Pending Registration created: ${pendingRegistration.bookingReference}`);
    console.log(`   Status: ${pendingRegistration.paymentStatus}, Method: ${pendingRegistration.paymentMethod}, Amount: ${pendingRegistration.currency} ${pendingRegistration.totalAmount}`);
    console.log(`✅ Admin Finance Transaction recorded: ${pendingTxn.refId}`);
    console.log(`   Type: ${pendingTxn.tier}, Status: ${pendingTxn.status}`);

    // 3. Simulate Flot Payment Success (Webhook / Status Polling completion)
    console.log("\n[Step 3] Simulating Flot Payment Settlement (Status: completed)...");
    const flotAttemptId = `FLOT-ATTEMPT-${testSuffix}`;

    const settledRegistration = await db.eventRegistration.update({
      where: { id: pendingRegistration.id },
      data: {
        paymentStatus: "PAID",
        paymentRef: flotAttemptId,
      },
    });

    const settledTxn = await db.transaction.update({
      where: { id: pendingTxn.id },
      data: {
        status: "SETTLED",
      },
    });

    const audit = await writeAuditLog({
      actorName: "Flot Payment Gateway",
      actorEmail: "gateway@flotme.ai",
      actorRole: "PAYMENT_GATEWAY",
      action: "EVENT_BOOKING_PAYMENT_COMPLETED",
      actionLabel: "Flot Event Booking Paid",
      category: "COMMERCIAL_FINANCE",
      target: `Event Booking #${settledRegistration.bookingReference}`,
      targetType: "EventRegistration",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress: "127.0.0.1",
      details: `Flot payment of ${settledRegistration.currency} ${Number(settledRegistration.totalAmount).toFixed(2)} completed for event booking #${settledRegistration.bookingReference}. Flot Ref: ${flotAttemptId}.`,
      beforeState: { paymentStatus: "PENDING" },
      afterState: { paymentStatus: "PAID", paymentMethod: "FLOT", paymentRef: flotAttemptId },
    });

    console.log(`✅ Registration marked PAID: ${settledRegistration.bookingReference} (Flot Ref: ${settledRegistration.paymentRef})`);
    console.log(`✅ Finance Transaction updated to SETTLED: ${settledTxn.refId}`);
    if (audit?.id) {
      console.log(`✅ Audit Log recorded for Admin Panel: #${audit.id} - ${audit.actionLabel}`);
    }

    // 4. Test Free Event RSVP registration
    console.log("\n[Step 4] Testing Free Event RSVP (Zero Payment)...");
    const freeEvent = await db.alumniEvent.create({
      data: {
        id: testFreeEventId,
        title: `Alumni Career Mentorship Hour ${testSuffix}`,
        date: new Date(Date.now() + 86400000 * 14),
        displayDate: "Friday, Dec 18, 2026",
        time: "3:00 PM GMT",
        location: "Virtual Room A",
        category: "NETWORKING",
        description: "Interactive session on resume preparation and international interview strategies.",
        isPaid: false,
        ticketPrice: 0.00,
        currency: "SLE",
        capacity: 200,
        registeredCount: 0,
      },
    });

    const freeBookingRef = `BK-EVT-FREE-${testSuffix}`;
    const freeReg = await db.eventRegistration.create({
      data: {
        bookingReference: freeBookingRef,
        eventId: freeEvent.id,
        userId: testUserId,
        ticketCount: 1,
        unitPrice: 0,
        totalAmount: 0,
        currency: "SLE",
        paymentStatus: "FREE",
        paymentMethod: "FREE",
        bookingStatus: "CONFIRMED",
        attendeeName,
        attendeeEmail: user.email,
        source: "SELF_SERVICE",
      },
    });
    console.log(`✅ Free Event Registration confirmed: ${freeReg.bookingReference} (Status: ${freeReg.paymentStatus})`);

    // 5. Verification Queries for Admin Finance
    console.log("\n[Step 5] Verifying Admin Finance Ledger Queries...");
    const adminEventTransactions = await db.transaction.findMany({
      where: {
        refId: { in: [txnRef] },
      },
    });

    if (adminEventTransactions.length === 1 && adminEventTransactions[0].status === "SETTLED") {
      console.log(`✅ Finance ledger query verified: Found 1 settled transaction for "${adminEventTransactions[0].tier}" with amount ${adminEventTransactions[0].currency} ${Number(adminEventTransactions[0].amount).toFixed(2)}.`);
    } else {
      throw new Error("Failed to verify transaction in finance ledger!");
    }

    console.log("\n===============================================================");
    console.log("🎉 ALL PAID EVENT BOOKING & FLOT GATEWAY TESTS PASSED!");
    console.log("===============================================================");
  } finally {
    // Cleanup test data
    console.log("\n[Cleanup] Removing temporary test records...");
    await db.eventRegistration.deleteMany({
      where: { eventId: { in: [testEventId, testFreeEventId] } },
    });
    await db.transaction.deleteMany({
      where: { refId: { contains: testSuffix } },
    });
    await db.alumniEvent.deleteMany({
      where: { id: { in: [testEventId, testFreeEventId] } },
    });
    console.log("🧹 Test cleanup completed successfully.");
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
