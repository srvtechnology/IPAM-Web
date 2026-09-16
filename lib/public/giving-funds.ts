export type FundId = "scholarship" | "innovation" | "emergency" | "faculty";

export interface FundMeta {
  id: FundId;
  title: string;
  tagline: string;
  description: string;
  badge: string;
  impactNote: string;
  goal: number;
}

// `title` doubles as the exact string stored in Donation.fund — keep this the
// single source of truth so app/(public)/giving/page.tsx's Prisma groupBy
// (real "raised"/"donorsCount" per fund) and GivingView's submission payload
// always agree on the same fund identifiers.
export const GIVING_FUNDS: FundMeta[] = [
  {
    id: "scholarship",
    title: "Undergraduate & Merit Scholarship Endowment",
    tagline: "Empowering promising students with full tuition & learning supplies",
    description:
      "Provides need-based grants covering annual tuition, mandatory university fees, and course literature for talented scholars facing financial hardship.",
    badge: "Highest Priority",
    impactNote: "320+ students supported across 4 faculties",
    goal: 150000,
  },
  {
    id: "innovation",
    title: "Campus AI, Computing & Innovation Labs",
    tagline: "Modernizing technological infrastructure & high-speed connectivity",
    description:
      "Funds modern computing hardware, gigabit fiber internet, cloud compute credits, and AI development software for computer science and data analytics students.",
    badge: "Campus Tech",
    impactNote: "3 campus labs upgraded with 85 new workstations",
    goal: 120000,
  },
  {
    id: "emergency",
    title: "Student Emergency Hardship Relief",
    tagline: "Rapid financial assistance during unexpected personal crises",
    description:
      "Disburses immediate safety-net micro-grants within 48 hours for students coping with sudden family bereavement, medical emergencies, or housing displacement.",
    badge: "Immediate Relief",
    impactNote: "85+ urgent crises resolved with zero dropouts",
    goal: 50000,
  },
  {
    id: "faculty",
    title: "Faculty Excellence & Academic Research",
    tagline: "Sponsoring visiting scholars & curriculum accreditation",
    description:
      "Supports peer-reviewed research publications, international academic fellowships, faculty curriculum upgrades, and global university partnerships.",
    badge: "Academic Quality",
    impactNote: "14 research grants & 2 visiting scholar chairs",
    goal: 60000,
  },
];
