import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { setAlumniSessionCookie } from "@/lib/auth/session";
import { alumniLoginSchema } from "@/lib/validation/auth";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = alumniLoginSchema.safeParse(body);
  if (!parsed.success) return fail(400, "Validation failed", { issues: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await db.alumniUser.findUnique({ where: { email }, include: { profile: true } });
  if (!user) return fail(401, "Invalid email or password");

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return fail(401, "Invalid email or password");

  await setAlumniSessionCookie({ sub: user.id, email: user.email });

  const { passwordHash: _omit, ...safeUser } = user;
  return ok(safeUser);
}
