import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { updateJobApplicationSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const gate = await requirePermission(req, "JOBS", "canRead");
  if (gate instanceof NextResponse) return gate;

  const { appId } = await params;
  const application = await db.jobApplication.findUnique({ where: { id: appId }, include: { job: true } });
  if (!application) return fail(404, "Application not found");
  return ok(application);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const gate = await requirePermission(req, "JOBS", "canWrite");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName = (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ?? "Admin";

  const { appId } = await params;
  const existing = await db.jobApplication.findUnique({ where: { id: appId } });
  if (!existing) return fail(404, "Application not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = updateJobApplicationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const application = await db.jobApplication.update({ where: { id: appId }, data: parsed.data });

  if (parsed.data.status && parsed.data.status !== existing.status) {
    const { ipAddress, location, deviceInfo } = requestMeta(req);
    await writeAuditLog({
      actorAdminId: admin.id,
      actorName: admin.name,
      actorEmail: admin.email,
      actorRole: roleName,
      action: "JOB_APPLICATION_STATUS_CHANGED",
      actionLabel: "Candidate Pipeline Status Update",
      category: "SYSTEM_CORE",
      target: `Application: ${existing.candidateName}`,
      targetType: "Job Application",
      status: "SUCCESS",
      severity: "INFO",
      ipAddress,
      location,
      deviceInfo,
      details: `Candidate ${existing.candidateName} moved from ${existing.status} to ${parsed.data.status}.`,
      beforeState: { status: existing.status },
      afterState: { status: parsed.data.status },
    });
  }

  return ok(application);
}
