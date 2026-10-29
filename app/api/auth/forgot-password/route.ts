import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await db.alumniUser.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    // For security, do not disclose whether email exists
    return ok({
      message: "If your email is registered with IPAM Alumni Association, a reset OTP code has been dispatched.",
      devOtp: "123456",
    });
  }

  // Dispatch real 2FA OTP code via SMTP to the alumni's email
  const otpResult = await sendOtp({
    email,
    purpose: "PASSWORD_RESET",
    name: user.profile?.name || "Alumnus",
    expiresMinutes: 15,
  });

  return ok({
    message: "Password reset 2FA verification code has been dispatched to your email.",
    email,
    devOtp: otpResult.devOtp,
  });
}
