import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import JobDetailView from "@/components/admin/jobs/JobDetailView";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: {
      employer: true,
      postedByAlumni: true,
      postedByAdmin: true,
      applications: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!job) notFound();

  return (
    <JobDetailView
      job={{
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        country: job.country,
        state: job.state,
        city: job.city,
        status: job.status,
        salaryRange: job.salary,
        type: job.type,
        workplaceType: job.workplaceType,
        experienceRequired: job.experienceRequired,
        experienceLevel: job.experienceLevel,
        hiringType: job.hiringType,
        positionsOpen: job.positionsOpen,
        aboutCompany: job.aboutCompany,
        description: job.description,
        postedByType: job.postedByType,
        postedByName: job.postedByName || job.postedByAdmin?.name || job.postedByAlumni?.name || "Member",
        postedByTitle: job.postedByTitle || job.postedByAdmin?.title || job.postedByAlumni?.currentRole || "",
        postedDate: job.postedDate.toISOString(),
        closingDate: job.deadline ? job.deadline.toISOString() : null,
        applications: job.applications.map((a) => ({
          id: a.id,
          candidateName: a.candidateName || "Direct Candidate",
          degree: a.degree || "IPAM Graduate",
          faculty: a.faculty || "—",
          gradYear: a.gradYear || 2024,
          email: a.email || "—",
          phone: a.phone || "—",
          status: a.status,
          matchScore: a.matchScore,
          experienceYears: a.experienceYears,
          coverNote: a.coverNote,
          linkedinUrl: a.linkedinUrl,
          interviewDate: a.interviewDate ? a.interviewDate.toISOString() : null,
          notes: a.notes,
          selectedDate: a.selectedDate ? a.selectedDate.toISOString() : null,
          offerSalary: a.offerSalary,
          startDate: a.startDate ? a.startDate.toISOString() : null,
          decisionStatus: a.decisionStatus,
          recruiterRemarks: a.recruiterRemarks,
          createdAt: a.createdAt.toISOString(),
        })),
      }}
    />
  );
}
