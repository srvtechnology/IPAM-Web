import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/permissions";
import { writeAuditLog, requestMeta } from "@/lib/audit";
import { selectApplicationSchema } from "@/lib/validation/admin-jobs";
import { ok, fail } from "@/lib/api-response";

// Records a selection/offer decision on a candidate — ported from the legacy
// admin portal's SelectionOfferModal flow.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const gate = await requirePermission(req, "JOBS", "canApprove");
  if (gate instanceof NextResponse) return gate;
  const { admin } = gate;
  const roleName = (await db.adminRoleDefinition.findUnique({ where: { id: admin.roleId }, select: { name: true } }))?.name ?? "Admin";

  const { appId } = await params;
  const existing = await db.jobApplication.findUnique({ where: { id: appId } });
  if (!existing) return fail(404, "Application not found");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");
  const parsed = selectApplicationSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const application = await db.jobApplication.update({
    where: { id: appId },
    data: {
      ...parsed.data,
      selectedDate: new Date(),
      status: "SELECTED",
    },
  });

  const { ipAddress, location, deviceInfo } = requestMeta(req);
  await writeAuditLog({
    actorAdminId: admin.id,
    actorName: admin.name,
    actorEmail: admin.email,
    actorRole: roleName,
    action: "CANDIDATE_SELECTED",
    actionLabel: "Candidate Selection & Offer Recorded",
    category: "SYSTEM_CORE",
    target: `Application: ${existing.candidateName}`,
    targetType: "Job Application",
    status: "SUCCESS",
    severity: "NOTICE",
    ipAddress,
    location,
    deviceInfo,
    details: `${existing.candidateName} selected with offer ${parsed.data.offerSalary}, decision status ${parsed.data.decisionStatus}.`,
    beforeState: { status: existing.status },
    afterState: { status: "SELECTED", decisionStatus: parsed.data.decisionStatus },
  });

  return ok(application);
}
