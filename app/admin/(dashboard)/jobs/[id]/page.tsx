import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import JobDetailView from "@/components/admin/jobs/JobDetailView";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.adminJobListing.findUnique({
    where: { id },
    include: { applications: { orderBy: { appliedDate: "desc" } } },
  });
  if (!job) notFound();

  return (
    <JobDetailView
      job={{
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        status: job.status,
        salaryRange: job.salaryRange,
        description: job.description,
        applications: job.applications.map((a) => ({
          id: a.id,
          candidateName: a.candidateName,
          degree: a.degree,
          faculty: a.faculty,
          gradYear: a.gradYear,
          email: a.email,
          phone: a.phone,
          status: a.status,
          matchScore: a.matchScore,
          experienceYears: a.experienceYears,
          coverNote: a.coverNote,
          offerSalary: a.offerSalary,
          decisionStatus: a.decisionStatus,
        })),
      }}
    />
  );
}
