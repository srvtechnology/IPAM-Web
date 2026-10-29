import type { NextRequest } from "next/server";
import { POST as handleResetPassword } from "@/app/api/auth/reset-password/route";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return handleResetPassword(req);
}
