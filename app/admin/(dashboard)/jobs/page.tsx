import { db } from "@/lib/db";
import AdminJobsView from "@/components/admin/jobs/AdminJobsView";

export default async function AdminJobsPage() {
  const [jobs, employers] = await Promise.all([
    db.adminJobListing.findMany({
      orderBy: { postedDate: "desc" },
      include: { employer: { select: { name: true } }, _count: { select: { applications: true } } },
    }),
    db.employerDetail.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AdminJobsView
      jobs={jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        employer: j.employer,
        location: j.location,
        type: j.type,
        status: j.status,
        closingDate: j.closingDate.toISOString(),
        applicantsCount: j._count.applications,
      }))}
      employers={employers}
    />
  );
}
