import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import JobsView from "@/components/public/JobsView";

export default async function JobsPage() {
  const jobs = await db.jobOpening.findMany({
    orderBy: { postedDate: "desc" },
    include: { postedByAlumni: { select: { name: true, classYear: true } } },
  });

  const session = await getAlumniSession();
  let savedJobIds: string[] = [];
  if (session) {
    const saved = await db.savedJob.findMany({ where: { userId: session.sub }, select: { jobId: true } });
    savedJobIds = saved.map((s) => s.jobId);
  }

  return (
    <JobsView
      savedJobIds={savedJobIds}
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
        postedByAlumni: j.postedByAlumni ? { name: j.postedByAlumni.name, classYear: j.postedByAlumni.classYear } : null,
      }))}
    />
  );
}
