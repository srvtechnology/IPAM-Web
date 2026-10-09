import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import JobDetailView from "@/components/public/JobDetailView";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: {
      postedByAlumni: true,
      postedByAdmin: true,
      _count: { select: { applications: true } },
    },
  });
  if (!job) notFound();

  const session = await getAlumniSession();
  let saved = false;
  let application = null;
  let isPoster = false;

  if (session) {
    const [savedRow, applicationRow, alumniProfile] = await Promise.all([
      db.savedJob.findUnique({ where: { userId_jobId: { userId: session.sub, jobId: id } } }),
      db.jobOpeningApplication.findFirst({
        where: { jobId: id, alumniUserId: session.sub },
      }),
      db.alumniMember.findUnique({ where: { userId: session.sub }, select: { id: true } }),
    ]);
    saved = !!savedRow;
    application = applicationRow;
    if (alumniProfile && job.postedByAlumniId === alumniProfile.id) {
      isPoster = true;
    }
  }

  const relatedJobsRaw = await db.jobOpening.findMany({
    where: { id: { not: id } },
    orderBy: { postedDate: "desc" },
    take: 3,
  });

  return (
    <JobDetailView
      relatedJobs={relatedJobsRaw.map((j) => ({
        id: j.id,
        title: j.title,
        company: j.company,
        category: j.category,
        type: j.type,
        salary: j.salary,
        description: j.description,
      }))}
      application={
        application
          ? {
              id: application.id,
              applicationRef: application.applicationRef,
              candidateName: application.candidateName,
              email: application.email,
              phone: application.phone,
              degree: application.degree,
              faculty: application.faculty,
              gradYear: application.gradYear,
              experienceYears: application.experienceYears,
              linkedinUrl: application.linkedinUrl,
              coverNote: application.coverNote,
              cvUrl: application.cvUrl,
              cvFileName: application.cvFileName,
              status: application.status,
              interviewDate: application.interviewDate ? application.interviewDate.toISOString() : null,
              notes: application.notes,
              selectedDate: application.selectedDate ? application.selectedDate.toISOString() : null,
              offerSalary: application.offerSalary,
              startDate: application.startDate ? application.startDate.toISOString() : null,
              decisionStatus: application.decisionStatus,
              recruiterRemarks: application.recruiterRemarks,
              matchScore: application.matchScore,
              createdAt: application.createdAt.toISOString(),
              updatedAt: application.updatedAt ? application.updatedAt.toISOString() : application.createdAt.toISOString(),
            }
          : null
      }
      isPoster={isPoster}
      applicationsCount={job._count.applications}
      job={{
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        state: job.state,
        city: job.city,
        type: job.type,
        workplaceType: job.workplaceType,
        salary: job.salary,
        category: job.category,
        description: job.description,
        responsibilities: (job.responsibilities as string[] | null) ?? null,
        requirements: (job.requirements as string[]) || [],
        benefits: (job.benefits as string[] | null) ?? null,
        aboutCompany: job.aboutCompany,
        experienceRequired: job.experienceRequired,
        experienceLevel: job.experienceLevel,
        hiringType: job.hiringType,
        positionsOpen: job.positionsOpen,
        postedByType: job.postedByType,
        postedByName: job.postedByName,
        postedByTitle: job.postedByTitle,
        postedDate: job.postedDate.toISOString(),
        postedByAlumni: job.postedByAlumni
          ? {
              id: job.postedByAlumni.id,
              name: job.postedByAlumni.name,
              classYear: job.postedByAlumni.classYear,
              currentRole: job.postedByAlumni.currentRole,
              avatar: job.postedByAlumni.avatar,
            }
          : null,
        postedByAdmin: job.postedByAdmin
          ? {
              id: job.postedByAdmin.id,
              name: job.postedByAdmin.name,
              title: job.postedByAdmin.title,
              department: job.postedByAdmin.department,
            }
          : null,
        deadline: job.deadline ? job.deadline.toISOString() : null,
        applyUrl: job.applyUrl,
        saved,
      }}
    />
  );
}
