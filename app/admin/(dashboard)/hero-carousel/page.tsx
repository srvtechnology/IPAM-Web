import { getAllAdminHeroSlides } from "@/lib/hero-slides";
import HeroCarouselManagementView from "@/components/admin/hero-carousel/HeroCarouselManagementView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Hero Banner Carousel | IPAM Admin",
  description: "Manage multiple home page hero images, titles, and ordering.",
};

export default async function AdminHeroCarouselPage() {
  const slides = await getAllAdminHeroSlides();

  return <HeroCarouselManagementView initialSlides={slides} />;
}
