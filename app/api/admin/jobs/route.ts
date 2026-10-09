import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { createAdminJobSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";
import { formatLocation } from "@/lib/locations-data";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const jobs = await db.jobOpening.findMany({
    orderBy: { postedDate: "desc" },
    include: {
      employer: true,
      postedByAlumni: {
        select: { id: true, name: true, classYear: true, currentRole: true, company: true, avatar: true },
      },
      postedByAdmin: {
        select: { id: true, name: true, title: true, department: true },
      },
      _count: { select: { applications: true } },
    },
  });

  return ok(jobs);
}

export async function POST(req: NextRequest) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = createAdminJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const locationFormatted =
    parsed.data.location ||
    formatLocation(parsed.data.city, parsed.data.state, parsed.data.country);

  const salaryFormatted =
    parsed.data.salary ||
    parsed.data.salaryRange ||
    (parsed.data.salaryMin && parsed.data.salaryMax
      ? `${parsed.data.currency || "SLE"} ${parsed.data.salaryMin.toLocaleString()} - ${parsed.data.salaryMax.toLocaleString()}`
      : "Competitive / Market Standard");
  const deadlineDate = parsed.data.deadline || parsed.data.closingDate || null;

  const job = await db.jobOpening.create({
    data: {
      title: parsed.data.title,
      company: parsed.data.company,
      employerId: parsed.data.employerId || null,
      country: parsed.data.country || null,
      state: parsed.data.state || null,
      city: parsed.data.city || null,
      location: locationFormatted,
      type: parsed.data.type as never,
      workplaceType: (parsed.data.workplaceType || parsed.data.workMode) as never,
      salary: salaryFormatted,
      category: parsed.data.category,
      experienceRequired: parsed.data.experienceRequired ?? false,
      experienceLevel: parsed.data.experienceLevel || null,
      hiringType: parsed.data.hiringType || "TILL_DATE",
      positionsOpen: parsed.data.positionsOpen || 1,
      status: parsed.data.status || "ACTIVE",
      aboutCompany: parsed.data.aboutCompany || null,
      description: parsed.data.description || "Job opening posted by institutional administration.",
      requirements: parsed.data.requirements || ["Graduation from IPAM / University of Sierra Leone"],
      responsibilities: parsed.data.skillsRequired || [],
      benefits: parsed.data.benefits || [],
      deadline: deadlineDate,
      postedByType: "ADMIN",
      postedByAdminId: admin.id,
      postedByName: admin.name,
      postedByTitle: admin.title ? `${admin.title} (Admin)` : "Administrator",
    },
    include: {
      employer: true,
      postedByAdmin: true,
      postedByAlumni: true,
      _count: { select: { applications: true } },
    },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: "Admin",
    action: "JOB_LISTING_CREATED",
    actionLabel: "Admin Created Job Listing",
    category: "SYSTEM_CORE",
    target: `Job: ${job.title} (${job.company})`,
    targetType: "Job Opening",
    status: "SUCCESS",
    severity: "INFO",
    ipAddress,
    location,
    deviceInfo,
    details: `Admin ${admin.name} created job ${job.title} for ${job.company}.`,
    afterState: { id: job.id, title: job.title, company: job.company },
  });

  return ok(job, 201);
}
