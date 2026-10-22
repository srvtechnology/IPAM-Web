import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "You must be signed in to connect with alumni");
  const { id: targetProfileId } = await params;

  // Search by AlumniMember.id or AlumniUser.id
  let targetProfile = await db.alumniMember.findUnique({ where: { id: targetProfileId } });
  if (!targetProfile) {
    targetProfile = await db.alumniMember.findUnique({ where: { userId: targetProfileId } });
  }
  if (!targetProfile) return fail(404, "Alumni not found");
  if (targetProfile.userId === session.sub) return fail(400, "You can't connect with yourself");

  const existing = await db.alumniBookmark.findUnique({
    where: { ownerId_targetId: { ownerId: session.sub, targetId: targetProfile.userId } },
  });
  if (existing) return ok({ connected: true });

  await db.alumniBookmark.create({ data: { ownerId: session.sub, targetId: targetProfile.userId } });
  return ok({ connected: true }, 201);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "You must be signed in to disconnect alumni");
  const { id: targetProfileId } = await params;

  let targetProfile = await db.alumniMember.findUnique({ where: { id: targetProfileId } });
  if (!targetProfile) {
    targetProfile = await db.alumniMember.findUnique({ where: { userId: targetProfileId } });
  }
  if (!targetProfile) return fail(404, "Alumni not found");

  const existing = await db.alumniBookmark.findUnique({
    where: { ownerId_targetId: { ownerId: session.sub, targetId: targetProfile.userId } },
  });

  if (existing) {
    await db.alumniBookmark.delete({ where: { id: existing.id } });
  }

  return ok({ connected: false, message: "Disconnected successfully" });
}
