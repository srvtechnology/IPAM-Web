import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { ok, fail } from "@/lib/api-response";
import { z } from "zod";
import { verifyOtp } from "@/lib/auth/otp";

const resetPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  otp: z.string().min(4, "Valid OTP is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { email, otp, newPassword } = parsed.data;

  // Validate 2FA OTP code (accepts emailed dynamic code or test code 123456)
  const verification = verifyOtp({
    email,
    code: otp,
    purpose: "PASSWORD_RESET",
  });

  if (!verification.valid) {
    return fail(400, verification.error || "Invalid or expired password reset OTP code.");
  }

  const user = await db.alumniUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    return fail(404, "No account found matching this email address.");
  }

  const passwordHash = await hashPassword(newPassword);
  await db.alumniUser.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return ok({
    message: "Password has been reset successfully. You can now log in with your new password.",
  });
}
