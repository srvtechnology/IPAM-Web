import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Pre-validates whether an email address or student ID is already registered or pending.
 * Useful for real-time form validation in Web and Mobile applications.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const emailParam = searchParams.get("email")?.trim().toLowerCase();
  const studentIdParam = searchParams.get("studentId")?.trim();

  if (!emailParam && !studentIdParam) {
    return fail(400, "Please provide an email or studentId parameter to check.");
  }

  // 1. Check email
  if (emailParam) {
    const existingEmailUser = await db.alumniUser.findUnique({
      where: { email: emailParam },
      include: { alumniRecord: true },
    });

    if (existingEmailUser) {
      const isRejected =
        existingEmailUser.status === "REJECTED" ||
        existingEmailUser.alumniRecord?.status === "REJECTED";

      if (!isRejected) {
        const isPending =
          existingEmailUser.status === "PENDING" ||
          existingEmailUser.alumniRecord?.status === "PENDING";

        return ok({
          exists: true,
          field: "email",
          status: isPending ? "PENDING" : "APPROVED",
          message: isPending
            ? "An application with this email address is already pending administrator approval."
            : "An account with this email address already exists. Please sign in.",
        });
      }
    }
  }

  // 2. Check studentId
  if (studentIdParam) {
    const [existingStudentIdUser, existingRegNoRecord] = await Promise.all([
      db.alumniUser.findUnique({
        where: { studentId: studentIdParam },
        include: { alumniRecord: true },
      }),
      db.alumniRecord.findUnique({
        where: { regNo: studentIdParam },
        include: { alumniUser: true },
      }),
    ]);

    const studentUser = existingStudentIdUser || existingRegNoRecord?.alumniUser;
    if (studentUser) {
      const isRejected =
        studentUser.status === "REJECTED" ||
        existingRegNoRecord?.status === "REJECTED";

      if (!isRejected) {
        const isPending =
          studentUser.status === "PENDING" ||
          existingRegNoRecord?.status === "PENDING";

        return ok({
          exists: true,
          field: "studentId",
          status: isPending ? "PENDING" : "APPROVED",
          message: isPending
            ? "An application with this student ID is already pending administrator approval."
            : "An account with this student ID already exists. Please sign in.",
        });
      }
    }
  }

  return ok({
    exists: false,
    field: null,
    status: null,
    message: "No existing account found. Ready for registration.",
  });
}
