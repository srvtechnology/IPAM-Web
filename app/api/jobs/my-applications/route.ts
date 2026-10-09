import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAlumniSession();
  if (!session) {
    return fail(401, "You must be signed in to view your applications");
  }

  const applications = await db.jobOpeningApplication.findMany({
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
          description: true,
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
  });

  return ok({
    applications: applications.map((app) => ({
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
      cvUrl: app.cvUrl,
      cvFileName: app.cvFileName,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
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
    })),
  });
}
