import type { NextRequest } from "next/server";
import { POST as handleForgotPassword } from "@/app/api/auth/forgot-password/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleForgotPassword(req);
}
