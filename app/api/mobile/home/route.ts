import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);

  const [
    heroSlides,
    banners,
    featuredEvents,
    latestJobs,
    councilLeaders,
    totalAlumni,
    totalJobs,
    totalEvents,
    totalBusinesses,
  ] = await Promise.all([
    ((db as any).heroSlide?.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      take: 5,
    }) ?? Promise.resolve([])) as Promise<any[]>,
    ((db as any).commercialBanner?.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      take: 6,
    }) ?? Promise.resolve([])) as Promise<any[]>,
    db.alumniEvent.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { date: "asc" },
      take: 4,
    }),
    db.jobOpening.findMany({
      where: { status: "ACTIVE" },
      orderBy: { postedDate: "desc" },
      take: 6,
      include: {
        _count: { select: { applications: true } },
      },
    }),
    db.leadershipMember.findMany({
      take: 6,
    }),
    db.alumniUser.count({ where: { status: "APPROVED" } }),
    db.jobOpening.count({ where: { status: "ACTIVE" } }),
    db.alumniEvent.count({ where: { status: "PUBLISHED" } }),
    db.alumniBusiness.count({ where: { status: "APPROVED" } }),
  ]);

  let userContext = null;
  if (session) {
    const [user, savedJobsCount, applicationsCount, registrationsCount, unreadNotifsCount] =
      await Promise.all([
        db.alumniUser.findUnique({
          where: { id: session.sub },
          include: { profile: true },
        }),
        db.savedJob.count({ where: { userId: session.sub } }),
        db.jobOpeningApplication.count({ where: { alumniUserId: session.sub } }),
        db.eventRegistration.count({
          where: { userId: session.sub, bookingStatus: { not: "CANCELLED" } },
        }),
        db.alumniNotification.count({
          where: { userId: session.sub, isRead: false },
        }).catch(() => 0),
      ]);

    if (user && user.profile) {
      userContext = {
        id: user.id,
        email: user.email,
        studentId: user.studentId,
        name: user.profile.name,
        avatar: user.profile.avatar,
        classYear: user.profile.classYear,
        degree: user.profile.degree,
        major: user.profile.major,
        membershipTier: user.membershipTier,
        isVerifiedAlumni: user.isVerifiedAlumni,
        savedJobsCount,
        applicationsCount,
        registrationsCount,
        unreadNotificationsCount: unreadNotifsCount,
      };
    }
  }

  return ok({
    heroSlides,
    banners,
    featuredEvents: featuredEvents.map((evt: any) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      date: evt.date,
      location: evt.location,
      category: evt.category,
      bannerImage: evt.bannerImage,
      capacity: evt.capacity,
      registeredCount: evt.registeredCount,
      isFree: !evt.isPaid,
      ticketPrice: evt.isPaid ? Number(evt.ticketPrice) : 0,
      currency: evt.currency,
    })),
    latestJobs: latestJobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      type: job.type,
      workplaceType: job.workplaceType,
      salary: job.salary,
      category: job.category,
      description: job.description,
      requirements: job.requirements,
      postedDate: job.postedDate,
      applicationsCount: job._count?.applications ?? 0,
    })),
    councilLeaders: councilLeaders.map((lead: any) => ({
      id: lead.id,
      name: lead.name,
      role: lead.role,
      title: lead.title,
      classYear: lead.classYear ? `Class of ${lead.classYear}` : "",
      avatarUrl: lead.avatar || lead.image,
      bio: lead.bio,
      linkedin: lead.linkedin,
    })),
    stats: {
      totalAlumni,
      totalJobs,
      totalEvents,
      totalBusinesses,
    },
    userContext,
  });
}
