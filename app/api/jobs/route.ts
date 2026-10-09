import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession, getAdminSession } from "@/lib/auth/session";
import { createJobSchema } from "@/lib/validation/jobs";
import { ok, fail } from "@/lib/api-response";
import { formatLocation } from "@/lib/locations-data";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const workplaceType = searchParams.get("workplaceType");
  const country = searchParams.get("country");
  const q = searchParams.get("q")?.trim();
  const savedOnly = searchParams.get("saved") === "true" || searchParams.get("saved") === "1";

  let savedJobFilter: { in: string[] } | undefined = undefined;
  if (savedOnly) {
    const session = await getAlumniSession();
    if (!session) {
      return fail(401, "You must be signed in to view saved jobs");
    }
    const saved = await db.savedJob.findMany({
      where: { userId: session.sub },
      select: { jobId: true },
    });
    savedJobFilter = { in: saved.map((s) => s.jobId) };
  }

  const jobs = await db.jobOpening.findMany({
    where: {
      ...(savedJobFilter ? { id: savedJobFilter } : {}),
      ...(category && category !== "all" ? { category: category as never } : {}),
      ...(type && type !== "all" ? { type: type as never } : {}),
      ...(workplaceType && workplaceType !== "all" ? { workplaceType: workplaceType as never } : {}),
      ...(country && country !== "all" ? { country: { contains: country } } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { company: { contains: q } },
              { location: { contains: q } },
              { country: { contains: q } },
              { city: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    },
    include: {
      postedByAlumni: {
        select: { name: true, classYear: true, avatar: true, currentRole: true, id: true },
      },
      postedByAdmin: {
        select: { name: true, title: true, department: true, id: true },
      },
      _count: { select: { applications: true } },
    },
    orderBy: { postedDate: "desc" },
  });

  return ok(jobs);
}

export async function POST(req: NextRequest) {
  const alumniSession = await getAlumniSession();
  const adminSession = await getAdminSession();

  if (!alumniSession && !adminSession) {
    return fail(401, "You must be signed in as an Alumni or Admin to post a job");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const locationFormatted =
    parsed.data.location ||
    formatLocation(parsed.data.city, parsed.data.state, parsed.data.country);

  const salaryFormatted =
    parsed.data.salary ||
    (parsed.data.salaryMin && parsed.data.salaryMax
      ? `${parsed.data.currency || "SLE"} ${parsed.data.salaryMin.toLocaleString()} - ${parsed.data.salaryMax.toLocaleString()}`
      : "Competitive / Market Standard");

  let postedByType = "ALUMNI";
  let postedByAlumniId: string | null = null;
  let postedByAdminId: string | null = null;
  let postedByName: string | null = null;
  let postedByTitle: string | null = null;

  if (adminSession) {
    const admin = await db.adminUser.findUnique({ where: { id: adminSession.sub } });
    if (!admin) return fail(404, "Admin user not found");
    postedByType = "ADMIN";
    postedByAdminId = admin.id;
    postedByName = admin.name;
    postedByTitle = admin.title ? `${admin.title} (Admin)` : "Administrator";
  } else if (alumniSession) {
    const [profile, alumniUser] = await Promise.all([
      db.alumniMember.findUnique({ where: { userId: alumniSession.sub } }),
      db.alumniUser.findUnique({ where: { id: alumniSession.sub } }),
    ]);
    postedByType = "ALUMNI";
    postedByAlumniId = profile?.id || null;
    postedByName = profile?.name || alumniUser?.email.split("@")[0] || "Alumnus";
    const rolePart = profile?.currentRole || "Alumnus";
    const yearPart = profile?.classYear ? ` (Class of '${String(profile.classYear).slice(-2)})` : "";
    postedByTitle = `${rolePart}${yearPart}`;
  }

  const job = await db.jobOpening.create({
    data: {
      title: parsed.data.title,
      company: parsed.data.company,
      companyLogo: parsed.data.companyLogo,
      location: locationFormatted,
      country: parsed.data.country || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
      type: parsed.data.type,
      workplaceType: parsed.data.workplaceType || null,
      salary: salaryFormatted,
      category: parsed.data.category,
      description: parsed.data.description,
      responsibilities: parsed.data.responsibilities || [],
      requirements: parsed.data.requirements,
      benefits: parsed.data.benefits || [],
      aboutCompany: parsed.data.aboutCompany || null,
      experienceRequired: parsed.data.experienceRequired,
      experienceLevel: parsed.data.experienceLevel || null,
      hiringType: parsed.data.hiringType,
      positionsOpen: parsed.data.positionsOpen,
      deadline: parsed.data.deadline || null,
      applyUrl: parsed.data.applyUrl || null,
      employerId: parsed.data.employerId || null,
      status: "ACTIVE",
      postedByType,
      postedByName,
      postedByTitle,
      postedByAlumniId,
      postedByAdminId,
    },
    include: {
      postedByAlumni: true,
      postedByAdmin: true,
    },
  });

  return ok(job, 201);
}
