import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export async function GET() {
  const session = await getAlumniSession();
  if (!session) return fail(401, "Not authenticated");

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
    include: { profile: { include: { skills: true } } },
  });
  if (!user) return fail(401, "Not authenticated");

  const { passwordHash: _omit, ...safeUser } = user;
  return ok(safeUser);
}
