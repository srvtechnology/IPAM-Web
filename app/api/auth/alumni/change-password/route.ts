import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAlumniSession } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { ok, fail } from "@/lib/api-response";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export async function POST(req: NextRequest) {
  const session = await getAlumniSession(req);
  if (!session) return fail(401, "Authentication required");

  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await db.alumniUser.findUnique({
    where: { id: session.sub },
  });
  if (!user) return fail(404, "User not found");

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return fail(400, "Incorrect current password");

  const newHash = await hashPassword(newPassword);
  await db.alumniUser.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return ok({ message: "Password changed successfully" });
}
