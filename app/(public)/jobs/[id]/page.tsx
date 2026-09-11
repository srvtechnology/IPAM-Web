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
  if (session) {
    const savedRow = await db.savedJob.findUnique({
      where: { userId_jobId: { userId: session.sub, jobId: id } },
    });
    saved = !!savedRow;
  }

  return (
    <JobDetailView
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
