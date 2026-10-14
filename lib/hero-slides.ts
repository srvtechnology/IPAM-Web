import { db } from "@/lib/db";

export interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  badge?: string;
  caption?: string;
  altText?: string;
  order: number;
  active: boolean;
  ctaText?: string;
  ctaLink?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SETTING_KEY_HERO_SLIDES = "hero_carousel_slides";

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-campus-01",
    imageUrl: "/images/ipam_university_campus_1788350001937.jpg",
    title: "Connect. Empower. Excel.",
    subtitle: "The Official Association for IPAM Graduates Worldwide",
    badge: "University of Sierra Leone • IPAM Global Network",
    caption: "IPAM Tower Hill Campus • Freetown, Sierra Leone",
    altText: "Institute of Public Administration and Management (IPAM) Campus",
    order: 1,
    active: true,
    ctaText: "Join Alumni Network",
    ctaLink: "/register",
    createdAt: new Date().toISOString(),
  },
  {
    id: "slide-gala-02",
    imageUrl: "/images/alumni_gala_event_1788454750646.jpg",
    title: "Celebrate Legacy. Inspire Tomorrow.",
    subtitle: "Honoring 35+ Years of Leadership Across Public & Private Sectors",
    badge: "Alumni Excellence • Global Gathering",
    caption: "Annual IPAM Global Alumni Gala & Honors Banquet",
    altText: "Annual IPAM Alumni Gala and Awards Ceremony",
    order: 2,
    active: true,
    ctaText: "Explore Events & Galas",
    ctaLink: "/events",
    createdAt: new Date().toISOString(),
  },
  {
    id: "slide-tech-03",
    imageUrl: "/images/alumni_tech_summit.jpg",
    title: "Driving Africa's Digital Frontier.",
    subtitle: "Alumni Spearheading FinTech, Public Policy & Strategic Governance",
    badge: "Tech Pioneers • Enterprise Innovation",
    caption: "IPAM Innovation & Digital Leadership Summit",
    altText: "IPAM Alumni Technology and Innovation Summit",
    order: 3,
    active: true,
    ctaText: "Discover Enterprises",
    ctaLink: "/businesses",
    createdAt: new Date().toISOString(),
  },
  {
    id: "slide-mixer-04",
    imageUrl: "/images/alumni_networking_mixer.jpg",
    title: "Stronger Together Across 45+ Nations.",
    subtitle: "Connecting Emerging Scholars With Global Corporate Mentors",
    badge: "Worldwide Chapters • Lifelong Network",
    caption: "Executive Networking & Mentorship Mixer",
    altText: "IPAM Alumni Global Networking and Mentorship Mixer",
    order: 4,
    active: true,
    ctaText: "Find Classmates",
    ctaLink: "/directory",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Get active slides for the public home page.
 */
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SETTING_KEY_HERO_SLIDES },
    });

    if (!record || !record.value) {
      return DEFAULT_HERO_SLIDES.filter((s) => s.active);
    }

    const slides = record.value as unknown as HeroSlide[];
    if (!Array.isArray(slides) || slides.length === 0) {
      return DEFAULT_HERO_SLIDES.filter((s) => s.active);
    }

    return slides
      .filter((s) => s && s.active !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Failed to load hero slides from database, using fallback:", error);
    return DEFAULT_HERO_SLIDES.filter((s) => s.active);
  }
}

/**
 * Get all slides (active & inactive) for admin management.
 */
export async function getAllAdminHeroSlides(): Promise<HeroSlide[]> {
  try {
    const record = await db.systemSetting.findUnique({
      where: { key: SETTING_KEY_HERO_SLIDES },
    });

    if (!record || !record.value) {
      return DEFAULT_HERO_SLIDES;
    }

    const slides = record.value as unknown as HeroSlide[];
    if (!Array.isArray(slides) || slides.length === 0) {
      return DEFAULT_HERO_SLIDES;
    }

    return slides.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("Failed to load admin hero slides:", error);
    return DEFAULT_HERO_SLIDES;
  }
}

/**
 * Save slides array to the system setting.
 */
export async function saveHeroSlides(slides: HeroSlide[]): Promise<HeroSlide[]> {
  const sorted = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  await db.systemSetting.upsert({
    where: { key: SETTING_KEY_HERO_SLIDES },
    create: {
      key: SETTING_KEY_HERO_SLIDES,
      value: sorted as any,
    },
    update: {
      value: sorted as any,
    },
  });
  return sorted;
}
