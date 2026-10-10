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

  await db.leadershipMember.upsert({
    where: { id: "seed-leader-2" },
    update: {},
    create: {
      id: "seed-leader-2",
      name: "Marcus Thorne",
      role: "Secretary General",
      classYear: "2005",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuB_WKPQ7aK_zObvddw9LpJ_IVp5ME68iSknd7QdTkh0ytTIb54x6tQix3yNJqV2U9_3is-6mMnvycN3JijjFiFLn3OezWI5ZDiWsFEXwAWzS4Wu2IH5E23ALjw2QTtNvaOXYgUhKVn3YCVXAl0-Ra5jKPIwqfpGlqcCecschb7ql-fYW6f52EGgDlOBEAV9Q2EO-Rv7hibjhzU_z5tmhNLInzHWywTRzt2RBoOmhDLsXnz_L4V-yOWp",
      bio: "Senior governance consultant and managing partner. With over 18 years of corporate compliance and association governance, he leads organizational strategy and member operations across all regions.",
      quote: "Integrity and seamless operational transparency form the bedrock of an alumni network our members can be truly proud of.",
      email: "secretary@ipamalumni.org",
      initiatives: {
        create: [
          { title: "Digital bylaws modernization and transparent voting protocols" },
          { title: "University registrar single sign-on integration" },
        ],
      },
    },
  });

  await db.leadershipMember.upsert({
    where: { id: "seed-leader-3" },
    update: {},
    create: {
      id: "seed-leader-3",
      name: "Elena Rodriguez",
      role: "Treasurer",
      classYear: "2012",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCS-NRqSAAcl0_OJslI41htFs9MZZD4KwiPZO2G5RGs8WReNqmyJoiG5Nib3PiWjDZSTiEnlGGq0vgY5tau-fBMyHi7JY6_hUliWrISs_jmMdaBR0b62sBxckmyApak3LKaK3VkjgQSL5dA66cObulhOzHXijuen4QyIq6PBDbRpiP7vsLR1O10a3rESoaXnTYvjeOOIOBH2oWRUzqw7CjFwqRkOS9mdAPaMtUjIWd16R5-rwZv3mZF",
      bio: "CFA Charterholder and Senior Portfolio Manager. She oversees the endowment governance, fiscal accounting, and multi-currency scholarship distributions for the IPAM Alumni community.",
      quote: "Every single dollar donated is directly optimized to lower student barriers and provide need-based educational lifelines.",
      email: "treasury@ipamalumni.org",
      initiatives: {
        create: [
          { title: "Clean audit compliance across all multi-currency regional funds" },
          { title: "Direct disbursement of student hardship & merit grants" },
        ],
      },
    },
  });

  await db.leadershipMember.upsert({
    where: { id: "seed-leader-4" },
    update: {},
    create: {
      id: "seed-leader-4",
      name: "David Okoro",
      role: "VP Outreach",
      classYear: "2010",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBoDJ3459AtBhITEgI-DmIWmP2qjFktqreunpYDWbmXMFLHI48d52px0MVMdKqUwGhlg9YTo6UucW6Hjbq2YyxDThGUXFYe6EfjtTclQLVcEAMSG9jSiGE1BCwswn1p7V12MTVHYqasZW_TcL7zQ9TasJ3EhKRr7J3M93DXQk2JixzycfSlIEu8-qVx6BVQFmkic5u3pB5dy8paULxslw41hRY41cG_VypXLHe1JvkU-tVq2YfCoWmR",
      bio: "Telecommunications executive and founder of a regional tech hub. He directs alumni relations across the UK, North America, Continental Europe, and Sub-Saharan Africa chapters.",
      quote: "No matter where your degree takes you across the world, you will always find a supportive IPAM family waiting to welcome you.",
      email: "outreach@ipamalumni.org",
      initiatives: {
        create: [
          { title: "12 new regional alumni chapters established in 2024" },
          { title: "Annual Global Homecoming & Cross-Continent Business Summits" },
        ],
      },
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
        status: "APPROVED",
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
    update: {
      isPaid: true,
      ticketPrice: 50,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 4,
      bannerImage: "/images/alumni_gala_event_1788454750646.jpg",
      bannerImages: [
        "/images/alumni_gala_event_1788454750646.jpg",
        "/images/ipam_university_campus_1788350001937.jpg",
      ],
      featured: true,
    },
    create: {
      id: "seed-event-1",
      title: "IPAM Alumni Annual Gala 2026",
      date: new Date("2026-12-12T18:00:00Z"),
      displayDate: "December 12, 2026",
      time: "6:00 PM",
      location: "Freetown Grand Hall",
      venueDetails: "Main Ballroom, 2nd Floor, Waterfront District",
      isVirtual: false,
      category: "GALA",
      description: "An evening celebrating IPAM's alumni achievements with keynote addresses, awards banquet, and musical gala.",
      bannerImage: "/images/alumni_gala_event_1788454750646.jpg",
      bannerImages: [
        "/images/alumni_gala_event_1788454750646.jpg",
        "/images/ipam_university_campus_1788350001937.jpg",
      ],
      agenda: [
        { time: "6:00 PM", activity: "Red Carpet & Welcome Reception" },
        { time: "7:15 PM", activity: "President's Address & Keynote" },
        { time: "8:00 PM", activity: "Distinguished Alumni Awards Ceremony" },
        { time: "9:30 PM", activity: "Banquet Dinner & Networking Gala" },
      ],
      speakers: [{ name: "Prof. Aminata Bangura", title: "Association President", image: PRES_IMAGE }],
      isPaid: true,
      ticketPrice: 50,
      currency: "USD",
      capacity: 300,
      registeredCount: 4,
      status: "PUBLISHED",
      featured: true,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-2" },
    update: {
      isPaid: false,
      ticketPrice: 0,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 1,
      bannerImage: "/images/alumni_tech_summit.jpg",
      bannerImages: ["/images/alumni_tech_summit.jpg"],
    },
    create: {
      id: "seed-event-2",
      title: "Career Growth Webinar",
      date: new Date("2026-10-05T15:00:00Z"),
      displayDate: "October 5, 2026",
      time: "3:00 PM",
      location: "Online",
      venueDetails: "Zoom Meeting Link provided upon booking",
      isVirtual: true,
      virtualLink: "https://meet.ipam.edu/career-growth",
      category: "WEBINAR",
      description: "Panel discussion on navigating career transitions, cross-border remote work, and executive certifications.",
      bannerImage: "/images/alumni_tech_summit.jpg",
      bannerImages: ["/images/alumni_tech_summit.jpg"],
      agenda: [{ time: "3:00 PM", activity: "Panel Discussion" }, { time: "4:00 PM", activity: "Audience Q&A" }],
      speakers: [{ name: "Dr. Fatmata Kamara", title: "Senior Economist", image: alumniSeedData[1].avatar }],
      isPaid: false,
      ticketPrice: 0,
      currency: "USD",
      capacity: 500,
      registeredCount: 1,
      status: "PUBLISHED",
      featured: false,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-3" },
    update: {
      isPaid: true,
      ticketPrice: 15,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 3,
      bannerImage: "/images/alumni_networking_mixer.jpg",
      bannerImages: [
        "/images/alumni_networking_mixer.jpg",
        "/images/ipam_university_campus_1788350001937.jpg",
      ],
      featured: true,
    },
    create: {
      id: "seed-event-3",
      title: "Freetown Young Alumni Networking Mixer",
      date: new Date("2026-11-06T18:30:00Z"),
      displayDate: "November 6, 2026",
      time: "6:30 PM",
      location: "Lumley Beach Pavilion, Freetown",
      venueDetails: "Sunset Deck, Lumley Beach Road",
      isVirtual: false,
      category: "NETWORKING",
      description: "Casual evening mixer connecting recent graduates (Classes 2018-2025) with established industry leaders in tech, banking, and public policy.",
      bannerImage: "/images/alumni_networking_mixer.jpg",
      bannerImages: [
        "/images/alumni_networking_mixer.jpg",
        "/images/ipam_university_campus_1788350001937.jpg",
      ],
      agenda: [
        { time: "6:30 PM", activity: "Arrival & Cocktails" },
        { time: "7:00 PM", activity: "Speed Mentorship Circles" },
        { time: "8:00 PM", activity: "Open Socializing" },
      ],
      speakers: [{ name: "Alex Sesay", title: "Program Manager, UNDP", image: alumniSeedData[0].avatar }],
      isPaid: true,
      ticketPrice: 15,
      currency: "USD",
      capacity: 80,
      registeredCount: 3,
      status: "PUBLISHED",
      featured: true,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-4" },
    update: {
      isPaid: true,
      ticketPrice: 25,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 3,
      featured: true,
    },
    create: {
      id: "seed-event-4",
      title: "Fintech & Digital Banking Masterclass 2026",
      date: new Date("2026-11-20T10:00:00Z"),
      displayDate: "November 20, 2026",
      time: "10:00 AM",
      location: "IPAM Innovation Hub & Online",
      venueDetails: "Auditorium C, IPAM Campus, Tower Hill",
      isVirtual: false,
      category: "CAREER_WORKSHOP",
      description: "Hands-on masterclass covering regulatory sandboxes, mobile money interoperability, and modern payment gateways in West Africa.",
      agenda: [
        { time: "10:00 AM", activity: "Keynote: Central Banking & Digital Rails" },
        { time: "11:30 AM", activity: "Case Studies: Orange Money & Commercial Fintechs" },
        { time: "1:00 PM", activity: "Hands-on Architecture Lab" },
      ],
      speakers: [
        { name: "Dr. Fatmata Kamara", title: "Senior Economist, Bank of Sierra Leone", image: alumniSeedData[1].avatar },
        { name: "David Koroma", title: "Fintech Engineer, Orange", image: alumniSeedData[2].avatar },
      ],
      isPaid: true,
      ticketPrice: 25,
      currency: "USD",
      capacity: 120,
      registeredCount: 3,
      status: "PUBLISHED",
      featured: true,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-5" },
    update: {
      isPaid: true,
      ticketPrice: 40,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 0,
    },
    create: {
      id: "seed-event-5",
      title: "UK & Diaspora Alumni Winter Reception",
      date: new Date("2026-12-05T19:00:00Z"),
      displayDate: "December 5, 2026",
      time: "7:00 PM",
      location: "The Royal Horseguards Hotel, London, UK",
      venueDetails: "Gladstone Library Suite, Whitehall Court, London",
      isVirtual: false,
      category: "REGIONAL_MEETUP",
      description: "Annual diaspora gathering for IPAM alumni residing in the United Kingdom and Europe. Featuring university updates from visiting faculty.",
      agenda: [{ time: "7:00 PM", activity: "Welcome Drinks" }, { time: "8:00 PM", activity: "Diaspora Chapter AGM" }],
      speakers: [{ name: "David Okoro", title: "VP Outreach", image: alumniSeedData[2].avatar }],
      isPaid: true,
      ticketPrice: 40,
      currency: "USD",
      capacity: 150,
      registeredCount: 0,
      status: "PUBLISHED",
      featured: false,
    },
  });

  await db.alumniEvent.upsert({
    where: { id: "seed-event-6" },
    update: {
      isPaid: false,
      ticketPrice: 0,
      currency: "USD",
      status: "PUBLISHED",
      registeredCount: 1,
    },
    create: {
      id: "seed-event-6",
      title: "IPAM Mentorship Network Orientation",
      date: new Date("2026-10-18T14:00:00Z"),
      displayDate: "October 18, 2026",
      time: "2:00 PM",
      location: "Online",
      venueDetails: "Zoom Meeting Room",
      isVirtual: true,
      virtualLink: "https://meet.ipam.edu/mentorship-induction",
      category: "CAREER_WORKSHOP",
      description: "Onboarding and orientation session for approved alumni mentors and final-year student mentees.",
      agenda: [{ time: "2:00 PM", activity: "Mentorship Framework & Ethics" }, { time: "3:00 PM", activity: "Mentor-Mentee Pair Breakouts" }],
      speakers: [{ name: "Mariama Jalloh", title: "Director of Operations", image: alumniSeedData[3].avatar }],
      isPaid: false,
      ticketPrice: 0,
      currency: "USD",
      capacity: 250,
      registeredCount: 1,
      status: "PUBLISHED",
      featured: false,
    },
  });

  // ---------------- Sample Bookings ----------------
  const alexUser = await db.alumniUser.findUnique({ where: { email: "demo.alumni@ipam.edu" } });
  const davidUser = await db.alumniUser.findUnique({ where: { email: "david.koroma@alumni.ipam.edu" } });
  const fatmataUser = await db.alumniUser.findUnique({ where: { email: "fatmata.kamara@alumni.ipam.edu" } });
  const mariamaUser = await db.alumniUser.findUnique({ where: { email: "mariama.jalloh@alumni.ipam.edu" } });

  // 1. Alex Sesay: Paid Gala booking (2 tickets)
  if (alexUser) {
    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-GALA-001" },
      update: {},
      create: {
        bookingReference: "BK-EVT-GALA-001",
        eventId: "seed-event-1",
        userId: alexUser.id,
        ticketCount: 2,
        unitPrice: 50,
        totalAmount: 100,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE",
        paymentRef: "pi_seed_gala_alex_01",
        bookingStatus: "CONFIRMED",
        attendeeName: "Alex Sesay",
        attendeeEmail: "demo.alumni@ipam.edu",
        attendeePhone: "+232 76 112233",
        notes: "Table 4 reservation requested with guest.",
        source: "SELF_SERVICE",
      },
    });

    // Alex Sesay: Attended Young Alumni Mixer
    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-NETW-003" },
      update: {},
      create: {
        bookingReference: "BK-EVT-NETW-003",
        eventId: "seed-event-3",
        userId: alexUser.id,
        ticketCount: 1,
        unitPrice: 15,
        totalAmount: 15,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE",
        paymentRef: "pi_seed_netw_alex_03",
        bookingStatus: "ATTENDED",
        attendedAt: new Date("2026-10-02T19:15:00Z"),
        attendeeName: "Alex Sesay",
        attendeeEmail: "demo.alumni@ipam.edu",
        attendeePhone: "+232 76 112233",
        notes: "VIP guest speaker & alumni patron badge issued.",
        source: "SELF_SERVICE",
      },
    });
  }

  // 2. David Koroma: Free Career Webinar booking & Walk-in Fintech Workshop booking
  if (davidUser) {
    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-WEBN-002" },
      update: {},
      create: {
        bookingReference: "BK-EVT-WEBN-002",
        eventId: "seed-event-2",
        userId: davidUser.id,
        ticketCount: 1,
        unitPrice: 0,
        totalAmount: 0,
        currency: "USD",
        paymentStatus: "FREE",
        paymentMethod: "FREE",
        bookingStatus: "CONFIRMED",
        attendeeName: "David Koroma",
        attendeeEmail: "david.koroma@alumni.ipam.edu",
        attendeePhone: "+232 88 554433",
        notes: "Joining live session from Freetown tech hub.",
        source: "SELF_SERVICE",
      },
    });

    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-FINTECH-005" },
      update: {},
      create: {
        bookingReference: "BK-EVT-FINTECH-005",
        eventId: "seed-event-4",
        userId: davidUser.id,
        ticketCount: 1,
        unitPrice: 25,
        totalAmount: 25,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "OFFLINE_CASH",
        paymentRef: "CASH-REG-DESK-005",
        bookingStatus: "ATTENDED",
        attendedAt: new Date("2026-10-04T10:05:00Z"),
        attendeeName: "David Koroma",
        attendeeEmail: "david.koroma@alumni.ipam.edu",
        attendeePhone: "+232 88 554433",
        notes: "Paid in person at the Registrar Desk prior to lab session.",
        source: "ADMIN_DESK",
      },
    });
  }

  // 3. Dr. Fatmata Kamara: Paid Gala booking & Fintech Workshop booking
  if (fatmataUser) {
    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-GALA-002" },
      update: {},
      create: {
        bookingReference: "BK-EVT-GALA-002",
        eventId: "seed-event-1",
        userId: fatmataUser.id,
        ticketCount: 1,
        unitPrice: 50,
        totalAmount: 50,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "BANK_TRANSFER",
        paymentRef: "wire_bsl_9921_kamara",
        bookingStatus: "CONFIRMED",
        attendeeName: "Dr. Fatmata Kamara",
        attendeeEmail: "fatmata.kamara@alumni.ipam.edu",
        attendeePhone: "+232 78 443322",
        notes: "Central Bank corporate table guest.",
        source: "SELF_SERVICE",
      },
    });

    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-FINTECH-004" },
      update: {},
      create: {
        bookingReference: "BK-EVT-FINTECH-004",
        eventId: "seed-event-4",
        userId: fatmataUser.id,
        ticketCount: 2,
        unitPrice: 25,
        totalAmount: 50,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "STRIPE",
        paymentRef: "pi_seed_fintech_fatmata_04",
        bookingStatus: "CONFIRMED",
        attendeeName: "Dr. Fatmata Kamara",
        attendeeEmail: "fatmata.kamara@alumni.ipam.edu",
        attendeePhone: "+232 78 443322",
        notes: "Keynote speaker pass + research assistant seat.",
        source: "SELF_SERVICE",
      },
    });
  }

  // 4. Mariama Jalloh: Complimentary Gala ticket & Mentorship Orientation
  if (mariamaUser) {
    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-GALA-006" },
      update: {},
      create: {
        bookingReference: "BK-EVT-GALA-006",
        eventId: "seed-event-1",
        userId: mariamaUser.id,
        ticketCount: 1,
        unitPrice: 50,
        totalAmount: 50,
        currency: "USD",
        paymentStatus: "PAID",
        paymentMethod: "COMPLIMENTARY",
        paymentRef: "COMP-EXEC-PASS-2026",
        bookingStatus: "CONFIRMED",
        attendeeName: "Mariama Jalloh",
        attendeeEmail: "mariama.jalloh@alumni.ipam.edu",
        attendeePhone: "+232 77 665544",
        notes: "Executive Alumni Council VIP complimentary admission.",
        source: "ADMIN_DESK",
      },
    });

    await db.eventRegistration.upsert({
      where: { bookingReference: "BK-EVT-MENTOR-007" },
      update: {},
      create: {
        bookingReference: "BK-EVT-MENTOR-007",
        eventId: "seed-event-6",
        userId: mariamaUser.id,
        ticketCount: 1,
        unitPrice: 0,
        totalAmount: 0,
        currency: "USD",
        paymentStatus: "FREE",
        paymentMethod: "FREE",
        bookingStatus: "ATTENDED",
        attendedAt: new Date("2026-10-01T14:02:00Z"),
        attendeeName: "Mariama Jalloh",
        attendeeEmail: "mariama.jalloh@alumni.ipam.edu",
        attendeePhone: "+232 77 665544",
        notes: "Mentor orientation session leader.",
        source: "SELF_SERVICE",
      },
    });
  }

  // 5. Walk-in Guest without an account: Networking Mixer
  await db.eventRegistration.upsert({
    where: { bookingReference: "BK-EVT-NETW-008" },
    update: {},
    create: {
      bookingReference: "BK-EVT-NETW-008",
      eventId: "seed-event-3",
      userId: null,
      ticketCount: 2,
      unitPrice: 15,
      totalAmount: 30,
      currency: "USD",
      paymentStatus: "PAID",
      paymentMethod: "OFFLINE_CASH",
      paymentRef: "CASH-DOOR-3301",
      bookingStatus: "CONFIRMED",
      attendeeName: "Samuel Browne",
      attendeeEmail: "samuel.browne@guest.sl",
      attendeePhone: "+232 77 998877",
      notes: "Walk-in registration at the venue entrance. Cash collected by Registrar.",
      source: "ADMIN_DESK",
    },
  });

  // 6. Cancelled & Refunded ticket: Gala
  await db.eventRegistration.upsert({
    where: { bookingReference: "BK-EVT-GALA-009" },
    update: {},
    create: {
      bookingReference: "BK-EVT-GALA-009",
      eventId: "seed-event-1",
      userId: null,
      ticketCount: 1,
      unitPrice: 50,
      totalAmount: 50,
      currency: "USD",
      paymentStatus: "REFUNDED",
      paymentMethod: "STRIPE",
      paymentRef: "ref_seed_refund_kallon_09",
      bookingStatus: "CANCELLED",
      attendeeName: "Kallon Bangura",
      attendeeEmail: "kallon.b@alumni.ipam.edu",
      attendeePhone: "+232 30 112233",
      notes: "Cancelled due to emergency travel; refund processed.",
      source: "SELF_SERVICE",
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
      bannerImage:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDHF48nWTEz7bPDMDEBe2lGoslnq28w7woy6xDiHqlP72TjTT6XvumtqD0b7z_cos7vG_S1aFaH3KGHjVSn0trPEfTW56GRE3EWPwt0XNXMfZ3cViim4nKTI4oTsLR8cvMOUi55KVS1etzuhlIm82HxhIte0rFY2HqUkxP2SPov66uidqvh-a4h8wURkZd27H-WpbiCOHaeJgptGDcjriLIRmXw1vR_l4bsvbPKCvdP63L99w6j5PAT",
      status: "APPROVED",
      submittedByType: "ADMIN",
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

  // ---------------- Physical Card Pricing & Options Setting ----------------
  await db.systemSetting.upsert({
    where: { key: "physical_card_pricing" },
    update: {},
    create: {
      key: "physical_card_pricing",
      value: {
        currency: "USD",
        shippingFee: 0,
        codEnabled: true,
        stripeEnabled: true,
        tiers: {
          STANDARD_PVC: {
            name: "Standard PVC Card",
            price: 15,
            description: "High-durability laminated PVC card with embedded QR identifier and campus barcode.",
            features: [
              "UV-resistant laminated PVC body",
              "High-contrast QR code for instant scan",
              "Standard tracked postal courier",
            ],
            enabled: true,
          },
          GOLD_RFID_SMART: {
            name: "Gold RFID Smart Card",
            price: 35,
            description: "Smart 13.56MHz RFID chip card with metallic gold foil finish for contactless campus gate access.",
            features: [
              "13.56MHz high-frequency RFID contactless chip",
              "Reflective metallic gold leaf border & insignia",
              "Direct turnstile, library & faculty gate tap access",
              "Priority express courier dispatch",
            ],
            enabled: true,
          },
          EXECUTIVE_TITANIUM: {
            name: "Executive Titanium Card",
            price: 75,
            description: "Heavy solid metal titanium card with precision laser engraving and dual RFID + NFC chips.",
            features: [
              "Solid aerospace-grade titanium core (18g)",
              "Deep fiber-laser precision engraving",
              "Dual-frequency smart chip (NFC + RFID)",
              "Priority global DHL/FedEx courier with signature tracking",
              "Lifetime card replacement warranty",
            ],
            enabled: true,
          },
        },
      },
    },
  });

  const eventCount = await db.alumniEvent.count();
  const jobCount = await db.jobOpening.count();
  console.log("\n✅ Seed complete.\n");
  console.log("Demo credentials (password for all seeded accounts below):", DEMO_PASSWORD);
  console.log("  Alumni login  → demo.alumni@ipam.edu");
  console.log("  Admin login   → demo.admin@ipam.edu (Super Administrator)");
  console.log("  Admin login   → demo.registrar@ipam.edu (Registrar — directory + id_cards only)");
  console.log(`\nSeeded ${alumniSeedData.length} alumni, 3 admin roles, 2 admin users, ${jobCount} jobs, ${eventCount} events, 1 business.\n`);
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
