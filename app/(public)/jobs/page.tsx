import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import JobsView from "@/components/public/JobsView";

export default async function JobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; category?: string; type?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const isSavedFilter = resolvedParams.saved === "true" || resolvedParams.saved === "1";

  const session = await getAlumniSession();
  if (isSavedFilter && !session) {
    redirect("/login?redirect=/jobs?saved=true");
  }

  let savedJobIds: string[] = [];
  let myPostedJobsCount = 0;
  let myApplicationsMap: Record<
    string,
    {
      id: string;
      status: string;
      applicationRef: string;
      appliedDate: string;
      interviewDate?: string | null;
      offerSalary?: string | null;
      decisionStatus?: string | null;
    }
  > = {};

  if (session) {
    const [saved, profile, applications] = await Promise.all([
      db.savedJob.findMany({ where: { userId: session.sub }, select: { jobId: true } }),
      db.alumniMember.findUnique({ where: { userId: session.sub }, select: { id: true } }),
      db.jobOpeningApplication.findMany({
        where: { alumniUserId: session.sub },
        select: {
          id: true,
          jobId: true,
          status: true,
          applicationRef: true,
          createdAt: true,
          interviewDate: true,
          offerSalary: true,
          decisionStatus: true,
        },
      }),
    ]);
    savedJobIds = saved.map((s) => s.jobId);
    if (profile) {
      myPostedJobsCount = await db.jobOpening.count({
        where: { postedByAlumniId: profile.id },
      });
    }
    for (const app of applications) {
      myApplicationsMap[app.jobId] = {
        id: app.id,
        status: app.status,
        applicationRef: app.applicationRef,
        appliedDate: app.createdAt.toISOString(),
        interviewDate: app.interviewDate ? app.interviewDate.toISOString() : null,
        offerSalary: app.offerSalary,
        decisionStatus: app.decisionStatus,
      };
    }
  }

  const jobs = await db.jobOpening.findMany({
    where: isSavedFilter ? { id: { in: savedJobIds } } : undefined,
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

  return (
    <JobsView
      savedJobIds={savedJobIds}
      initialSaved={isSavedFilter}
      myPostedJobsCount={myPostedJobsCount}
      myApplicationsMap={myApplicationsMap}
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
