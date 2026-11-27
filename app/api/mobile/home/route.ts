import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { getHeroSlides } from "@/lib/hero-slides";
import { getBannersForPage } from "@/lib/commercial-banners";
import { normalizeActivityPhotos } from "@/lib/validation/activities";
import { ok } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAlumniSession(req);

  const [
    heroSlides,
    bottomBanners,
    featuredEvents,
    latestJobs,
    councilLeaders,
    featuredBusinesses,
    recentActivities,
    totalAlumni,
    totalJobs,
    totalEvents,
    totalBusinesses,
    totalActivities,
  ] = await Promise.all([
    getHeroSlides(),
    getBannersForPage("/"),
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
      include: { initiatives: true },
      orderBy: { classYear: "asc" },
      take: 6,
    }),
    db.alumniBusiness.findMany({
      where: { status: "APPROVED" },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
    db.alumniActivity.findMany({
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 6,
    }),
    db.alumniUser.count({ where: { status: "APPROVED" } }),
    db.jobOpening.count({ where: { status: "ACTIVE" } }),
    db.alumniEvent.count({ where: { status: "PUBLISHED" } }),
    db.alumniBusiness.count({ where: { status: "APPROVED" } }),
    db.alumniActivity.count(),
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
          where: {
            userId: session.sub,
            bookingStatus: { not: "CANCELLED" },
            paymentStatus: { in: ["PAID", "FREE"] },
          },
        }),
        db.alumniNotification
          .count({
            where: { userId: session.sub, isRead: false },
          })
          .catch(() => 0),
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
    banners: bottomBanners,
    bottomBanners,
    featuredEvents: featuredEvents.map((evt) => ({
      id: evt.id,
      title: evt.title,
      description: evt.description,
      date: evt.date,
      displayDate: evt.displayDate,
      time: evt.time,
      location: evt.location,
      category: evt.category,
      bannerImage: evt.bannerImage,
      capacity: evt.capacity,
      registeredCount: evt.registeredCount,
      isFree: !evt.isPaid,
      isPaid: evt.isPaid,
      ticketPrice: evt.isPaid ? Number(evt.ticketPrice) : 0,
      currency: evt.currency,
    })),
    latestJobs: latestJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
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
    councilLeaders: councilLeaders.map((lead) => ({
      id: lead.id,
      name: lead.name,
      role: lead.role,
      classYear: lead.classYear ? `Class of ${lead.classYear}` : "",
      avatarUrl: lead.image,
      bio: lead.bio,
      quote: lead.quote,
      initiatives: lead.initiatives.map((i) => i.title),
    })),
    featuredBusinesses,
    recentActivities: recentActivities.map((a) => {
      const photos = normalizeActivityPhotos(a.photos);
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        status: a.status,
        displayDate: a.displayDate,
        location: a.location,
        category: a.category,
        photos,
        coverPhoto: photos[0] ?? null,
        photosCount: photos.length,
        featured: a.featured,
        sortOrder: a.sortOrder,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      };
    }),
    stats: {
      totalAlumni,
      totalJobs,
      totalEvents,
      totalBusinesses,
      totalActivities,
    },
    userContext,
  });
}
