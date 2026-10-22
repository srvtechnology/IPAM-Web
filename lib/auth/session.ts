import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import {
  type AdminTokenPayload,
  type AlumniTokenPayload,
  signAdminToken,
  signAlumniToken,
  verifyAdminToken,
  verifyAlumniToken,
} from "@/lib/auth/jwt";

export const ALUMNI_COOKIE = "ipam_alumni_session";
export const ADMIN_COOKIE = "ipam_admin_session";

const isProd = process.env.NODE_ENV === "production";

const ALUMNI_MAX_AGE = 60 * 60 * 24 * 7; // 7 days
const ADMIN_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function setAlumniSessionCookie(payload: AlumniTokenPayload, options?: { persistent?: boolean }): Promise<string> {
  const token = await signAlumniToken(payload);
  const store = await cookies();
  const persistent = options?.persistent ?? true;
  store.set(ALUMNI_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    // "Remember me" unchecked -> a browser-session cookie (no maxAge) that's
    // gone once the browser closes, instead of persisting for 7 days.
    ...(persistent ? { maxAge: ALUMNI_MAX_AGE } : {}),
  });
  return token;
}

export async function clearAlumniSessionCookie() {
  const store = await cookies();
  store.set(ALUMNI_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function getAlumniSession(req?: NextRequest | Request): Promise<AlumniTokenPayload | null> {
  // 1. Check req header if provided
  if (req) {
    const bearer = extractBearerToken(req.headers.get("authorization"));
    if (bearer) {
      const verified = await verifyAlumniToken(bearer);
      if (verified) return verified;
    }
  }

  // 2. Check next/headers headerStore (for Flutter/API calls)
  try {
    const headerStore = await headers();
    const bearer = extractBearerToken(headerStore.get("authorization"));
    if (bearer) {
      const verified = await verifyAlumniToken(bearer);
      if (verified) return verified;
    }
  } catch {
    // Out of request scope / test environment fallback
  }

  // 3. Fallback to cookie (for web portal sessions)
  try {
    const store = await cookies();
    const token = store.get(ALUMNI_COOKIE)?.value;
    if (token) return verifyAlumniToken(token);
  } catch {
    // Out of request scope / test environment fallback
  }

  return null;
}

export async function setAdminSessionCookie(payload: AdminTokenPayload): Promise<string> {
  const token = await signAdminToken(payload);
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE,
  });
  return token;
}

export async function clearAdminSessionCookie() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getAdminSession(req?: NextRequest | Request): Promise<AdminTokenPayload | null> {
  // 1. Check req header if provided
  if (req) {
    const bearer = extractBearerToken(req.headers.get("authorization"));
    if (bearer) {
      const verified = await verifyAdminToken(bearer);
      if (verified) return verified;
    }
  }

  // 2. Check next/headers headerStore
  try {
    const headerStore = await headers();
    const bearer = extractBearerToken(headerStore.get("authorization"));
    if (bearer) {
      const verified = await verifyAdminToken(bearer);
      if (verified) return verified;
    }
  } catch {}

  // 3. Fallback to cookie
  try {
    const store = await cookies();
    const token = store.get(ADMIN_COOKIE)?.value;
    if (token) return verifyAdminToken(token);
  } catch {}

  return null;
}
