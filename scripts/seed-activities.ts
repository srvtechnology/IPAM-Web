/**
 * Seed Script: Populate dummy Current & Previous Alumni Activities with multi-photo galleries
 *
 * Usage:
 *   npx tsx scripts/seed-activities.ts
 */

import { db } from "../lib/db";

const DUMMY_ACTIVITIES = [
  {
    id: "act-seed-current-01",
    title: "IPAM Digital Transformation & AI Innovation Summit 2026",
    description:
      "Over 450 verified IPAM alumni, FinTech founders, and university faculty gathered at the Tower Hill Campus and virtually across 12 countries for a two-day symposium on AI readiness, public-sector digital governance, and enterprise software engineering.\n\nHighlights included live startup pitch showcases funded by the SaloneTech Alumni Syndicate, hands-on cloud engineering clinics for final-year students, and strategic roundtables with Sierra Leone financial regulators.",
    status: "CURRENT" as const,
    displayDate: "November 2026",
    location: "IPAM Tower Hill Auditorium, Freetown & Hybrid Stream",
    category: "Technology & Innovation",
    featured: true,
    sortOrder: 1,
    photos: [
      "/images/alumni_tech_summit.jpg",
      "/images/ipam_university_campus_1788350001937.jpg",
      "/images/alumni_networking_mixer.jpg",
      "/images/sponsor_telecom_banner.jpg",
    ],
  },
  {
    id: "act-seed-current-02",
    title: "Campus Computer Lab Modernization & Scholarship Drive",
    description:
      "Through the generosity of Class of '10–'24 contributors via the IPAM Alumni Endowment Fund, phase two of the Smart Computing & Research Lab Upgrade is now actively underway.\n\nThe initiative has delivered 85 high-performance workstations, gigabit fiber redundancy, and uninterrupted solar backup power alongside need-based tuition stipends for 120 undergraduate scholars.",
    status: "CURRENT" as const,
    displayDate: "October – December 2026",
    location: "IPAM Main Campus, Freetown",
    category: "Campus Initiative",
    featured: true,
    sortOrder: 2,
    photos: [
      "/images/ipam_university_campus_1788350001937.jpg",
      "/images/alumni_tech_summit.jpg",
      "/images/sponsor_banking_banner.jpg",
    ],
  },
  {
    id: "act-seed-current-03",
    title: "Executive Career Mentorship & Final-Year Placement Cohort",
    description:
      "Ongoing 12-week mentorship pairing senior IPAM alumni directors, chartered accountants, and policy advisors with 200 graduating scholars.\n\nWeekly mock interviews, CV clinics, and direct employer referral sessions are actively connecting emerging graduates with internships and full-time roles across commercial banking, telecoms, and NGOs.",
    status: "CURRENT" as const,
    displayDate: "Q4 2026 Cohort",
    location: "Global Virtual & Regional Chapters",
    category: "Career & Mentorship",
    featured: false,
    sortOrder: 3,
    photos: [
      "/images/alumni_networking_mixer.jpg",
      "/images/sponsor_banking_banner.jpg",
      "/images/ipam_university_campus_1788350001937.jpg",
    ],
  },
  {
    id: "act-seed-previous-01",
    title: "Annual IPAM Distinguished Alumni Gala & Honours Banquet 2025",
    description:
      "An unforgettable black-tie evening celebrating 35+ years of IPAM leadership across West Africa and the diaspora.\n\nFifteen distinguished alumni trailblazers were inducted into the Hall of Distinction for outstanding service in public financial management, corporate governance, and humanitarian relief. The gala also raised milestone pledges for the Student Emergency Relief Fund.",
    status: "PREVIOUS" as const,
    displayDate: "December 14, 2025",
    location: "Radisson Blu Mammy Yoko Hotel, Freetown",
    category: "Gala & Awards",
    featured: true,
    sortOrder: 4,
    photos: [
      "/images/alumni_gala_event_1788454750646.jpg",
      "/images/alumni_networking_mixer.jpg",
      "/images/ipam_university_campus_1788350001937.jpg",
      "/images/alumni_tech_summit.jpg",
    ],
  },
  {
    id: "act-seed-previous-02",
    title: "UK & European Diaspora Chapter Executive Homecoming Mixer",
    description:
      "More than 180 IPAM alumni residing in London, Manchester, Brussels, and Berlin convened for the annual Diaspora Homecoming & Trade Bridge Forum.\n\nAttendees explored cross-border SME investment partnerships, dual-currency diaspora remittances for university infrastructure, and mentoring fellowships for visiting Sierra Leonean scholars.",
    status: "PREVIOUS" as const,
    displayDate: "August 22, 2025",
    location: "Canary Wharf Executive Lounge, London",
    category: "Regional Meetup",
    featured: false,
    sortOrder: 5,
    photos: [
      "/images/alumni_networking_mixer.jpg",
      "/images/alumni_gala_event_1788454750646.jpg",
      "/images/sponsor_banking_banner.jpg",
    ],
  },
  {
    id: "act-seed-previous-03",
    title: "Public Sector Governance & SME Financing Colloquium 2025",
    description:
      "Co-hosted with Sierra Leone Commercial Bank and Africell Business, this full-day colloquium equipped 300+ alumni entrepreneurs and finance officers with practical frameworks for credit readiness, audit compliance, and digital treasury management.",
    status: "PREVIOUS" as const,
    displayDate: "May 18, 2025",
    location: "Freetown International Conference Center",
    category: "Business & Policy",
    featured: false,
    sortOrder: 6,
    photos: [
      "/images/sponsor_banking_banner.jpg",
      "/images/sponsor_telecom_banner.jpg",
      "/images/alumni_tech_summit.jpg",
      "/images/ipam_university_campus_1788350001937.jpg",
    ],
  },
];

async function main() {
  console.log("===============================================================");
  console.log("📸 Seeding IPAM Alumni Activities & Photo Gallery...");
  console.log("===============================================================\n");

  for (const act of DUMMY_ACTIVITIES) {
    await db.alumniActivity.upsert({
      where: { id: act.id },
      update: {
        title: act.title,
        description: act.description,
        status: act.status,
        displayDate: act.displayDate,
        location: act.location,
        category: act.category,
        photos: act.photos,
        featured: act.featured,
        sortOrder: act.sortOrder,
      },
      create: act,
    });
    console.log(`✅ Seeded [${act.status}] "${act.title}" (${act.photos.length} photos)`);
  }

  const total = await db.alumniActivity.count();
  console.log(`\n🎉 Done! Total activities in database: ${total}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Failed to seed activities:", err);
    process.exit(1);
  });
