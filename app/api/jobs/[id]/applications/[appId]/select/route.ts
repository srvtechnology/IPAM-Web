import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, getAlumniSession } from "@/lib/auth/session";
import { selectApplicationSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: jobId, appId } = await params;
  const application = await db.jobOpeningApplication.findUnique({
    where: { id: appId },
    include: { job: true },
  });

  if (!application || application.jobId !== jobId) {
    return fail(404, "Candidate application not found");
  }

  const adminSession = await getAdminSession();
  const alumniSession = await getAlumniSession();

  let isAuthorized = false;
  if (adminSession) {
    isAuthorized = true;
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({
      where: { userId: alumniSession.sub },
      select: { id: true },
    });
    if (profile && application.job.postedByAlumniId === profile.id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to make hiring selection decisions for this job");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = selectApplicationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const updated = await db.jobOpeningApplication.update({
    where: { id: appId },
    data: {
      offerSalary: parsed.data.offerSalary,
      startDate: parsed.data.startDate,
      decisionStatus: parsed.data.decisionStatus,
      recruiterRemarks: parsed.data.recruiterRemarks || null,
      selectedDate: new Date(),
      status: "SELECTED",
    },
    include: { job: true },
  });

  if (adminSession) {
    const admin = await db.adminUser.findUnique({
      where: { id: adminSession.sub },
      include: { role: true },
    });
    if (admin) {
      const { ipAddress, location, deviceInfo } = requestMeta(req);
      await writeAuditLog({
        actorAdminId: admin.id,
        actorName: admin.name,
        actorEmail: admin.email,
        actorRole: admin.role.name,
        action: "CANDIDATE_SELECTED",
        actionLabel: "Candidate Selection & Offer Recorded",
        category: "SYSTEM_CORE",
        target: `Application: ${application.candidateName || application.id}`,
        targetType: "Job Application",
        status: "SUCCESS",
        severity: "NOTICE",
        ipAddress,
        location,
        deviceInfo,
        details: `${application.candidateName || "Candidate"} selected with offer ${parsed.data.offerSalary}, decision status ${parsed.data.decisionStatus}.`,
        beforeState: { status: application.status },
        afterState: { status: "SELECTED", decisionStatus: parsed.data.decisionStatus },
      });
    }
  }

  return ok(updated);
}
