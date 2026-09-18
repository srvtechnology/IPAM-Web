import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BusinessDetailView from "@/components/public/BusinessDetailView";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) notFound();

  const relatedBusinessesRaw = await db.alumniBusiness.findMany({
    where: { id: { not: id } },
    orderBy: { createdAt: "desc" },
    take: 3,
  });

  return (
    <BusinessDetailView
      relatedBusinesses={relatedBusinessesRaw.map((b) => ({
        id: b.id,
        name: b.name,
        image: b.image,
        category: b.category,
        classYear: b.classYear,
        description: b.description,
        location: b.location,
      }))}
      business={{
        id: business.id,
        name: business.name,
        founders: business.founders,
        classYear: business.classYear,
        category: business.category,
        industry: business.industry,
        tagline: business.tagline,
        description: business.description,
        about: business.about,
        image: business.image,
        logo: business.logo,
        services: (business.services as string[] | null) ?? null,
        keyProducts: (business.keyProducts as { name: string; description: string }[] | null) ?? null,
        yearFounded: business.yearFounded,
        companySize: business.companySize,
        website: business.website,
        location: business.location,
        contactEmail: business.contactEmail,
        contactPhone: business.contactPhone,
        certifications: (business.certifications as string[] | null) ?? null,
        featured: business.featured,
      }}
    />
  );
}
