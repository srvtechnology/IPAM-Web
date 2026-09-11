import { PrismaClient, PermissionModule } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const DEMO_PASSWORD = "Password123!";

const ALL_MODULES: PermissionModule[] = [
  "DIRECTORY",
  "ID_CARDS",
  "BROADCAST",
  "JOBS",
  "COMMERCIAL",
  "FINANCE",
  "SIS_SYNC",
  "AUDIT_TRAILS",
  "RBAC_GOVERNANCE",
  "SYSTEM_SETTINGS",
];

async function main() {
  if (process.env.SEED_DEMO_USERS === "false") {
    console.log("SEED_DEMO_USERS=false — skipping demo data seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---------------- Admin RBAC roles ----------------
  const superAdminRole = await db.adminRoleDefinition.upsert({
    where: { slug: "super-administrator" },
    update: {},
    create: {
      name: "Super Administrator",
      slug: "super-administrator",
      description: "Full access to every module. Reserved for executive council / IT governance.",
      isSystemDefault: true,
      badgeColor: "ERROR",
      priorityLevel: 1,
      permissions: {
        create: ALL_MODULES.map((module) => ({
          module,
          canRead: true,
          canWrite: true,
          canApprove: true,
          canExport: true,
          canDelete: true,
        })),
      },
    },
  });

  const registrarRole = await db.adminRoleDefinition.upsert({
    where: { slug: "registrar" },
    update: {},
    create: {
      name: "Registrar",
      slug: "registrar",
      description: "Manages alumni verification and ID card issuance.",
      isSystemDefault: false,
      badgeColor: "PRIMARY",
      priorityLevel: 2,
      permissions: {
        create: [
          { module: "DIRECTORY", canRead: true, canWrite: true, canApprove: true, canExport: true, canDelete: false },
          { module: "ID_CARDS", canRead: true, canWrite: true, canApprove: true, canExport: true, canDelete: false },
        ],
      },
    },
  });

  const financeOfficerRole = await db.adminRoleDefinition.upsert({
    where: { slug: "finance-officer" },
    update: {},
    create: {
      name: "Finance Officer",
      slug: "finance-officer",
      description: "Manages sponsor banners, invoicing, and financial reconciliation.",
      isSystemDefault: false,
      badgeColor: "SECONDARY",
      priorityLevel: 3,
      permissions: {
        create: [
          { module: "FINANCE", canRead: true, canWrite: true, canApprove: true, canExport: true, canDelete: false },
          { module: "COMMERCIAL", canRead: true, canWrite: true, canApprove: false, canExport: true, canDelete: false },
        ],
      },
    },
  });

  // ---------------- Admin user ----------------
  const adminUser = await db.adminUser.upsert({
    where: { email: "demo.admin@ipam.edu" },
    update: {},
    create: {
      name: "Dr. Samuel Koroma",
      email: "demo.admin@ipam.edu",
      passwordHash,
      department: "Office of the Registrar",
      title: "Chief Registrar",
      roleId: superAdminRole.id,
      status: "ACTIVE",
      twoFactorEnforced: false,
      assignedBy: "System Seed",
    },
  });

  await db.adminUser.upsert({
    where: { email: "demo.registrar@ipam.edu" },
    update: {},
    create: {
      name: "Mariatu Sesay",
      email: "demo.registrar@ipam.edu",
      passwordHash,
      department: "Office of the Registrar",
      title: "Alumni Registrar",
      roleId: registrarRole.id,
      status: "ACTIVE",
      twoFactorEnforced: false,
      assignedBy: "System Seed",
    },
  });

  // ---------------- Leadership ----------------
  const PRES_IMAGE =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCsuL2S9s6sSIlISq3h7KL6-B0R7bx6LoT7A1zMV7Gefwcqg9gKchBTyLVaXC-eGBO4VYMSy6ylDo2C0qcKvfaxlLsL2QPdz_OgFLT2roVRd-zmsEuNQg1wjCn8fTH3uqamfM3-OhOVc7M8lyaOcsoTKVJ-cQeb_eSHGcJo0PXPi767uc89Oq4N5Enn3bYYil8d1LLvu0mYz7xJ2BqLHf-WUZ3L1j7PB0SsEewid-_8dSNE9lZob3y2";

  await db.leadershipMember.upsert({
    where: { id: "seed-leader-1" },
    update: {},
    create: {
      id: "seed-leader-1",
      name: "Prof. Aminata Bangura",
      role: "President, IPAM Alumni Association",
      classYear: "1998",
      image: PRES_IMAGE,
      bio: "Two decades of public administration leadership across West Africa.",
      quote: "Our alumni network is the backbone of IPAM's legacy.",
      email: "aminata.bangura@alumni.ipam.edu",
      initiatives: { create: [{ title: "Alumni Mentorship Program" }, { title: "Annual Homecoming Gala" }] },
    },
  });

  // ---------------- Alumni users + members ----------------
  const alumniSeedData = [
    {
      email: "demo.alumni@ipam.edu",
      studentId: "IPAM-2015-0042",
      name: "Alex Sesay",
      classYear: 2015,
      degree: "BSc Public Administration",
      major: "Public Policy",
      currentRole: "Program Manager",
      company: "UNDP Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Development",
      isMentor: true,
      bio: "Passionate about public sector reform and youth empowerment.",
      skills: ["Policy Analysis", "Project Management", "Public Speaking"],
      membershipTier: "SILVER_LIFETIME" as const,
      // Same photo the legacy AI-Studio prototype used for this exact demo persona.
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
    },
    {
      email: "fatmata.kamara@alumni.ipam.edu",
      studentId: "IPAM-2012-0117",
      name: "Dr. Fatmata Kamara",
      classYear: 2012,
      degree: "MSc Development Studies",
      major: "Economics",
      currentRole: "Senior Economist",
      company: "Bank of Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Finance & Banking",
      isMentor: true,
      bio: "Macroeconomic policy specialist and IPAM guest lecturer.",
      skills: ["Macroeconomics", "Data Analysis", "Central Banking"],
      membershipTier: "GOLD_PATRON" as const,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80",
    },
    {
      email: "david.koroma@alumni.ipam.edu",
      studentId: "IPAM-2018-0231",
      name: "David Koroma",
      classYear: 2018,
      degree: "BSc Business Administration",
      major: "Finance",
      currentRole: "Software Engineer",
      company: "Orange Sierra Leone",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Engineering",
      isMentor: false,
      bio: "Building fintech products for the Sierra Leonean market.",
      skills: ["JavaScript", "Product Management"],
      membershipTier: "STANDARD" as const,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    {
      email: "mariama.jalloh@alumni.ipam.edu",
      studentId: "IPAM-2010-0009",
      name: "Mariama Jalloh",
      classYear: 2010,
      degree: "MPA Public Administration",
      major: "Governance",
      currentRole: "Director of Operations",
      company: "Ministry of Finance",
      location: "Freetown",
      country: "Sierra Leone",
      industry: "Operations",
      isMentor: true,
      bio: "Championing transparency in public financial management.",
      skills: ["Governance", "Auditing", "Leadership"],
      membershipTier: "SILVER_LIFETIME" as const,
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80",
    },
  ];

  const alumniMembers: { id: string; userId: string }[] = [];
  for (const a of alumniSeedData) {
    const user = await db.alumniUser.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash,
        studentId: a.studentId,
        isVerifiedAlumni: true,
        membershipTier: a.membershipTier,
        membershipValidUntil: new Date("2027-12-31"),
        profile: {
          create: {
            name: a.name,
            avatar: a.avatar,
            classYear: a.classYear,
            degree: a.degree,
            major: a.major,
            currentRole: a.currentRole,
            company: a.company,
            location: a.location,
            country: a.country,
            industry: a.industry,
            isMentor: a.isMentor,
            bio: a.bio,
            skills: { create: a.skills.map((skill) => ({ skill })) },
          },
        },
      },
      include: { profile: true },
    });
    if (user.profile) alumniMembers.push({ id: user.profile.id, userId: user.id });

    // Mirror into the admin verification directory
    await db.alumniRecord.upsert({
      where: { regNo: a.studentId },
      update: {},
      create: {
        alumniUserId: user.id,
        name: a.name,
        email: a.email,
        avatarUrl: a.avatar,
        regNo: a.studentId,
        degree: a.degree,
        faculty: a.major,
        gradYear: a.classYear,
        authStatus: "OTP_VERIFIED",
        role: "ALUMNI_MEMBER",
        status: "APPROVED",
        digitalPassIssued: true,
      },
    });
  }

  // ---------------- Jobs ----------------
  await db.jobOpening.upsert({
    where: { id: "seed-job-1" },
    update: {},
    create: {
      id: "seed-job-1",
      title: "Senior Backend Engineer",
      company: "Orange Sierra Leone",
      location: "Freetown, Sierra Leone",
      type: "FULL_TIME",
      workplaceType: "HYBRID",
      salary: "Competitive, negotiable",
      category: "ENGINEERING",
      description: "Lead backend development for mobile money platforms.",
      requirements: ["5+ years backend experience", "Node.js or Java"],
      benefits: ["Health insurance", "Annual bonus"],
      postedByAlumniId: alumniMembers[2]?.id,
      deadline: new Date("2026-12-01"),
    },
  });

  await db.jobOpening.upsert({
    where: { id: "seed-job-2" },
    update: {},
    create: {
      id: "seed-job-2",
      title: "Policy Analyst",
      company: "Ministry of Finance",
      location: "Freetown, Sierra Leone",
      type: "FULL_TIME",
      workplaceType: "ON_SITE",
      salary: "Public sector scale",
      category: "LEGAL_PUBLIC_POLICY",
      description: "Support fiscal policy research and drafting.",
      requirements: ["MPA or equivalent", "Strong writing skills"],
      postedByAlumniId: alumniMembers[3]?.id,
      deadline: new Date("2026-11-15"),
    },
  });

  // ---------------- Events ----------------
  await db.alumniEvent.upsert({
    where: { id: "seed-event-1" },
    update: {},
    create: {
      id: "seed-event-1",
      title: "IPAM Alumni Annual Gala 2026",
      date: new Date("2026-12-12T18:00:00Z"),
      displayDate: "December 12, 2026",
      time: "6:00 PM",
      location: "Freetown Grand Hall",
      isVirtual: false,
      category: "GALA",
      description: "An evening celebrating IPAM's alumni achievements.",
      agenda: [{ time: "6:00 PM", activity: "Reception" }, { time: "7:30 PM", activity: "Awards Ceremony" }],
      speakers: [{ name: "Prof. Aminata Bangura", title: "Association President", image: PRES_IMAGE }],
      ticketPrice: 50,
      currency: "USD",
      capacity: 300,
      registeredCount: 0,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-2" },
    update: {},
    create: {
      id: "seed-event-2",
      title: "Career Growth Webinar",
      date: new Date("2026-10-05T15:00:00Z"),
      displayDate: "October 5, 2026",
      time: "3:00 PM",
      location: "Online",
      isVirtual: true,
      virtualLink: "https://meet.ipam.edu/career-growth",
      category: "WEBINAR",
      description: "Panel discussion on navigating career transitions.",
      agenda: [{ time: "3:00 PM", activity: "Panel Discussion" }],
      speakers: [{ name: "Dr. Fatmata Kamara", title: "Senior Economist", image: alumniSeedData[1].avatar }],
      ticketPrice: 0,
      currency: "USD",
      capacity: 500,
      registeredCount: 0,
    },
  });

  // ---------------- Businesses ----------------
  await db.alumniBusiness.upsert({
    where: { id: "seed-business-1" },
    update: {},
    create: {
      id: "seed-business-1",
      name: "SaloneTech Solutions",
      founders: "David Koroma",
      classYear: "2018",
      category: "SaaS & Software",
      industry: "Technology",
      tagline: "Software built for Sierra Leone's future.",
      description: "A software consultancy building digital tools for local businesses.",
      website: "https://salonetech.example.com",
      // Same style of software-company office photo the legacy prototype used
      // for its SaaS/software category business (Nexus Tech Solutions).
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDHF48nWTEz7bPDMDEBe2lGoslnq28w7woy6xDiHqlP72TjTT6XvumtqD0b7z_cos7vG_S1aFaH3KGHjVSn0trPEfTW56GRE3EWPwt0XNXMfZ3cViim4nKTI4oTsLR8cvMOUi55KVS1etzuhlIm82HxhIte0rFY2HqUkxP2SPov66uidqvh-a4h8wURkZd27H-WpbiCOHaeJgptGDcjriLIRmXw1vR_l4bsvbPKCvdP63L99w6j5PAT",
      featured: true,
      location: "Freetown, Sierra Leone",
      contactEmail: "hello@salonetech.example.com",
    },
  });

  // ---------------- Sample transactions / SIS log for populated admin views ----------------
  await db.sisSyncLog.upsert({
    where: { id: "seed-sync-1" },
    update: {},
    create: {
      id: "seed-sync-1",
      node: "SIS-NODE-01",
      operation: "Full alumni roster sync",
      recordsSynced: alumniSeedData.length,
      status: "SUCCESS",
      latencyMs: 842,
    },
  });

  console.log("\n✅ Seed complete.\n");
  console.log("Demo credentials (password for all seeded accounts below):", DEMO_PASSWORD);
  console.log("  Alumni login  → demo.alumni@ipam.edu");
  console.log("  Admin login   → demo.admin@ipam.edu (Super Administrator)");
  console.log("  Admin login   → demo.registrar@ipam.edu (Registrar — directory + id_cards only)");
  console.log(`\nSeeded ${alumniSeedData.length} alumni, 3 admin roles, 2 admin users, 2 jobs, 2 events, 1 business.\n`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
