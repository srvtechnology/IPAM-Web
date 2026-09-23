import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { alumniRegisterSchema } from "@/lib/validation/auth";
import { ok, fail } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail(400, "Invalid JSON body");

    const parsed = alumniRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return fail(400, "Validation failed", { issues: parsed.error.flatten() });
    }
    const input = parsed.data;

    // Normalize email & studentId
    const email = input.email.trim().toLowerCase();
    const studentId = input.studentId.trim();

    // 2FA OTP verification: Default OTP is 123456
    if (input.otp !== "123456") {
      return fail(400, "Invalid two-factor authentication OTP code. For test environment, enter 123456.");
    }

    // Compute avatar initials from full name
    const initials = input.name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // Check existing records in AlumniUser and AlumniRecord
    const [existingEmailUser, existingStudentIdUser, existingRegNoRecord] = await Promise.all([
      db.alumniUser.findUnique({ where: { email }, include: { profile: true, alumniRecord: true } }),
      db.alumniUser.findUnique({ where: { studentId }, include: { profile: true, alumniRecord: true } }),
      db.alumniRecord.findUnique({ where: { regNo: studentId }, include: { alumniUser: true } }),
    ]);

    // Conflict: email and studentId belong to two different AlumniUser accounts
    if (existingEmailUser && existingStudentIdUser && existingEmailUser.id !== existingStudentIdUser.id) {
      return fail(409, "The provided email and student ID belong to two different accounts.");
    }

    const existingUser = existingEmailUser || existingStudentIdUser;

    // Check if the student ID is already linked to a different, non-rejected user
    if (existingRegNoRecord?.alumniUserId) {
      if (existingUser && existingRegNoRecord.alumniUserId !== existingUser.id) {
        const otherUser = existingRegNoRecord.alumniUser;
        if (otherUser && otherUser.status !== "REJECTED") {
          return fail(409, "An account with this student/registration ID already exists.");
        }
      } else if (!existingUser) {
        const otherUser = existingRegNoRecord.alumniUser;
        if (otherUser && otherUser.status !== "REJECTED") {
          return fail(409, "An account with this student/registration ID already exists.");
        }
      }
    }

    // -----------------------------------------------------------------------
    // Re-submission flow for existing rejected user
    // -----------------------------------------------------------------------
    if (existingUser) {
      const isRejected = existingUser.status === "REJECTED" || existingUser.alumniRecord?.status === "REJECTED";

      if (!isRejected) {
        if (existingUser.status === "PENDING" || existingUser.alumniRecord?.status === "PENDING") {
          return fail(409, "An application with this email or student ID is already pending administrator approval.");
        }
        return fail(409, "An approved account with this email or student ID already exists. Please sign in.");
      }

      const passwordHash = await hashPassword(input.password);

      const user = await db.$transaction(async (tx) => {
        // 1. Update AlumniUser
        const updatedUser = await tx.alumniUser.update({
          where: { id: existingUser.id },
          data: {
            email,
            studentId,
            passwordHash,
            status: "PENDING",
            rejectionReason: null,
            isVerifiedAlumni: false,
            profile: {
              upsert: {
                create: {
                  name: input.name.trim(),
                  classYear: input.classYear,
                  degree: input.degree,
                  major: input.major,
                  currentRole: input.currentRole,
                  company: input.company,
                  location: input.location,
                  country: input.country,
                  industry: input.industry,
                  bio: input.bio,
                  isMentor: input.isMentor,
                },
                update: {
                  name: input.name.trim(),
                  classYear: input.classYear,
                  degree: input.degree,
                  major: input.major,
                  currentRole: input.currentRole,
                  company: input.company,
                  location: input.location,
                  country: input.country,
                  industry: input.industry,
                  bio: input.bio,
                  isMentor: input.isMentor,
                },
              },
            },
          },
          include: { profile: true },
        });

        // 2. Find existing record linked to this user
        const linkedRecord = await tx.alumniRecord.findUnique({
          where: { alumniUserId: existingUser.id },
        });

        if (linkedRecord) {
          // If studentId changed, check conflict with other records
          if (linkedRecord.regNo !== studentId) {
            const conflict = await tx.alumniRecord.findUnique({ where: { regNo: studentId } });
            if (conflict && conflict.id !== linkedRecord.id) {
              if (conflict.alumniUserId && conflict.alumniUserId !== existingUser.id) {
                throw new Error("STUDENT_ID_CONFLICT");
              }
              // If conflict is an unlinked record, remove it to allow updating the linked record's regNo
              await tx.alumniRecord.delete({ where: { id: conflict.id } });
            }
          }

          await tx.alumniRecord.update({
            where: { id: linkedRecord.id },
            data: {
              name: input.name.trim(),
              email,
              regNo: studentId,
              initials,
              degree: input.degree,
              faculty: input.major,
              gradYear: input.classYear,
              authStatus: "OTP_VERIFIED",
              status: "PENDING",
              rejectionReason: null,
            },
          });
        } else {
          // Check if an unlinked record with this regNo exists
          const existingByRegNo = await tx.alumniRecord.findUnique({ where: { regNo: studentId } });
          if (existingByRegNo) {
            await tx.alumniRecord.update({
              where: { id: existingByRegNo.id },
              data: {
                alumniUserId: updatedUser.id,
                name: input.name.trim(),
                email,
                initials,
                degree: input.degree,
                faculty: input.major,
                gradYear: input.classYear,
                authStatus: "OTP_VERIFIED",
                status: "PENDING",
                rejectionReason: null,
              },
            });
          } else {
            await tx.alumniRecord.create({
              data: {
                alumniUserId: updatedUser.id,
                name: input.name.trim(),
                email,
                regNo: studentId,
                initials,
                degree: input.degree,
                faculty: input.major,
                gradYear: input.classYear,
                authStatus: "OTP_VERIFIED",
                status: "PENDING",
                rejectionReason: null,
              },
            });
          }
        }

        return updatedUser;
      });

      const { passwordHash: _omit, ...safeUser } = user;
      return ok(
        {
          message: "Registration re-submitted successfully. Your application is now pending administrator review.",
          status: "PENDING",
          user: safeUser,
        },
        200
      );
    }

    // -----------------------------------------------------------------------
    // New registration flow
    // -----------------------------------------------------------------------
    const passwordHash = await hashPassword(input.password);

    const user = await db.$transaction(async (tx) => {
      const created = await tx.alumniUser.create({
        data: {
          email,
          studentId,
          passwordHash,
          status: "PENDING",
          isVerifiedAlumni: false,
          rejectionReason: null,
          profile: {
            create: {
              name: input.name.trim(),
              classYear: input.classYear,
              degree: input.degree,
              major: input.major,
              currentRole: input.currentRole,
              company: input.company,
              location: input.location,
              country: input.country,
              industry: input.industry,
              bio: input.bio,
              isMentor: input.isMentor,
            },
          },
        },
        include: { profile: true },
      });

      // Link to existing unlinked AlumniRecord or create new one
      const existingRecord = await tx.alumniRecord.findUnique({ where: { regNo: studentId } });
      if (existingRecord) {
        if (existingRecord.alumniUserId && existingRecord.alumniUserId !== created.id) {
          throw new Error("STUDENT_ID_CONFLICT");
        }
        await tx.alumniRecord.update({
          where: { id: existingRecord.id },
          data: {
            alumniUserId: created.id,
            name: input.name.trim(),
            email,
            initials,
            degree: input.degree,
            faculty: input.major,
            gradYear: input.classYear,
            authStatus: "OTP_VERIFIED",
            status: "PENDING",
            rejectionReason: null,
          },
        });
      } else {
        await tx.alumniRecord.create({
          data: {
            alumniUserId: created.id,
            name: input.name.trim(),
            email,
            regNo: studentId,
            initials,
            degree: input.degree,
            faculty: input.major,
            gradYear: input.classYear,
            authStatus: "OTP_VERIFIED",
            status: "PENDING",
            rejectionReason: null,
          },
        });
      }

      return created;
    });

    const { passwordHash: _omit, ...safeUser } = user;
    return ok(
      {
        message: "Registration submitted successfully. Your account is pending administrator approval.",
        status: "PENDING",
        user: safeUser,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_ID_CONFLICT") {
      return fail(409, "An account with this student/registration ID already exists.");
    }
    console.error("Registration error:", error);
    return fail(500, "Registration failed due to a server error. Please try again.");
  }
}
