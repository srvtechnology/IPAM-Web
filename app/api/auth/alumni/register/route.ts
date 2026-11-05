import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { alumniRegisterSchema } from "@/lib/validation/auth";
import { ok, fail } from "@/lib/api-response";
import { verifyOtp } from "@/lib/auth/otp";
import { notifyAlumniRegistrationReceived } from "@/lib/notifications";

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

    // Check existing records in AlumniUser and AlumniRecord
    const [existingEmailUser, existingStudentIdUser, existingRegNoRecord] = await Promise.all([
      db.alumniUser.findUnique({ where: { email }, include: { profile: true, alumniRecord: true } }),
      db.alumniUser.findUnique({ where: { studentId }, include: { profile: true, alumniRecord: true } }),
      db.alumniRecord.findUnique({ where: { regNo: studentId }, include: { alumniUser: true } }),
    ]);

    // Conflict: email and studentId belong to two different AlumniUser accounts
    if (existingEmailUser && existingStudentIdUser && existingEmailUser.id !== existingStudentIdUser.id) {
      return fail(409, "The provided email and student ID belong to two different accounts.", {
        code: "CREDENTIALS_CONFLICT",
      });
    }

    // Explicit check 1: Email already exists and is not rejected
    if (existingEmailUser) {
      const isRejected =
        existingEmailUser.status === "REJECTED" ||
        existingEmailUser.alumniRecord?.status === "REJECTED";

      if (!isRejected) {
        if (
          existingEmailUser.status === "PENDING" ||
          existingEmailUser.alumniRecord?.status === "PENDING"
        ) {
          return fail(
            409,
            "An application with this email address is already pending administrator approval.",
            {
              code: "PENDING_APPROVAL",
              status: "PENDING",
              field: "email",
              email,
            }
          );
        }
        return fail(
          409,
          "An account with this email address already exists. Please sign in.",
          {
            code: "USER_ALREADY_EXISTS",
            status: "APPROVED",
            field: "email",
            email,
          }
        );
      }
    }

    // Explicit check 2: Student ID already belongs to an existing user account
    if (existingStudentIdUser) {
      const isRejected =
        existingStudentIdUser.status === "REJECTED" ||
        existingStudentIdUser.alumniRecord?.status === "REJECTED";

      if (!isRejected) {
        if (
          existingStudentIdUser.status === "PENDING" ||
          existingStudentIdUser.alumniRecord?.status === "PENDING"
        ) {
          return fail(
            409,
            "An application with this student ID is already pending administrator approval.",
            {
              code: "PENDING_APPROVAL",
              status: "PENDING",
              field: "studentId",
              studentId,
            }
          );
        }
        return fail(
          409,
          "An account with this student ID already exists. Please sign in.",
          {
            code: "USER_ALREADY_EXISTS",
            status: "APPROVED",
            field: "studentId",
            studentId,
          }
        );
      }
    }

    const existingUser = existingEmailUser || existingStudentIdUser;

    // Explicit check 3: Student ID is already linked to another non-rejected record
    if (existingRegNoRecord?.alumniUserId) {
      if (!existingUser || existingRegNoRecord.alumniUserId !== existingUser.id) {
        const otherUser = existingRegNoRecord.alumniUser;
        if (otherUser && otherUser.status !== "REJECTED") {
          if (otherUser.status === "PENDING" || existingRegNoRecord.status === "PENDING") {
            return fail(
              409,
              "An application with this student ID is already pending administrator approval.",
              {
                code: "PENDING_APPROVAL",
                status: "PENDING",
                field: "studentId",
                studentId,
              }
            );
          }
          return fail(
            409,
            "An account with this student ID already exists. Please sign in.",
            {
              code: "USER_ALREADY_EXISTS",
              status: "APPROVED",
              field: "studentId",
              studentId,
            }
          );
        }
      }
    }

    // Explicit check 4: General check on existing user record
    if (existingUser) {
      const isRejected =
        existingUser.status === "REJECTED" || existingUser.alumniRecord?.status === "REJECTED";
      if (!isRejected) {
        if (existingUser.status === "PENDING" || existingUser.alumniRecord?.status === "PENDING") {
          return fail(
            409,
            "An application with this email or student ID is already pending administrator approval.",
            {
              code: "PENDING_APPROVAL",
              status: "PENDING",
              email: existingUser.email,
              studentId: existingUser.studentId,
            }
          );
        }
        return fail(
          409,
          "An approved account with this email or student ID already exists. Please sign in.",
          {
            code: "USER_ALREADY_EXISTS",
            status: "APPROVED",
            email: existingUser.email,
            studentId: existingUser.studentId,
          }
        );
      }
    }

    // 2FA OTP verification: Verifies dynamic OTP dispatched via SMTP email
    const otpVerification = verifyOtp({
      email,
      code: input.otp,
      purpose: "REGISTRATION",
    });

    if (!otpVerification.valid) {
      return fail(400, otpVerification.error || "Invalid two-factor authentication OTP code.");
    }

    // Compute avatar initials from full name
    const initials = input.name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    // -----------------------------------------------------------------------
    // Re-submission flow for existing rejected user
    // -----------------------------------------------------------------------
    if (existingUser) {

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

    // Dispatch welcome email to alumnus and registration review alert to admin
    notifyAlumniRegistrationReceived({
      name: input.name.trim(),
      email,
      studentId,
      degree: input.degree,
      gradYear: input.classYear,
    }).catch((err) => console.error("[Registration] Email notification error:", err));

    const { passwordHash: _omit, ...safeUser } = user;
    return ok(
      {
        message: "Registration submitted successfully. Your account is pending administrator approval.",
        status: "PENDING",
        user: safeUser,
      },
      201
    );
  } catch (error: any) {
    if (error instanceof Error && error.message === "STUDENT_ID_CONFLICT") {
      return fail(409, "An account with this student ID already exists. Please sign in.", {
        code: "USER_ALREADY_EXISTS",
        field: "studentId",
      });
    }

    // Prisma Unique constraint violation (P2002)
    if (error?.code === "P2002" || String(error?.message).includes("Unique constraint")) {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(" ")
        : String(error?.meta?.target || "");

      if (target.includes("email") || String(error?.message).includes("email")) {
        return fail(409, "An account with this email address already exists. Please sign in.", {
          code: "USER_ALREADY_EXISTS",
          field: "email",
        });
      }

      if (
        target.includes("studentId") ||
        target.includes("regNo") ||
        String(error?.message).includes("studentId") ||
        String(error?.message).includes("regNo")
      ) {
        return fail(409, "An account with this student ID already exists. Please sign in.", {
          code: "USER_ALREADY_EXISTS",
          field: "studentId",
        });
      }

      return fail(409, "An account with this email or student ID already exists. Please sign in.", {
        code: "USER_ALREADY_EXISTS",
      });
    }

    console.error("Registration error:", error);
    return fail(500, "Registration failed due to a server error. Please try again.");
  }
}
