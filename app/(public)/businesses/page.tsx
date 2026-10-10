import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import BusinessesView from "@/components/public/BusinessesView";

export default async function BusinessesPage() {
  const session = await getAlumniSession();

  const [approvedBusinesses, myBusinessesRaw] = await Promise.all([
    db.alumniBusiness.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    session
      ? db.alumniBusiness.findMany({
          where: { userId: session.sub },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  function mapBusiness(b: any) {
    return {
      id: b.id,
      name: b.name,
      founders: b.founders,
      classYear: b.classYear,
      category: b.category,
      industry: b.industry,
      tagline: b.tagline,
      description: b.description,
      about: b.about,
      location: b.location,
      featured: b.featured,
      image: b.image,
      logo: b.logo,
      bannerImage: b.bannerImage,
      website: b.website,
      contactEmail: b.contactEmail,
      contactPhone: b.contactPhone,
      status: b.status,
      submittedByType: b.submittedByType,
      userId: b.userId,
      rejectionReason: b.rejectionReason,
      services: Array.isArray(b.services) ? (b.services as string[]) : [],
      keyProducts: Array.isArray(b.keyProducts) ? (b.keyProducts as { name: string; description: string }[]) : [],
      yearFounded: b.yearFounded,
      companySize: b.companySize,
    };
  }

  return (
    <BusinessesView
      businesses={approvedBusinesses.map(mapBusiness)}
      myBusinesses={myBusinessesRaw.map(mapBusiness)}
      currentUserId={session?.sub ?? null}
    />
  );
}
