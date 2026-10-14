import { db } from "@/lib/db";
import { parseBannerRecord, seedDefaultBannersIfEmpty } from "@/lib/commercial-banners";
import CommercialBannersView from "@/components/admin/commercial/CommercialBannersView";

export const dynamic = "force-dynamic";

export default async function CommercialPage() {
  const count = await db.sponsorBanner.count();
  if (count === 0) {
    await seedDefaultBannersIfEmpty();
  }

  const [banners, businessesRaw] = await Promise.all([
    db.sponsorBanner.findMany({ orderBy: { name: "asc" } }),
    db.alumniBusiness.findMany({
      include: {
        user: {
          select: {
            email: true,
            studentId: true,
            profile: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const parsedBanners = banners.map((b) => ({
    ...parseBannerRecord(b),
    invoiceNumber: b.invoiceNumber,
    invoiceStatus: b.invoiceStatus,
    subscriptionCadence: b.subscriptionCadence,
  }));

  return (
    <CommercialBannersView
      banners={parsedBanners}
      businesses={businessesRaw.map((b) => ({
        id: b.id,
        name: b.name,
        founders: b.founders,
        classYear: b.classYear,
        category: b.category,
        industry: b.industry,
        tagline: b.tagline,
        description: b.description,
        website: b.website,
        location: b.location,
        contactEmail: b.contactEmail,
        contactPhone: b.contactPhone,
        image: b.image,
        bannerImage: b.bannerImage,
        logo: b.logo,
        featured: b.featured,
        status: b.status,
        submittedByType: b.submittedByType,
        rejectionReason: b.rejectionReason,
        userId: b.userId,
        services: Array.isArray(b.services) ? (b.services as string[]) : null,
        createdAt: b.createdAt.toISOString(),
        user: b.user
          ? {
              email: b.user.email,
              profile: b.user.profile
                ? {
                    name: b.user.profile.name,
                    avatar: b.user.profile.avatar,
                  }
                : null,
            }
          : null,
      }))}
    />
  );
}
