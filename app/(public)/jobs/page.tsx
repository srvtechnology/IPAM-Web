import { db } from "@/lib/db";
import JobsView from "@/components/public/JobsView";

export default async function JobsPage() {
  const jobs = await db.jobOpening.findMany({ orderBy: { postedDate: "desc" } });

  return (
    <JobsView
      jobs={jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        type: j.type,
        workplaceType: j.workplaceType,
        salary: j.salary,
        category: j.category,
        postedDate: j.postedDate.toISOString(),
      }))}
    />
  );
}
