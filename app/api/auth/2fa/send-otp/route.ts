import { type NextRequest } from "next/server";
import { z } from "zod";
import { sendOtp } from "@/lib/auth/otp";
import { ok, fail } from "@/lib/api-response";

const sendOtpSchema = z.object({
  email: z.string().email("Valid email address is required"),
  purpose: z.enum(["REGISTRATION", "PASSWORD_RESET", "LOGIN_2FA"]).default("REGISTRATION"),
  name: z.string().optional(),
});

export const dynamic = "force-dynamic";

/**
 * Dispatches a 6-digit 2FA OTP code to the requested email address via SMTP.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return fail(400, "Invalid JSON body");

  const parsed = sendOtpSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "Validation failed", { issues: parsed.error.flatten() });
  }

  const { email, purpose, name } = parsed.data;

  const result = await sendOtp({
    email,
    purpose,
    name,
    expiresMinutes: 15,
  });

  if (!result.success) {
    return fail(500, result.error || "Failed to dispatch verification code via SMTP email.");
  }

  return ok({
    sent: true,
    message: `A 6-digit dynamic verification code has been dispatched via SMTP email to ${email}.`,
    expiresInMinutes: 15,
  });
}
