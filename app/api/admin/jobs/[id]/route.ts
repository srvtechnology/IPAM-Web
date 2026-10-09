import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { updateAdminJobSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";
import { formatLocation } from "@/lib/locations-data";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const job = await db.jobOpening.findUnique({
    where: { id },
    include: {
      employer: true,
      postedByAlumni: {
        select: { id: true, name: true, classYear: true, currentRole: true, company: true, avatar: true },
      },
      postedByAdmin: {
        select: { id: true, name: true, title: true, department: true },
      },
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          alumniUser: {
            select: {
              email: true,
              profile: {
                select: { name: true, degree: true, major: true, classYear: true, avatar: true },
              },
            },
          },
        },
      },
      _count: { select: { applications: true } },
    },
  });
  if (!job) return fail(404, "Job listing not found");
  return ok(job);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateAdminJobSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.city || parsed.data.state || parsed.data.country) {
    data.location = formatLocation(parsed.data.city, parsed.data.state, parsed.data.country);
  }
  if (parsed.data.salaryRange && !parsed.data.salary) {
    data.salary = parsed.data.salaryRange;
  }
  if (parsed.data.closingDate && !parsed.data.deadline) {
    data.deadline = parsed.data.closingDate;
  }
  delete data.salaryRange;
  delete data.closingDate;
  delete data.workMode;
  delete data.skillsRequired;

  const job = await db.jobOpening.update({
    where: { id },
    data: data as never,
    include: {
      employer: true,
      postedByAlumni: true,
      postedByAdmin: true,
    },
  }).catch(() => null);

  if (!job) return fail(404, "Job listing not found");
  return ok(job);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePermission(req, "JOBS", "canDelete");
  if (gate instanceof NextResponse) return gate;

  const { id } = await params;
  await db.jobOpening.delete({ where: { id } }).catch(() => null);
  return ok({ deleted: true });
}
