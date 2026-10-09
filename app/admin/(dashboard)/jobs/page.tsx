import { db } from "@/lib/db";
import AdminJobsView from "@/components/admin/jobs/AdminJobsView";

export default async function AdminJobsPage() {
  const [jobs, employers] = await Promise.all([
    db.jobOpening.findMany({
      orderBy: { postedDate: "desc" },
      include: {
        employer: { select: { id: true, name: true } },
        postedByAlumni: { select: { id: true, name: true, classYear: true, currentRole: true } },
        postedByAdmin: { select: { id: true, name: true, title: true } },
        _count: { select: { applications: true } },
      },
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
        country: j.country,
        state: j.state,
        city: j.city,
        type: j.type,
        status: j.status,
        salary: j.salary,
        experienceRequired: j.experienceRequired,
        experienceLevel: j.experienceLevel,
        hiringType: j.hiringType,
        positionsOpen: j.positionsOpen,
        postedByType: j.postedByType,
        postedByName: j.postedByName || j.postedByAdmin?.name || j.postedByAlumni?.name || "Member",
        postedByTitle: j.postedByTitle || j.postedByAdmin?.title || j.postedByAlumni?.currentRole || "",
        postedDate: j.postedDate.toISOString(),
        closingDate: j.deadline ? j.deadline.toISOString() : null,
        applicantsCount: j._count.applications,
      }))}
      employers={employers}
    />
  );
}
