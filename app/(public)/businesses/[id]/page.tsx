import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import BusinessDetailView from "@/components/public/BusinessDetailView";

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await db.alumniBusiness.findUnique({ where: { id } });
  if (!business) notFound();

  return (
    <BusinessDetailView
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
        yearFounded: business.yearFounded,
        companySize: business.companySize,
        website: business.website,
        location: business.location,
        contactEmail: business.contactEmail,
        contactPhone: business.contactPhone,
        linkedin: business.linkedin,
        certifications: (business.certifications as string[] | null) ?? null,
      }}
    />
  );
}
