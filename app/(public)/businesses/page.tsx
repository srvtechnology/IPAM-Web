import { db } from "@/lib/db";
import BusinessesView from "@/components/public/BusinessesView";

export default async function BusinessesPage() {
  const businesses = await db.alumniBusiness.findMany({ orderBy: [{ featured: "desc" }, { createdAt: "desc" }] });

  return (
    <BusinessesView
      businesses={businesses.map((b) => ({
        id: b.id,
        name: b.name,
        founders: b.founders,
        classYear: b.classYear,
        category: b.category,
        industry: b.industry,
        tagline: b.tagline,
        description: b.description,
        location: b.location,
        featured: b.featured,
        image: b.image,
        services: Array.isArray(b.services) ? (b.services as string[]) : [],
      }))}
    />
  );
}
