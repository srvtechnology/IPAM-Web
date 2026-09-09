import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { setAlumniSessionCookie } from "@/lib/auth/session";
import { alumniRegisterSchema } from "@/lib/validation/auth";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = alumniRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }
  const input = parsed.data;

  const [existingEmail, existingStudentId] = await Promise.all([
    db.alumniUser.findUnique({ where: { email: input.email } }),
    db.alumniUser.findUnique({ where: { studentId: input.studentId } }),
  ]);
  if (existingEmail) return fail(409, "An account with this email already exists");
  if (existingStudentId) return fail(409, "An account with this student/registration ID already exists");

  const passwordHash = await hashPassword(input.password);

  const user = await db.$transaction(async (tx) => {
    const created = await tx.alumniUser.create({
      data: {
        email: input.email,
        passwordHash,
        studentId: input.studentId,
        profile: {
          create: {
            name: input.name,
            classYear: input.classYear,
            degree: input.degree,
            major: input.major,
            currentRole: input.currentRole,
            company: input.company,
            location: input.location,
            country: input.country,
            industry: input.industry,
            bio: input.bio,
          },
        },
      },
      include: { profile: true },
    });

    // Every public self-registration must be visible to the admin Alumni
    // Directory & Verification module — without this, real signups never
    // appear anywhere an admin can review/approve them.
    await tx.alumniRecord.create({
      data: {
        alumniUserId: created.id,
        name: input.name,
        email: input.email,
        regNo: input.studentId,
        degree: input.degree,
        faculty: input.major,
        gradYear: input.classYear,
        authStatus: "UNVERIFIED",
        status: "PENDING",
      },
    });

    return created;
  });

  await setAlumniSessionCookie({ sub: user.id, email: user.email });

  const { passwordHash: _omit, ...safeUser } = user;
  return ok(safeUser, 201);
}
