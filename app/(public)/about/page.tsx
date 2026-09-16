import { db } from "@/lib/db";
import AboutView from "@/components/public/AboutView";

export default async function AboutPage() {
  const leaders = await db.leadershipMember.findMany({ include: { initiatives: true } });

  return <AboutView leaders={leaders} />;
}
