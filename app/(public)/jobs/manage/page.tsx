import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import EmployerHireManagementView from "@/components/public/EmployerHireManagementView";

export const metadata = {
  title: "Hire Management & My Jobs | IPAM Alumni Portal",
  description: "Manage your posted job listings, evaluate applicant dossiers, shortlist candidates, and extend job offers.",
};

export default async function ManageJobsPage() {
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

  const jobs = await db.jobOpening.findMany({
    where: { postedByAlumniId: profile.id },
    orderBy: { postedDate: "desc" },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <EmployerHireManagementView
      alumniProfileName={profile.name}
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
    />
  );
}
