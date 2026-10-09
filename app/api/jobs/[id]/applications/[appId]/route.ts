import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession, getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";
import { updateCandidateStatusSchema } from "@/lib/validation/jobs";
import { writeAuditLog, requestMeta } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { id: jobId, appId } = await params;
  const application = await db.jobOpeningApplication.findUnique({
    where: { id: appId },
    include: {
      job: true,
      alumniUser: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
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
    return fail(403, "You do not have permission to view this application");
  }

  return ok(application);
}

export async function PATCH(
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
  let actorName = "Recruiter";
  if (adminSession) {
    isAuthorized = true;
    actorName = "Admin";
  } else if (alumniSession) {
    const profile = await db.alumniMember.findUnique({
      where: { userId: alumniSession.sub },
      select: { id: true, name: true },
    });
    if (profile && application.job.postedByAlumniId === profile.id) {
      isAuthorized = true;
      actorName = profile.name;
    }
  }

  if (!isAuthorized) {
    return fail(403, "You do not have permission to update this candidate");
  }

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateCandidateStatusSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const updated = await db.jobOpeningApplication.update({
    where: { id: appId },
    data: parsed.data,
    include: { job: true },
  });

  // If Admin made the change and status was changed, log audit
  if (adminSession && parsed.data.status && parsed.data.status !== application.status) {
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
        action: "JOB_APPLICATION_STATUS_CHANGED",
        actionLabel: "Candidate Pipeline Status Update",
        category: "SYSTEM_CORE",
        target: `Application: ${application.candidateName || application.id}`,
        targetType: "Job Application",
        status: "SUCCESS",
        severity: "INFO",
        ipAddress,
        location,
        deviceInfo,
        details: `Candidate ${application.candidateName || application.id} moved from ${application.status} to ${parsed.data.status}.`,
        beforeState: { status: application.status },
        afterState: { status: parsed.data.status },
      });
    }
  }

  return ok(updated);
}

export async function DELETE(
  _req: NextRequest,
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
    return fail(403, "You do not have permission to delete this application");
  }

  await db.jobOpeningApplication.delete({ where: { id: appId } });
  return ok({ deleted: true });
}
