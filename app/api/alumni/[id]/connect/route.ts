import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAlumniSession();
  if (!session) return fail(401, "You must be signed in to connect with alumni");
  const { id: targetProfileId } = await params;

  const targetProfile = await db.alumniMember.findUnique({ where: { id: targetProfileId } });
  if (!targetProfile) return fail(404, "Alumni not found");
  if (targetProfile.userId === session.sub) return fail(400, "You can't connect with yourself");

  const existing = await db.alumniBookmark.findUnique({
    where: { ownerId_targetId: { ownerId: session.sub, targetId: targetProfile.userId } },
  });
  if (existing) return ok({ connected: true });

  await db.alumniBookmark.create({ data: { ownerId: session.sub, targetId: targetProfile.userId } });
  return ok({ connected: true }, 201);
}
