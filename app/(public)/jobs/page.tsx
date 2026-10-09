import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import JobsView from "@/components/public/JobsView";

export default async function JobsPage() {
  const jobs = await db.jobOpening.findMany({
    orderBy: { postedDate: "desc" },
    include: {
      postedByAlumni: {
        select: { id: true, name: true, classYear: true, currentRole: true, avatar: true },
      },
      postedByAdmin: {
        select: { id: true, name: true, title: true, department: true },
      },
      _count: { select: { applications: true } },
    },
  });

  const session = await getAlumniSession();
  let savedJobIds: string[] = [];
  let myPostedJobsCount = 0;

  if (session) {
    const [saved, profile] = await Promise.all([
      db.savedJob.findMany({ where: { userId: session.sub }, select: { jobId: true } }),
      db.alumniMember.findUnique({ where: { userId: session.sub }, select: { id: true } }),
    ]);
    savedJobIds = saved.map((s) => s.jobId);
    if (profile) {
      myPostedJobsCount = await db.jobOpening.count({
        where: { postedByAlumniId: profile.id },
      });
    }
  }

  return (
    <JobsView
      savedJobIds={savedJobIds}
      myPostedJobsCount={myPostedJobsCount}
      jobs={jobs.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        country: j.country,
        state: j.state,
        city: j.city,
        type: j.type,
        workplaceType: j.workplaceType,
        salary: j.salary,
        category: j.category,
        description: j.description,
        aboutCompany: j.aboutCompany,
        experienceRequired: j.experienceRequired,
        experienceLevel: j.experienceLevel,
        hiringType: j.hiringType,
        deadline: j.deadline ? j.deadline.toISOString() : null,
        positionsOpen: j.positionsOpen,
        postedByType: j.postedByType,
        postedByName: j.postedByName,
        postedByTitle: j.postedByTitle,
        postedDate: j.postedDate.toISOString(),
        applicationsCount: j._count.applications,
        postedByAlumni: j.postedByAlumni
          ? {
              id: j.postedByAlumni.id,
              name: j.postedByAlumni.name,
              classYear: j.postedByAlumni.classYear,
              currentRole: j.postedByAlumni.currentRole,
              avatar: j.postedByAlumni.avatar,
            }
          : null,
        postedByAdmin: j.postedByAdmin
          ? {
              id: j.postedByAdmin.id,
              name: j.postedByAdmin.name,
              title: j.postedByAdmin.title,
              department: j.postedByAdmin.department,
            }
          : null,
      }))}
    />
  );
}
