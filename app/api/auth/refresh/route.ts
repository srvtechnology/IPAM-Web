import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyAlumniToken, signAlumniToken } from "@/lib/auth/jwt";
import { setAlumniSessionCookie } from "@/lib/auth/session";
import { ok, fail } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let token: string | null = null;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    const body = await req.json().catch(() => null);
    if (body?.token) {
      token = body.token;
    }
  }

  if (!token) {
    return fail(401, "Authorization Bearer token is required for refresh");
  }

  const payload = await verifyAlumniToken(token);
  if (!payload) {
    return fail(401, "Token is invalid or expired");
  }

  const user = await db.alumniUser.findUnique({
    where: { id: payload.sub },
    include: {
      profile: true,
      alumniRecord: true,
    },
  });

  if (!user || user.status !== "APPROVED") {
    return fail(401, "User account is inactive or not found");
  }

  const newToken = await setAlumniSessionCookie({
    sub: user.id,
    email: user.email,
  });

  const { passwordHash: _omit, ...safeUser } = user;
  return ok({
    token: newToken,
    user: safeUser,
  });
}
