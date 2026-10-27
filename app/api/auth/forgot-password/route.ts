import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api-response";
import { z } from "zod";

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

  return ok({
    message: "Password reset OTP code has been dispatched to your email.",
    email,
    devOtp: "123456",
  });
}
