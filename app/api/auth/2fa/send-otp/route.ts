import { type NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendOtp } from "@/lib/auth/otp";
import { ok, fail } from "@/lib/api-response";

const sendOtpSchema = z.object({
  email: z.string().email("Valid email address is required"),
  purpose: z.enum(["REGISTRATION", "PASSWORD_RESET", "LOGIN_2FA"]).default("REGISTRATION"),
  name: z.string().optional(),
  studentId: z.string().optional(),
});

export const dynamic = "force-dynamic";

/**
 * Dispatches a 6-digit 2FA OTP code to the requested email address via SMTP.
 * Validates account existence according to purpose:
 * - If purpose is REGISTRATION: rejects if an approved or pending account already exists.
 * - If purpose is PASSWORD_RESET: rejects if no account exists for the email.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { email, purpose, name, studentId } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Robust validation: Check user existence based on purpose
  if (purpose === "REGISTRATION") {
    // 1. Check if email already exists
    const existingEmailUser = await db.alumniUser.findUnique({
      where: { email: normalizedEmail },
      include: { alumniRecord: true },
    });

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
              email: normalizedEmail,
            }
          );
        }
        return fail(
          409,
          "An account with this email address already exists. Please sign in instead.",
          {
            code: "USER_ALREADY_EXISTS",
            status: "APPROVED",
            field: "email",
            email: normalizedEmail,
          }
        );
      }
    }

    // 2. Check if student ID already exists (if provided)
    if (studentId && studentId.trim()) {
      const cleanStudentId = studentId.trim();
      const [existingStudentIdUser, existingRegNoRecord] = await Promise.all([
        db.alumniUser.findUnique({
          where: { studentId: cleanStudentId },
          include: { alumniRecord: true },
        }),
        db.alumniRecord.findUnique({
          where: { regNo: cleanStudentId },
          include: { alumniUser: true },
        }),
      ]);

      const studentUser = existingStudentIdUser || existingRegNoRecord?.alumniUser;
      if (studentUser) {
        const isRejected =
          studentUser.status === "REJECTED" ||
          existingRegNoRecord?.status === "REJECTED";

        if (!isRejected) {
          if (
            studentUser.status === "PENDING" ||
            existingRegNoRecord?.status === "PENDING"
          ) {
            return fail(
              409,
              "An application with this student ID is already pending administrator approval.",
              {
                code: "PENDING_APPROVAL",
                status: "PENDING",
                field: "studentId",
                studentId: cleanStudentId,
              }
            );
          }
          return fail(
            409,
            "An account with this student ID already exists. Please sign in instead.",
            {
              code: "USER_ALREADY_EXISTS",
              status: "APPROVED",
              field: "studentId",
              studentId: cleanStudentId,
            }
          );
        }
      }
    }
  } else if (purpose === "PASSWORD_RESET") {
    // For password reset: verify account exists
    const user = await db.alumniUser.findUnique({
      where: { email: normalizedEmail },
      include: { alumniRecord: true },
    });

    if (!user) {
      return fail(404, "No registered account found with this email address.", {
        code: "USER_NOT_FOUND",
        field: "email",
      });
    }

    if (user.status === "REJECTED" || user.alumniRecord?.status === "REJECTED") {
      return fail(
        403,
        "Your account was not approved by the administration. Please contact registrar support.",
        {
          code: "ACCOUNT_REJECTED",
          status: "REJECTED",
        }
      );
    }
  }

  const result = await sendOtp({
    email: normalizedEmail,
    purpose,
    name,
    expiresMinutes: 15,
  });

  if (!result.success) {
    return fail(500, result.error || "Failed to dispatch verification code via SMTP email.");
  }

  return ok({
    sent: true,
    message: `A 6-digit dynamic verification code has been dispatched via SMTP email to ${normalizedEmail}.`,
    expiresInMinutes: 15,
  });
}
