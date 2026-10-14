import { db } from "@/lib/db";

export interface CommercialBanner {
  id: string;
  code: string;
  name: string; // Sponsor Name
  headline: string; // Display Title
  description: string; // Tagline / offer text
  badge: string; // Category badge (e.g. "Premier Partner", "SME Banking")
  ctaText: string; // e.g. "Learn More", "Apply for Financing"
  targetUrl: string; // Click destination
  bannerImageUrl: string; // Image URL
  slot: string; // Target page link(s) or "ALL"
  pages: string[]; // Normalized array of pages
  order: number;
  active: boolean;
  impressions: number;
  clicks: number;
  ctr: string;
  monthlyFee: string;
  contract: string;
  contactName?: string | null;
  contactEmail?: string | null;
  industry?: string | null;
  dimensions?: string | null;
  createdAt?: string;
}

export const COMMERCIAL_PAGE_OPTIONS = [
  { value: "ALL", label: "All Pages (Global Bottom Banner)", path: "*" },
  { value: "/", label: "Home Page (/)", path: "/" },
  { value: "/directory", label: "Alumni Directory (/directory)", path: "/directory" },
  { value: "/events", label: "Events & Reunions (/events)", path: "/events" },
  { value: "/jobs", label: "Career & Jobs Portal (/jobs)", path: "/jobs" },
  { value: "/businesses", label: "Alumni Enterprises (/businesses)", path: "/businesses" },
  { value: "/giving", label: "Giving Fund & Endowments (/giving)", path: "/giving" },
] as const;

export const BANNER_IMAGE_PRESETS = [
  {
    id: "preset-banking",
    title: "Commercial Banking & SME Finance",
    url: "/images/sponsor_banking_banner.jpg",
    category: "Banking & Finance",
  },
  {
    id: "preset-telecom",
    title: "Enterprise 5G & Fiber Internet",
    url: "/images/sponsor_telecom_banner.jpg",
    category: "Telecommunications",
  },
  {
    id: "preset-tech-summit",
    title: "Innovation & Digital Tech Summit",
    url: "/images/alumni_tech_summit.jpg",
    category: "Technology",
  },
  {
    id: "preset-mixer",
    title: "Executive Networking & Mentorship",
    url: "/images/alumni_networking_mixer.jpg",
    category: "Corporate Services",
  },
  {
    id: "preset-gala",
    title: "Executive Gala & Honours",
    url: "/images/alumni_gala_event_1788454750646.jpg",
    category: "Leadership & Honors",
  },
  {
    id: "preset-campus",
    title: "IPAM Tower Hill Campus",
    url: "/images/ipam_university_campus_1788350001937.jpg",
    category: "Institutional",
  },
];

export const DEFAULT_COMMERCIAL_BANNERS_DATA = [
  {
    code: "BAN-SLCB-SME",
    name: "Sierra Leone Commercial Bank",
    headline: "SME Commercial Financing: Fueling Alumni Ventures",
    description:
      "Concessionary credit lines, equipment leasing, and trade finance solutions tailored for verified IPAM graduates and executives.",
    badge: "Premier Banking Partner",
    ctaText: "Explore Commercial Credit",
    targetUrl: "https://www.slcb.com",
    bannerImageUrl: "/images/sponsor_banking_banner.jpg",
    slot: "/",
    pages: ["/", "/businesses"],
    order: 1,
    active: true,
    monthlyFee: 350,
    contract: "CONT-SLCB-2026-Q1",
    industry: "Banking & Commercial Finance",
    contactName: "Corporate Banking Division",
    contactEmail: "sme.corporate@slcb.com",
  },
  {
    code: "BAN-AFRI-FIBER",
    name: "Africell Business & Fiber",
    headline: "High-Speed Enterprise Connectivity for Global Teams",
    description:
      "Deploy dedicated corporate fiber internet, hybrid cloud PBX, and roaming packages across West Africa with 99.9% uptime SLA.",
    badge: "Enterprise Telecom Partner",
    ctaText: "Upgrade Enterprise Fiber",
    targetUrl: "https://www.africell.sl",
    bannerImageUrl: "/images/sponsor_telecom_banner.jpg",
    slot: "/directory",
    pages: ["/directory", "/jobs"],
    order: 1,
    active: true,
    monthlyFee: 280,
    contract: "CONT-AFR-2026-004",
    industry: "Telecommunications & Cloud",
    contactName: "Enterprise Accounts Team",
    contactEmail: "enterprise@africell.sl",
  },
  {
    code: "BAN-IPAM-EXEC",
    name: "IPAM Executive Leadership Institute",
    headline: "Master Class: Strategic Governance & Public Policy",
    description:
      "Weekend executive certification programmes and accredited leadership diplomas designed for mid-to-senior alumni leaders.",
    badge: "Continuing Executive Studies",
    ctaText: "View Executive Cohorts",
    targetUrl: "/events",
    bannerImageUrl: "/images/alumni_gala_event_1788454750646.jpg",
    slot: "/events",
    pages: ["/events", "/"],
    order: 2,
    active: true,
    monthlyFee: 200,
    contract: "CONT-IPAM-EXEC-2026",
    industry: "Higher Education & Leadership",
    contactName: "Dean of Postgraduate Studies",
    contactEmail: "exec.studies@ipam.edu",
  },
  {
    code: "BAN-SALONETECH",
    name: "SaloneTech Angel Syndicate & Talent Hub",
    headline: "Connect Your Enterprise with Top West African Tech Talent",
    description:
      "Hire vetted IPAM software engineers, data analysts, and product managers. Fund your startup with seed stage alumni capital.",
    badge: "Venture & Talent Network",
    ctaText: "Discover Tech Talent",
    targetUrl: "/jobs",
    bannerImageUrl: "/images/alumni_tech_summit.jpg",
    slot: "/jobs",
    pages: ["/jobs", "/businesses"],
    order: 2,
    active: true,
    monthlyFee: 220,
    contract: "CONT-ST-2026-08",
    industry: "Technology & Venture Capital",
    contactName: "Talent Acquisition Office",
    contactEmail: "syndicate@salonetech.sl",
  },
  {
    code: "BAN-APEX-SOLAR",
    name: "Apex Clean Energy & Microgrids",
    headline: "Zero-Downtime Clean Energy for Industrial & Commercial Sites",
    description:
      "Turnkey commercial solar installations, industrial battery storage, and 24/7 backup power for IPAM alumni enterprises.",
    badge: "Clean Tech & Infrastructure",
    ctaText: "Request Energy Audit",
    targetUrl: "/businesses",
    bannerImageUrl: "/images/alumni_networking_mixer.jpg",
    slot: "/businesses",
    pages: ["/businesses", "/giving"],
    order: 1,
    active: true,
    monthlyFee: 300,
    contract: "CONT-APEX-2026-SL",
    industry: "Renewable Energy & Utilities",
    contactName: "Commercial Installations Team",
    contactEmail: "info@apexsolar.sl",
  },
  {
    code: "BAN-ENDOW-MATCH",
    name: "IPAM Corporate Philanthropy Match",
    headline: "Double Your Impact: 1:1 Corporate Endowment Match",
    description:
      "Institutional partners match all verified alumni donations to the IPAM Smart Campus Technology Lab Fund dollar-for-dollar.",
    badge: "Matching Endowment Partner",
    ctaText: "Learn About Matching Gifts",
    targetUrl: "/giving",
    bannerImageUrl: "/images/ipam_university_campus_1788350001937.jpg",
    slot: "/giving",
    pages: ["/giving", "/"],
    order: 3,
    active: true,
    monthlyFee: 150,
    contract: "CONT-ENDOW-2026",
    industry: "Institutional Development",
    contactName: "Director of Alumni Giving",
    contactEmail: "giving@ipam.edu",
  },
];

export function parseBannerRecord(banner: any): CommercialBanner {
  let headline = banner.name;
  let description = "";
  let badge = banner.industry || "Sponsored";
  let ctaText = "Learn More";
  let order = 1;
  let pages: string[] = [];

  // Parse structured notes if present
  if (banner.notes) {
    try {
      const parsed = JSON.parse(banner.notes);
      if (typeof parsed === "object" && parsed !== null) {
        if (parsed.headline) headline = parsed.headline;
        if (parsed.description) description = parsed.description;
        if (parsed.badge) badge = parsed.badge;
        if (parsed.ctaText) ctaText = parsed.ctaText;
        if (typeof parsed.order === "number") order = parsed.order;
        if (Array.isArray(parsed.pages)) pages = parsed.pages;
      }
    } catch {
      // notes was plain text
      description = banner.notes;
    }
  }

  // If pages not in notes, extract from slot
  if (pages.length === 0) {
    if (banner.slot) {
      if (banner.slot === "ALL" || banner.slot === "*") {
        pages = ["ALL"];
      } else {
        pages = banner.slot.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
    } else {
      pages = ["/"];
    }
  }

  return {
    id: banner.id,
    code: banner.code,
    name: banner.name,
    headline,
    description: description || "Explore institutional partner solutions, commercial services, and verified alumni offerings.",
    badge: badge || "Commercial Partner",
    ctaText: ctaText || "Learn More",
    targetUrl: banner.targetUrl || "#",
    bannerImageUrl: banner.bannerImageUrl || "/images/sponsor_banking_banner.jpg",
    slot: banner.slot || "/",
    pages,
    order,
    active: Boolean(banner.active),
    impressions: parseInt(banner.impressions || "0", 10) || 0,
    clicks: parseInt(banner.clicks || "0", 10) || 0,
    ctr: banner.ctr || "0%",
    monthlyFee: banner.monthlyFee ? banner.monthlyFee.toString() : "0.00",
    contract: banner.contract || "N/A",
    contactName: banner.contactName,
    contactEmail: banner.contactEmail,
    industry: banner.industry,
    dimensions: banner.dimensions,
    createdAt: banner.invoiceDate ? banner.invoiceDate.toISOString() : undefined,
  };
}

export function serializeBannerNotes(meta: {
  headline?: string;
  description?: string;
  badge?: string;
  ctaText?: string;
  order?: number;
  pages?: string[];
}): string {
  return JSON.stringify({
    headline: meta.headline,
    description: meta.description,
    badge: meta.badge,
    ctaText: meta.ctaText,
    order: meta.order ?? 1,
    pages: meta.pages ?? [],
  });
}

/**
 * Seed default banners if the sponsor_banners table is empty
 */
export async function seedDefaultBannersIfEmpty(): Promise<CommercialBanner[]> {
  const count = await db.sponsorBanner.count();
  if (count === 0) {
    for (const item of DEFAULT_COMMERCIAL_BANNERS_DATA) {
      const notesJson = serializeBannerNotes({
        headline: item.headline,
        description: item.description,
        badge: item.badge,
        ctaText: item.ctaText,
        order: item.order,
        pages: item.pages,
      });

      await db.sponsorBanner.create({
        data: {
          code: item.code,
          name: item.name,
          slot: item.pages.join(","),
          contract: item.contract,
          monthlyFee: item.monthlyFee,
          active: item.active,
          bannerImageUrl: item.bannerImageUrl,
          targetUrl: item.targetUrl,
          industry: item.industry,
          contactName: item.contactName,
          contactEmail: item.contactEmail,
          notes: notesJson,
        },
      }).catch((e) => {
        // Catch duplicate or migration race
        console.error("Error seeding banner:", e);
      });
    }
  }

  const all = await db.sponsorBanner.findMany({ orderBy: { name: "asc" } });
  return all.map(parseBannerRecord);
}

/**
 * Retrieve active commercial banners matching a given page link (e.g. "/", "/directory", "/events", "/jobs", "/businesses", "/giving")
 */
export async function getBannersForPage(pageLink: string): Promise<CommercialBanner[]> {
  try {
    let rawBanners = await db.sponsorBanner.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    if (rawBanners.length === 0) {
      await seedDefaultBannersIfEmpty();
      rawBanners = await db.sponsorBanner.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });
    }

    const normalized = rawBanners.map(parseBannerRecord);

    const matched = normalized.filter((b) => {
      if (!b.active) return false;
      if (b.pages.includes("ALL") || b.slot === "ALL" || b.slot === "*") return true;
      if (b.pages.includes(pageLink)) return true;
      if (b.slot === pageLink) return true;
      // Also match comma-separated slots
      const slotParts = b.slot.split(",").map((s) => s.trim());
      if (slotParts.includes(pageLink)) return true;
      return false;
    });

    // Sort by order ascending
    return matched.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching banners for page:", pageLink, error);
    return [];
  }
}

/**
 * Record a click on a commercial banner
 */
export async function recordBannerClick(id: string): Promise<boolean> {
  try {
    const banner = await db.sponsorBanner.findUnique({ where: { id } });
    if (!banner) return false;

    const clicksNum = (parseInt(banner.clicks || "0", 10) || 0) + 1;
    const impressionsNum = Math.max(parseInt(banner.impressions || "0", 10) || 0, clicksNum);
    const ctrPct = impressionsNum > 0 ? ((clicksNum / impressionsNum) * 100).toFixed(1) + "%" : "0%";

    await db.sponsorBanner.update({
      where: { id },
      data: {
        clicks: clicksNum.toString(),
        ctr: ctrPct,
      },
    });

    return true;
  } catch (error) {
    console.error("Error recording banner click:", error);
    return false;
  }
}

/**
 * Record impressions for an array of banner IDs
 */
export async function recordBannerImpressions(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    for (const id of ids) {
      const banner = await db.sponsorBanner.findUnique({ where: { id } });
      if (!banner) continue;

      const impressionsNum = (parseInt(banner.impressions || "0", 10) || 0) + 1;
      const clicksNum = parseInt(banner.clicks || "0", 10) || 0;
      const ctrPct = impressionsNum > 0 ? ((clicksNum / impressionsNum) * 100).toFixed(1) + "%" : "0%";

      await db.sponsorBanner.update({
        where: { id },
        data: {
          impressions: impressionsNum.toString(),
          ctr: ctrPct,
        },
      });
    }
  } catch (error) {
    console.error("Error recording impressions:", error);
  }
}
