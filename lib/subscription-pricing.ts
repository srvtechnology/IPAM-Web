export type MembershipTierKey = "STANDARD" | "SILVER_LIFETIME" | "GOLD_PATRON";

export interface SubscriptionTierPlan {
  id: MembershipTierKey;
  name: string;
  badge: string;
  tagline: string;
  annualPrice: number;
  monthlyPrice: number;
  lifetimePrice: number;
  isFree: boolean;
  popular?: boolean;
  description: string;
  features: string[];
  color: {
    badgeBg: string;
    badgeText: string;
    border: string;
    gradient: string;
    accent: string;
  };
}

export const SUBSCRIPTION_TIERS: Record<MembershipTierKey, SubscriptionTierPlan> = {
  STANDARD: {
    id: "STANDARD",
    name: "Standard Alumni",
    badge: "Standard Member",
    tagline: "Essential Access for All Verified Graduates",
    annualPrice: 0,
    monthlyPrice: 0,
    lifetimePrice: 0,
    isFree: true,
    description: "Official alumni membership included for all verified IPAM graduates worldwide.",
    features: [
      "Verified Alumni Registry & Directory Search",
      "Digital Member ID Card with Dynamic QR Verification",
      "Alumni Job Board & Career Applications",
      "Global Chapter Meetups & Community Webinars Access",
      "Alumni Business Marketplace Directory Access",
    ],
    color: {
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-800",
      border: "border-slate-300",
      gradient: "from-slate-700 to-slate-900",
      accent: "text-slate-600",
    },
  },
  SILVER_LIFETIME: {
    id: "SILVER_LIFETIME",
    name: "Silver Patron",
    badge: "Silver Patron",
    tagline: "Distinguished Patronage & Professional Mentorship",
    annualPrice: 49,
    monthlyPrice: 5,
    lifetimePrice: 120,
    isFree: false,
    description: "Distinguished patron tier for alumni leaders supporting IPAM's endowment and mentoring scholars.",
    features: [
      "All Standard Alumni Privileges Included",
      "Silver Metallic Virtual Card Pass & Verified Badge",
      "Priority RSVP & Seating at Annual Alumni Conferences",
      "Exclusive Access to Executive Mentorship Network",
      "15% Courtesy Discount on Official Physical RFID ID Cards",
      "Quarterly Dean's Economic & Institutional Leadership Briefings",
    ],
    color: {
      badgeBg: "bg-slate-200",
      badgeText: "text-slate-900",
      border: "border-slate-400",
      gradient: "from-slate-600 via-slate-500 to-slate-800",
      accent: "text-slate-700",
    },
  },
  GOLD_PATRON: {
    id: "GOLD_PATRON",
    name: "Gold Executive Patron",
    badge: "Gold Executive Patron",
    tagline: "Premier Executive Status, VIP Privileges & Governance",
    annualPrice: 99,
    monthlyPrice: 10,
    lifetimePrice: 250,
    isFree: false,
    popular: true,
    description: "Premier executive patron status with VIP privileges, institutional governance, and concierge support.",
    features: [
      "All Silver Patron Privileges Included",
      "Executive Holographic Gold Digital Card Design",
      "VIP Reserved Seating at the Annual Alumni Gala & Award Banquet",
      "Direct Fast-Track Registrar Concierge (Transcripts, Certificates, Attestations)",
      "Post Unlimited Job Listings with Featured Recruiter Badge",
      "30% Discount on Executive Solid Titanium Physical Cards",
      "Voting Seat in Global Alumni Governance & Advisory Councils",
    ],
    color: {
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-900",
      border: "border-amber-400",
      gradient: "from-amber-600 via-amber-500 to-yellow-600",
      accent: "text-amber-600",
    },
  },
};
