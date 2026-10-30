import assert from "node:assert/strict";
import {
  generateAlumniWelcomeEmailHtml,
  generateAdminRegistrationAlertHtml,
  generateDegreeVerificationEmailHtml,
  generateJobApplicationEmployeeEmailHtml,
  generateJobApplicationEmployerEmailHtml,
  generateJobStatusUpdateEmployeeEmailHtml,
  generateEventRsvpConfirmationEmailHtml,
  generateEventAttendeeUpdateEmailHtml,
  generateBusinessSubmissionAdminEmailHtml,
  generateBusinessSubmissionOwnerEmailHtml,
  generateBusinessApprovalEmailHtml,
  generateDonationAdminEmailHtml,
  generateDonationReceiptEmailHtml,
  generatePhysicalCardOrderEmailHtml,
  ADMIN_NOTIFICATION_EMAIL,
} from "../lib/email.ts";
import { sendBroadcastSchema } from "../lib/validation/broadcast.ts";

async function runTests() {
  console.log("\n========================================================");
  console.log("🧪 IPAM Notification & Email Trigger Test Suite");
  console.log("========================================================\n");

  // Test 1: Admin Notification Email constant
  console.log("▶ [Test 1] Validating Admin Notification Destination Email...");
  assert.equal(ADMIN_NOTIFICATION_EMAIL, "growpos.official@gmail.com");
  console.log(`✔ Admin notification email verified: ${ADMIN_NOTIFICATION_EMAIL}\n`);

  // Test 2: Alumni Registration Emails
  console.log("▶ [Test 2] Testing Alumni Registration Welcome & Admin Alert Emails...");
  const welcomeHtml = generateAlumniWelcomeEmailHtml({
    name: "John Doe",
    email: "john@example.com",
    studentId: "IPAM-2024-001",
    degree: "BSc Business Administration",
    gradYear: 2024,
  });
  assert(welcomeHtml.includes("John Doe"));
  assert(welcomeHtml.includes("IPAM-2024-001"));
  assert(welcomeHtml.includes("REGISTRATION RECEIVED"));
  console.log("  ✔ Alumnus welcome registration email rendered cleanly.");

  const adminAlertHtml = generateAdminRegistrationAlertHtml({
    name: "John Doe",
    email: "john@example.com",
    studentId: "IPAM-2024-001",
    degree: "BSc Business Administration",
    gradYear: 2024,
  });
  assert(adminAlertHtml.includes("John Doe"));
  assert(adminAlertHtml.includes("REGISTRATION REVIEW"));
  assert(adminAlertHtml.includes("Admin Directory"));
  console.log("  ✔ Admin registration alert email rendered cleanly.\n");

  // Test 3: Job Application Emails (Employer + Employee)
  console.log("▶ [Test 3] Testing Job Application Emails (Employer + Employee)...");
  const jobEmployeeHtml = generateJobApplicationEmployeeEmailHtml({
    candidateName: "Jane Smith",
    jobTitle: "Senior Public Financial Analyst",
    company: "Ministry of Finance",
    applicationRef: "IPAM-REF-789012",
  });
  assert(jobEmployeeHtml.includes("Jane Smith"));
  assert(jobEmployeeHtml.includes("Senior Public Financial Analyst"));
  assert(jobEmployeeHtml.includes("IPAM-REF-789012"));
  assert(jobEmployeeHtml.includes("APPLICATION CONFIRMED"));
  console.log("  ✔ Employee job application confirmation email rendered cleanly.");

  const jobEmployerHtml = generateJobApplicationEmployerEmailHtml({
    employerName: "HR Director",
    candidateName: "Jane Smith",
    candidateEmail: "jane@example.com",
    candidatePhone: "+23276123456",
    degree: "MSc Accounting & Finance",
    gradYear: 2022,
    experienceYears: 4,
    matchScore: 95,
    jobTitle: "Senior Public Financial Analyst",
    company: "Ministry of Finance",
    coverNote: "Excited to bring my treasury management expertise to the team.",
    applicationRef: "IPAM-REF-789012",
  });
  assert(jobEmployerHtml.includes("Jane Smith"));
  assert(jobEmployerHtml.includes("NEW APPLICANT"));
  assert(jobEmployerHtml.includes("95%"));
  assert(jobEmployerHtml.includes("MSc Accounting & Finance"));
  console.log("  ✔ Employer candidate application alert email rendered cleanly.\n");

  // Test 4: Job Status Update Emails
  console.log("▶ [Test 4] Testing Job Status Pipeline Emails...");
  const shortlistedHtml = generateJobStatusUpdateEmployeeEmailHtml({
    candidateName: "Jane Smith",
    jobTitle: "Senior Public Financial Analyst",
    company: "Ministry of Finance",
    status: "SHORTLISTED",
    remarks: "Top 5 candidate selected for initial panel interview.",
  });
  assert(shortlistedHtml.includes("SHORTLISTED"));
  assert(shortlistedHtml.includes("Top 5 candidate"));

  const interviewHtml = generateJobStatusUpdateEmployeeEmailHtml({
    candidateName: "Jane Smith",
    jobTitle: "Senior Public Financial Analyst",
    company: "Ministry of Finance",
    status: "INTERVIEW_SCHEDULED",
    interviewDate: new Date("2026-11-15T10:00:00Z"),
    remarks: "Video conference via Teams.",
  });
  assert(interviewHtml.includes("INTERVIEW SCHEDULED"));
  assert(interviewHtml.includes("Interview Schedule"));

  const selectedHtml = generateJobStatusUpdateEmployeeEmailHtml({
    candidateName: "Jane Smith",
    jobTitle: "Senior Public Financial Analyst",
    company: "Ministry of Finance",
    status: "SELECTED",
    offerSalary: "$45,000 / annum",
    remarks: "Welcome to the Ministry!",
  });
  assert(selectedHtml.includes("SELECTED"));
  assert(selectedHtml.includes("$45,000 / annum"));
  console.log("  ✔ Job status updates (Shortlisted, Interview, Selected) rendered cleanly.\n");

  // Test 5: Event Notifications (Only for Registered Alumni) & RSVP
  console.log("▶ [Test 5] Testing Event RSVP & Registered Attendee Emails...");
  const eventRsvpHtml = generateEventRsvpConfirmationEmailHtml({
    attendeeName: "David Cole",
    eventTitle: "Annual Global Alumni Gala 2026",
    eventDate: new Date("2026-12-10T18:00:00Z"),
    bookingReference: "BK-EVT-GALA-001",
    location: "Bintumani Conference Centre",
    ticketCount: 2,
    totalAmount: 50,
    currency: "USD",
    paymentStatus: "PAID",
  });
  assert(eventRsvpHtml.includes("Annual Global Alumni Gala 2026"));
  assert(eventRsvpHtml.includes("BK-EVT-GALA-001"));
  assert(eventRsvpHtml.includes("EVENT CONFIRMATION"));
  console.log("  ✔ Event RSVP confirmation email rendered cleanly.");

  const eventAttendeeHtml = generateEventAttendeeUpdateEmailHtml({
    recipientName: "David Cole",
    eventTitle: "Annual Global Alumni Gala 2026",
    eventDate: new Date("2026-12-10T18:00:00Z"),
    location: "Bintumani Conference Centre",
    subject: "Keynote Speaker Announcement: Dr. Sarah Sesay",
    message: "We are thrilled to reveal our 2026 keynote speaker. Please arrive by 5:30 PM for the reception.",
  });
  assert(eventAttendeeHtml.includes("Keynote Speaker Announcement"));
  assert(eventAttendeeHtml.includes("EVENT UPDATE"));
  console.log("  ✔ Event update for registered attendees rendered cleanly.\n");

  // Test 6: Business Submission & Approval
  console.log("▶ [Test 6] Testing Business Listing & Admin Approval Emails...");
  const bizAdminHtml = generateBusinessSubmissionAdminEmailHtml({
    businessName: "Salone Logistics Express",
    industry: "Transportation & Supply Chain",
    founders: "Mariama Kargbo & Team",
    contactEmail: "mariama@salonelogistics.sl",
    contactPhone: "+23278999000",
    website: "https://salonelogistics.sl",
    location: "Freetown Port Zone",
    description: "Premier freight forwarding and cold chain logistics in West Africa.",
  });
  assert(bizAdminHtml.includes("Salone Logistics Express"));
  assert(bizAdminHtml.includes("BUSINESS LISTING REVIEW"));
  assert(bizAdminHtml.includes("Transportation & Supply Chain"));

  const bizApprovalHtml = generateBusinessApprovalEmailHtml({
    ownerName: "Mariama Kargbo",
    businessName: "Salone Logistics Express",
    industry: "Transportation & Supply Chain",
  });
  assert(bizApprovalHtml.includes("Mariama Kargbo"));
  assert(bizApprovalHtml.includes("LISTING APPROVED"));
  assert(bizApprovalHtml.includes("Directory"));
  console.log("  ✔ Business submission alert and approval notification rendered cleanly.\n");

  // Test 7: Giving - ALL details of donor to admin email
  console.log("▶ [Test 7] Testing Giving - ALL Details of Donor to Admin Email...");
  const donationAdminHtml = generateDonationAdminEmailHtml({
    donorName: "Ambassador Sahr Foday",
    donorEmail: "sahr.foday@diplomacy.gov.sl",
    donorPhone: "+23277112233",
    donorGradYear: 1998,
    donorDegree: "BSc Public Administration & Governance",
    amount: 5000,
    currency: "USD",
    fund: "Campus Digital Library & Innovation Hub",
    frequency: "ONE_TIME",
    anonymous: false,
    paymentRef: "DON-179328900-SF98",
    message: "In honor of Prof. Conteh and the class of 1998. May IPAM continue to lead.",
    donatedAt: new Date("2026-10-30T14:30:00Z"),
  });

  // Verify EVERY single donor field is present in the admin email
  assert(donationAdminHtml.includes("Ambassador Sahr Foday"), "Donor name must be in admin email");
  assert(donationAdminHtml.includes("sahr.foday@diplomacy.gov.sl"), "Donor email must be in admin email");
  assert(donationAdminHtml.includes("+23277112233"), "Donor phone must be in admin email");
  assert(donationAdminHtml.includes("1998"), "Donor grad year must be in admin email");
  assert(donationAdminHtml.includes("BSc Public Administration & Governance"), "Donor degree must be in admin email");
  assert(donationAdminHtml.includes("5000.00"), "Donor amount must be in admin email");
  assert(donationAdminHtml.includes("USD"), "Currency must be in admin email");
  assert(donationAdminHtml.includes("Campus Digital Library & Innovation Hub"), "Fund must be in admin email");
  assert(donationAdminHtml.includes("ONE_TIME"), "Frequency must be in admin email");
  assert(donationAdminHtml.includes("Publicly Acknowledged"), "Anonymity must be in admin email");
  assert(donationAdminHtml.includes("DON-179328900-SF98"), "Payment Ref must be in admin email");
  assert(donationAdminHtml.includes("In honor of Prof. Conteh"), "Donor message must be in admin email");
  console.log("  ✔ ALL 12 Donor details verified in the Admin email payload.");

  const donationReceiptHtml = generateDonationReceiptEmailHtml({
    donorName: "Ambassador Sahr Foday",
    amount: 5000,
    currency: "USD",
    fund: "Campus Digital Library & Innovation Hub",
    paymentRef: "DON-179328900-SF98",
  });
  assert(donationReceiptHtml.includes("Ambassador Sahr Foday"));
  assert(donationReceiptHtml.includes("OFFICIAL RECEIPT"));
  console.log("  ✔ Official donor tax receipt rendered cleanly.\n");

  // Test 8: Custom Email + SMS Admin Broadcast Validation
  console.log("▶ [Test 8] Testing Custom Email + SMS Broadcast Schema Validation...");
  const customBroadcastPayload = {
    type: "MESSAGE",
    title: "Urgent Campus Infrastructure Notice",
    message: "Tower Hill campus facilities will have scheduled maintenance this Saturday.",
    audienceLabel: "All Registered Alumni",
    recipientsCount: 450,
    channels: ["EMAIL", "SMS"],
    priority: "URGENT",
  };
  const parsed = sendBroadcastSchema.safeParse(customBroadcastPayload);
  assert(parsed.success, "Custom broadcast payload must pass schema validation");
  assert.deepEqual(parsed.data.channels, ["EMAIL", "SMS"]);
  console.log("  ✔ Custom Email + SMS omnichannel payload validated successfully.\n");

  // Test 9: Physical ID Card Order Email
  console.log("▶ [Test 9] Testing Smart Physical ID Card Order Email...");
  const cardOrderHtml = generatePhysicalCardOrderEmailHtml({
    recipientName: "Alimamy Turay",
    orderNumber: "PVC-2026-8871",
    cardTier: "Executive Gold Pass",
    amount: "250.00",
    currency: "SLE",
    deliveryAddress: "14 Pademba Road, Freetown",
    paymentMethod: "STRIPE",
    paymentStatus: "PAID",
  });
  assert(cardOrderHtml.includes("PVC-2026-8871"));
  assert(cardOrderHtml.includes("Executive Gold Pass"));
  assert(cardOrderHtml.includes("SMART CARD ORDER"));
  console.log("  ✔ Physical card order confirmation email rendered cleanly.\n");

  console.log("========================================================");
  console.log("🎉 ALL NOTIFICATION & EMAIL TRIGGER TESTS PASSED!");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
