import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import EmployerHireManagementView from "@/components/public/EmployerHireManagementView";

export const metadata = {
  title: "Career & Hire Management | IPAM Alumni Portal",
  description: "Track your submitted job applications, manage posted openings, evaluate applicant dossiers, and review hiring decisions.",
};

export default async function ManageJobsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await getAlumniSession();
  if (!session) {
    redirect("/login?redirect=/jobs/manage");
  }

  const profile = await db.alumniMember.findUnique({
    where: { userId: session.sub },
    select: { id: true, name: true, currentRole: true, company: true },
  });

  if (!profile) {
    redirect("/jobs");
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedTab = resolvedSearchParams.tab;

  const [jobs, myApplications] = await Promise.all([
    db.jobOpening.findMany({
      where: { postedByAlumniId: profile.id },
      orderBy: { postedDate: "desc" },
      include: {
        applications: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    db.jobOpeningApplication.findMany({
      where: { alumniUserId: session.sub },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            country: true,
            state: true,
            city: true,
            salary: true,
            type: true,
            workplaceType: true,
            category: true,
            experienceRequired: true,
            experienceLevel: true,
            hiringType: true,
            positionsOpen: true,
            deadline: true,
            status: true,
            postedDate: true,
            postedByType: true,
            postedByName: true,
          },
        },
      },
    }),
  ]);

  const defaultTab =
    requestedTab === "applied" || (jobs.length === 0 && myApplications.length > 0)
      ? "applications"
      : "posted";

  return (
    <EmployerHireManagementView
      alumniProfileName={profile.name}
      defaultTab={defaultTab}
      initialJobs={jobs.map((j) => ({
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
        positionsOpen: j.positionsOpen,
        deadline: j.deadline ? j.deadline.toISOString() : null,
        status: j.status,
        postedDate: j.postedDate.toISOString(),
        applications: j.applications.map((app) => ({
          id: app.id,
          candidateName: app.candidateName,
          email: app.email,
          phone: app.phone,
          degree: app.degree,
          faculty: app.faculty,
          gradYear: app.gradYear,
          avatarUrl: app.avatarUrl,
          experienceYears: app.experienceYears,
          matchScore: app.matchScore,
          status: app.status,
          interviewDate: app.interviewDate ? app.interviewDate.toISOString() : null,
          notes: app.notes,
          selectedDate: app.selectedDate ? app.selectedDate.toISOString() : null,
          offerSalary: app.offerSalary,
          startDate: app.startDate ? app.startDate.toISOString() : null,
          decisionStatus: app.decisionStatus,
          recruiterRemarks: app.recruiterRemarks,
          linkedinUrl: app.linkedinUrl,
          coverNote: app.coverNote,
          applicationRef: app.applicationRef,
          createdAt: app.createdAt.toISOString(),
        })),
      }))}
      initialApplications={myApplications.map((app) => ({
        id: app.id,
        jobId: app.jobId,
        applicationRef: app.applicationRef,
        candidateName: app.candidateName,
        email: app.email,
        phone: app.phone,
        degree: app.degree,
        faculty: app.faculty,
        gradYear: app.gradYear,
        experienceYears: app.experienceYears,
        matchScore: app.matchScore,
        status: app.status,
        interviewDate: app.interviewDate ? app.interviewDate.toISOString() : null,
        notes: app.notes,
        selectedDate: app.selectedDate ? app.selectedDate.toISOString() : null,
        offerSalary: app.offerSalary,
        startDate: app.startDate ? app.startDate.toISOString() : null,
        decisionStatus: app.decisionStatus,
        recruiterRemarks: app.recruiterRemarks,
        linkedinUrl: app.linkedinUrl,
        coverNote: app.coverNote,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt ? app.updatedAt.toISOString() : app.createdAt.toISOString(),
        job: {
          id: app.job.id,
          title: app.job.title,
          company: app.job.company,
          location: app.job.location,
          country: app.job.country,
          state: app.job.state,
          city: app.job.city,
          salary: app.job.salary,
          type: app.job.type,
          workplaceType: app.job.workplaceType,
          category: app.job.category,
          experienceRequired: app.job.experienceRequired,
          experienceLevel: app.job.experienceLevel,
          hiringType: app.job.hiringType,
          positionsOpen: app.job.positionsOpen,
          deadline: app.job.deadline ? app.job.deadline.toISOString() : null,
          status: app.job.status,
          postedDate: app.job.postedDate.toISOString(),
          postedByType: app.job.postedByType,
          postedByName: app.job.postedByName,
        },
      }))}
    />
  );
}
