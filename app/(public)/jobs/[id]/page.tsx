import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import JobDetailView from "@/components/public/JobDetailView";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: { postedByAlumni: true },
  });
  if (!job) notFound();

  const session = await getAlumniSession();
  let saved = false;
  let application = null;
  if (session) {
    const [savedRow, applicationRow] = await Promise.all([
      db.savedJob.findUnique({ where: { userId_jobId: { userId: session.sub, jobId: id } } }),
      db.jobOpeningApplication.findUnique({
        where: { jobId_alumniUserId: { jobId: id, alumniUserId: session.sub } },
      }),
    ]);
    saved = !!savedRow;
    application = applicationRow;
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
              linkedinUrl: application.linkedinUrl,
              coverNote: application.coverNote,
              createdAt: application.createdAt.toISOString(),
            }
          : null
      }
      job={{
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        workplaceType: job.workplaceType,
        salary: job.salary,
        category: job.category,
        description: job.description,
        responsibilities: (job.responsibilities as string[] | null) ?? null,
        requirements: job.requirements as string[],
        benefits: (job.benefits as string[] | null) ?? null,
        aboutCompany: job.aboutCompany,
        postedByAlumni: job.postedByAlumni
          ? {
              name: job.postedByAlumni.name,
              classYear: job.postedByAlumni.classYear,
              currentRole: job.postedByAlumni.currentRole,
              avatar: job.postedByAlumni.avatar,
            }
          : null,
        deadline: job.deadline.toISOString(),
        applyUrl: job.applyUrl,
        saved,
      }}
    />
  );
}
